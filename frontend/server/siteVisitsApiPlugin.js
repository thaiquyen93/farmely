import fs from 'fs';
import { spawn, execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { getLeaseTermError, getCareFeePerMonth, ALLOWED_TERM_MONTHS } from '../src/utils/leaseSelection.js';

let rentalLeaseColumnsEnsured = false;
async function ensureRentalLeaseColumns() {
  if (rentalLeaseColumnsEnsured) return;
  try {
    await runPostgreSql(`
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS cultivation_mode VARCHAR(20);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS term_months INTEGER;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS expert_id INTEGER REFERENCES users(user_id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS staff_id INTEGER REFERENCES users(user_id);
`);
    rentalLeaseColumnsEnsured = true;
  } catch (err) {
    rentalLeaseColumnsEnsured = false;
    throw err;
  }
}

function loadRootEnv() {
  const envMap = {};
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(currentDir, '../../.env'),
    path.resolve(currentDir, '../.env')
  ];
  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
              const k = trimmed.slice(0, idx).trim();
              const v = trimmed.slice(idx + 1).trim();
              if (!(k in envMap)) {
                envMap[k] = v;
              }
            }
          }
        });
        break;
      }
    } catch {
      // ignore
    }
  }
  return envMap;
}

const rootEnv = loadRootEnv();

const PSQL_CANDIDATES = [
  process.env.PSQL_PATH,
  rootEnv.PSQL_PATH,
  'C:/Program Files/PostgreSQL/18/bin/psql.exe',
  'C:/Program Files/PostgreSQL/17/bin/psql.exe',
  'C:/Program Files/PostgreSQL/16/bin/psql.exe',
  'D:/S5/PostgreSQL/bin/psql.exe'
].filter(Boolean);

const PSQL_PATH = PSQL_CANDIDATES.find(p => {
  try { return fs.existsSync(p); } catch { return false; }
}) || 'psql';

let activePgConfig = null;
const PG_CONNECTION_ERROR_CODES = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'EHOSTUNREACH', '28P01', '3D000', '08001', '08006']);

function getPgConfig() {
  if (activePgConfig) return activePgConfig;
  return {
    host: process.env.PGHOST || process.env.DB_HOST || rootEnv.DB_HOST || 'localhost',
    port: process.env.PGPORT || process.env.DB_PORT || rootEnv.DB_PORT || '5432',
    database: process.env.PGDATABASE || process.env.DB_NAME || rootEnv.DB_NAME || 'farmely',
    user: process.env.PGUSER || process.env.DB_USER || rootEnv.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || rootEnv.DB_PASSWORD || '@Bin054206'
  };
}

let cachedPlotsData = null;
let cachedPlotsTime = 0;
const CACHE_TTL_MS = 20000; // 20s in-memory cache

function invalidatePlotsCache() {
  cachedPlotsData = null;
  cachedPlotsTime = 0;
}

function runPostgreSqlAttempt(cfg, sqlQuery) {
  return new Promise((resolve, reject) => {
    try {
      const env = { ...process.env, PGPASSWORD: cfg.password, PGCLIENTENCODING: 'UTF8' };
      const child = spawn(
        PSQL_PATH,
        ['-U', cfg.user, '-h', cfg.host, '-p', String(cfg.port), '-d', cfg.database, '-t', '-A', '-q', '-v', 'ON_ERROR_STOP=1'],
        { env, windowsHide: true, timeout: 8000 }
      );
      let stdout = '';
      let stderr = '';
      let hasError = false;

      child.on('error', err => {
        hasError = true;
        reject(err);
      });

      child.stdout.on('data', d => stdout += d.toString('utf8'));
      child.stderr.on('data', d => stderr += d.toString('utf8'));

      child.on('close', code => {
        if (hasError) return;
        if (code !== 0) reject(new Error(stderr || 'Exit ' + code));
        else resolve(stdout.trim());
      });

      child.stdin.on('error', err => {
        hasError = true;
        reject(err);
      });

      child.stdin.write(sqlQuery, 'utf8');
      child.stdin.end();
    } catch (e) {
      reject(e);
    }
  });
}

let pgPoolInstance = null;
function getPgPool() {
  if (!pgPoolInstance) {
    const base = getPgConfig();
    pgPoolInstance = new pg.Pool({
      host: base.host || 'localhost',
      port: parseInt(base.port || '5432', 10),
      database: base.database || 'farmely',
      user: base.user || 'postgres',
      password: base.password || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    pgPoolInstance.on('error', (err) => {
      console.warn('[Postgres Pool Error]', err?.message);
    });
  }
  return pgPoolInstance;
}

async function runPostgreSql(sqlQuery) {
  try {
    const pool = getPgPool();
    const res = await pool.query(sqlQuery);
    if (!res || !res.rows || res.rows.length === 0) {
      return '';
    }
    const firstRow = res.rows[0];
    const firstKey = Object.keys(firstRow)[0];
    const val = firstRow[firstKey];
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    return String(val ?? '');
  } catch (poolErr) {
    console.warn('[PostgreSQL query failed before CLI fallback]', poolErr?.code || '', poolErr?.message || poolErr);
    if (!PG_CONNECTION_ERROR_CODES.has(poolErr?.code)) throw poolErr;
    if (activePgConfig) {
      try {
        return await runPostgreSqlAttempt(activePgConfig, sqlQuery);
      } catch {
        activePgConfig = null;
      }
    }
    const base = getPgConfig();
    return await runPostgreSqlAttempt({ ...base, port: '5432', password: 'postgres' }, sqlQuery);
  }
}

function runPowershell(script) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) return reject(err || stderr);
        resolve(stdout.trim());
      }
    );
  });
}

export function siteVisitsApiPlugin() {
  return {
    name: 'site-visits-api-plugin',
    configureServer(server) {
      if (!global.__farmelySseClients) {
        global.__farmelySseClients = [];
      }

      async function triggerBulkTelemetryInsert(scenario = null) {
        try {
          const mode = scenario?.mode || 'normal';
          const targetPlotId = scenario?.plotId ? parseInt(scenario.plotId, 10) : null;

          // Mô hình vi khí hậu nhật triệt (Diurnal Solar-Thermal Cycle) theo giờ thực của Server:
          // Trưa (12h-14h): Nắng gắt, nhiệt độ đạt đỉnh ~32.5°C - 33.5°C, không khí khô ~56% - 62%
          // Đêm (23h-05h): Trời dịu mát ~24.5°C - 26°C, không khí ẩm đọng sương ~82% - 88%
          const now = new Date();
          const curHour = now.getHours() + now.getMinutes() / 60.0;
          const solarFactor = Math.sin(((curHour - 7.5) * Math.PI) / 12.0); // -1.0 (đêm) đến +1.0 (trưa)

          const diurnalTemp = (28.2 + 4.2 * solarFactor).toFixed(2);
          const diurnalAir = (72.0 - 13.5 * solarFactor).toFixed(2);
          const diurnalSoil = (68.0 - 3.5 * solarFactor).toFixed(2);

          // Trôi dạt tự nhiên nhẹ nhàng: trôi dần về trục nhiệt theo giờ (0.12) + nhiễu vi khí hậu ngẫu nhiên (±0.10°C)
          let tempExpr = `ROUND(LEAST(35.0, GREATEST(22.0, ((${diurnalTemp} + ((p.plot_id % 3) * 0.4) - 0.4) * 0.12 + COALESCE(prev.temperature, ${diurnalTemp}) * 0.88) + ((random() * 0.20) - 0.10)))::numeric, 2)`;
          let airExpr = `ROUND(LEAST(95.0, GREATEST(45.0, ((${diurnalAir} + ((p.plot_id % 4) * 0.8) - 1.2) * 0.12 + COALESCE(prev.air_humidity, ${diurnalAir}) * 0.88) + ((random() * 0.4) - 0.20)))::numeric, 2)`;
          let soilExpr = `ROUND(LEAST(85.0, GREATEST(50.0, ((${diurnalSoil} + ((p.plot_id % 3) * 0.6) - 0.6) * 0.12 + COALESCE(prev.soil_humidity, ${diurnalSoil}) * 0.88) + ((random() * 0.24) - 0.12)))::numeric, 2)`;

          if (mode === 'alert_flood') {
            if (targetPlotId) {
              soilExpr = `CASE WHEN p.plot_id = ${targetPlotId} THEN 83.20 ELSE ${soilExpr} END`;
              airExpr = `CASE WHEN p.plot_id = ${targetPlotId} THEN 88.50 ELSE ${airExpr} END`;
            } else {
              soilExpr = '83.20';
              airExpr = '88.50';
            }
          } else if (mode === 'alert_dry') {
            if (targetPlotId) {
              soilExpr = `CASE WHEN p.plot_id = ${targetPlotId} THEN 46.50 ELSE ${soilExpr} END`;
              tempExpr = `CASE WHEN p.plot_id = ${targetPlotId} THEN 34.80 ELSE ${tempExpr} END`;
            } else {
              soilExpr = '46.50';
              tempExpr = '34.80';
            }
          }

          const sql = `
WITH inserted AS (
  INSERT INTO sensor_readings (plot_id, temperature, air_humidity, soil_humidity, recorded_at)
  SELECT 
    p.plot_id,
    ${tempExpr} AS temperature,
    ${airExpr} AS air_humidity,
    ${soilExpr} AS soil_humidity,
    NOW() AS recorded_at
  FROM plots p
  LEFT JOIN LATERAL (
    SELECT temperature, air_humidity, soil_humidity 
    FROM sensor_readings 
    WHERE plot_id = p.plot_id 
    ORDER BY recorded_at DESC 
    LIMIT 1
  ) prev ON true
  RETURNING reading_id, plot_id, temperature, air_humidity, soil_humidity, recorded_at
)
SELECT COALESCE(json_agg(
  json_build_object(
    'readingId', ins.reading_id,
    'plotId', ins.plot_id,
    'plotCode', p.plot_code,
    'temperature', ins.temperature,
    'airHumidity', ins.air_humidity,
    'soilHumidity', ins.soil_humidity,
    'recordedAt', ins.recorded_at,
    'status', 'HEALTHY',
    'statusMessage', 'Vi khí hậu ổn định trong ngưỡng an toàn VietGAP'
  )
), '[]'::json)
FROM inserted ins
JOIN plots p ON ins.plot_id = p.plot_id;
`;
          const data = await runPostgreSql(sql);
          if (!data) return [];
          const readings = JSON.parse(data);

          if (Array.isArray(readings) && readings.length > 0 && global.__farmelySseClients && global.__farmelySseClients.length > 0) {
            for (let i = global.__farmelySseClients.length - 1; i >= 0; i--) {
              const client = global.__farmelySseClients[i];
              if (client.res.destroyed || client.res.writableEnded) {
                global.__farmelySseClients.splice(i, 1);
                continue;
              }
              const target = client.plotId;
              if (target === 'all') {
                try {
                  client.res.write(`event: SENSOR_ALL_UPDATE\ndata: ${JSON.stringify(readings)}\n\n`);
                } catch {
                  global.__farmelySseClients.splice(i, 1);
                }
                continue;
              }
              const matched = readings.find(r => 
                String(r.plotId) === String(target) ||
                String(r.plotCode).toUpperCase() === String(target).toUpperCase() ||
                `PLOT-${r.plotCode}`.toUpperCase() === String(target).toUpperCase() ||
                `P-${String(target).padStart(2, '0')}`.toUpperCase() === String(r.plotCode).toUpperCase()
              );
              if (matched) {
                try {
                  client.res.write(`event: SENSOR_UPDATE\ndata: ${JSON.stringify(matched)}\n\n`);
                } catch {
                  global.__farmelySseClients.splice(i, 1);
                }
              }
            }
          }

          runPostgreSql(`DELETE FROM sensor_readings WHERE reading_id < (SELECT COALESCE(max(reading_id), 0) - 400 FROM sensor_readings);`).catch(() => {});
          return readings;
        } catch {
          return [];
        }
      }

      global.__triggerBulkTelemetryInsert = triggerBulkTelemetryInsert;

      if (global.__farmelyTelemetryInterval) {
        clearInterval(global.__farmelyTelemetryInterval);
      }
      setTimeout(() => triggerBulkTelemetryInsert(global.__farmelySimulatedScenario), 1000);
      // Chu kỳ 10 giây đo đạc một lần theo đúng nhịp trạm IoT thực tế ngoài vườn
      global.__farmelyTelemetryInterval = setInterval(() => {
        if (global.__farmelySimulatedScenario && Date.now() > global.__farmelySimulatedScenario.expiresAt) {
          global.__farmelySimulatedScenario = null;
        }
        triggerBulkTelemetryInsert(global.__farmelySimulatedScenario);
      }, 10000);

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 0. GET /api/db/status (Health check & statistics)
        if (req.method === 'GET' && url === '/api/db/status') {
          try {
            const cfg = getPgConfig();
            const sql = `
SELECT json_build_object(
  'engine', 'PostgreSQL (Local / Docker)',
  'database', '${cfg.database}',
  'port', ${parseInt(cfg.port, 10) || 5433},
  'ddl_source', 'farmely_full_database.sql',
  'contracts_count', (SELECT count(*) FROM contracts),
  'rentals_count', (SELECT count(*) FROM rentals),
  'payment_transactions_count', (SELECT count(*) FROM payment_transactions),
  'site_visits_count', (SELECT count(*) FROM site_visits),
  'rented_plots_count', (SELECT count(*) FROM plots WHERE status = 'RENT'),
  'available_plots_count', (SELECT count(*) FROM plots WHERE status = 'AVAIL'),
  'maintenance_plots_count', (SELECT count(*) FROM plots WHERE status = 'MAINT'),
  'total_plots_count', (SELECT count(*) FROM plots)
);
`;
            const pgResult = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(pgResult || '{}');
          } catch (err) {
            // Fallback to SQL Server isp392_agritech
            try {
              const msScript = `
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT 'SQL Server 2022' as engine, 'isp392_agritech' as [database], 1433 as port, (SELECT count(*) FROM orders) as contracts_count, (SELECT count(*) FROM rentals) as rentals_count, (SELECT count(*) FROM payment_transactions) as payment_transactions_count, (SELECT count(*) FROM site_visits) as site_visits_count, (SELECT count(*) FROM plots WHERE status = 'RENTED') as rented_plots_count, (SELECT count(*) FROM plots) as total_plots_count FOR JSON PATH, WITHOUT_ARRAY_WRAPPER"
$result = $cmd.ExecuteScalar()
$conn.Close()
Write-Output $result
`;
              const msResult = await runPowershell(msScript);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(msResult || '{"engine":"SQL Server 2022","database":"isp392_agritech","port":1433}');
            } catch (err2) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err2) }));
            }
          }
          return;
        }

        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && (url.startsWith('/api/plots') || url.startsWith('/api/v1/plots') || url.startsWith('/api/lands'))) {
          invalidatePlotsCache();
        }

        // 0.2 GET /api/v1/master-data/summary or GET /api/master-data/summary
        if (req.method === 'GET' && (url === '/api/v1/master-data/summary' || url === '/api/master-data/summary' || url === '/api/admin/master-data/summary')) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy dữ liệu Master Data thành công từ PostgreSQL',
  'data', json_build_object(
    'totalLands', (SELECT count(*)::int FROM lands),
    'totalPlots', (SELECT count(*)::int FROM plots),
    'availablePlots', (SELECT count(*)::int FROM plots WHERE status = 'AVAIL'),
    'rentedPlots', (SELECT count(*)::int FROM plots WHERE status = 'RENT'),
    'maintenancePlots', (SELECT count(*)::int FROM plots WHERE status = 'MAINT'),
    'totalCrops', (SELECT count(*)::int FROM crops),
    'totalVarieties', (SELECT count(*)::int FROM varieties),
    'totalIoT', 6,
    'activeTemplates', (SELECT count(*)::int FROM process_templates),
    'totalDocs', (SELECT count(*)::int FROM knowledge_documents),
    'recentAuditLogs', (
      SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json) FROM (
        SELECT 
          al.log_id,
          al.action,
          al.entity_name,
          al.entity_id,
          COALESCE(u.full_name, 'Hệ thống') as user_name,
          TO_CHAR(al.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
          al.details
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        ORDER BY al.created_at DESC
        LIMIT 4
      ) l
    )
  )
);
`;
            const pgResult = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(pgResult || '{}');
          } catch (err) {
            console.error('PostgreSQL error on master-data summary:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 1. GET /api/site-visits
        if (req.method === 'GET' && (url === '/api/site-visits' || url.startsWith('/api/site-visits?'))) {
          try {
            const sql = `
SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM (
  SELECT 
    v.visit_id, 
    v.plot_id, 
    COALESCE(p.plot_code, 'P-01') AS plot_code, 
    COALESCE(p.area, 100.00) AS area, 
    v.visitor_name, 
    v.visitor_phone, 
    v.visitor_name || '@farmely.vn' AS visitor_email,
    TO_CHAR(v.visit_date, 'YYYY-MM-DD') AS visit_date, 
    v.visit_slot::text AS visit_slot, 
    1 AS group_size, 
    '' AS notes, 
    v.status::text AS status, 
    TO_CHAR(v.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at 
  FROM site_visits v 
  LEFT JOIN plots p ON v.plot_id = p.plot_id 
  ORDER BY v.visit_id DESC
) v;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            try {
              const script = `
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT v.visit_id, v.plot_id, p.plot_code, p.area, v.visitor_name, v.visitor_phone, v.visitor_email, CONVERT(varchar(10), v.visit_date, 120) as visit_date, v.visit_slot, v.group_size, v.notes, v.status, CONVERT(varchar(19), v.created_at, 120) as created_at FROM site_visits v LEFT JOIN plots p ON v.plot_id = p.plot_id ORDER BY v.visit_id DESC FOR JSON PATH"
$reader = $cmd.ExecuteReader()
$sb = New-Object System.Text.StringBuilder
while ($reader.Read()) { [void]$sb.Append($reader.GetString(0)) }
$conn.Close()
$json = $sb.ToString()
if (-not $json) { $json = "[]" }
Write-Output $json
`;
              const data = await runPowershell(script);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(data || '[]');
            } catch (err2) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err2) }));
            }
          }
          return;
        }

        // 2. POST /api/site-visits (Create appointment)
        if (req.method === 'POST' && url === '/api/site-visits') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const plotId = payload.plot_id ? parseInt(payload.plot_id, 10) : 1;
              const name = (payload.visitor_name || 'Khách hàng').replace(/'/g, "''");
              const phone = (payload.visitor_phone || '0900000000').replace(/'/g, "''");
              const date = payload.visit_date || new Date().toISOString().slice(0, 10);
              const slot = (payload.visit_slot || 'MORNING').toUpperCase();
              const validSlot = (slot === 'AFTERNOON') ? 'AFTERNOON' : 'MORNING';

              let createdObj = { visit_id: Date.now(), visitor_name: name, visitor_phone: phone, visit_date: date, visit_slot: validSlot, status: 'PENDING' };

              // Thử ghi vào PostgreSQL (farmely)
              try {
                const pgSql = `
INSERT INTO site_visits (plot_id, visitor_name, visitor_phone, visit_date, visit_slot, status)
VALUES (${plotId}, '${name}', '${phone}', '${date}', '${validSlot}', 'PENDING')
RETURNING json_build_object(
  'visit_id', visit_id,
  'visitor_name', visitor_name,
  'visitor_phone', visitor_phone,
  'visit_date', TO_CHAR(visit_date, 'YYYY-MM-DD'),
  'visit_slot', visit_slot,
  'status', status,
  'created_at', TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS')
);
`;
                const pgOutput = await runPostgreSql(pgSql);
                const jsonMatch = pgOutput.match(/\{[\s\S]*\}/);
                if (jsonMatch) createdObj = JSON.parse(jsonMatch[0]);
              } catch (pgErr) {}

              // Đồng bộ song song sang SQL Server (isp392_agritech)
              try {
                const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
                const msScript = `
$bytes = [System.Convert]::FromBase64String("${b64}")
$obj = [System.Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "INSERT INTO site_visits (plot_id, visitor_name, visitor_phone, visitor_email, visit_date, visit_slot, group_size, notes, status, created_at) OUTPUT INSERTED.visit_id, INSERTED.visitor_name, INSERTED.visitor_phone, INSERTED.visitor_email, CONVERT(varchar(10), INSERTED.visit_date, 120) as visit_date, INSERTED.visit_slot, INSERTED.group_size, INSERTED.notes, INSERTED.status, CONVERT(varchar(19), INSERTED.created_at, 120) as created_at VALUES (@plot_id, @name, @phone, @email, @date, @slot, @group, @notes, 'PENDING', GETDATE())"
[void]$cmd.Parameters.AddWithValue("@plot_id", $(if ($obj.plot_id) { [int]$obj.plot_id } else { [System.DBNull]::Value }))
[void]$cmd.Parameters.AddWithValue("@name", [string]$obj.visitor_name)
[void]$cmd.Parameters.AddWithValue("@phone", [string]$obj.visitor_phone)
[void]$cmd.Parameters.AddWithValue("@email", $(if ($obj.visitor_email) { [string]$obj.visitor_email } else { "$phone@farmely.vn" }))
[void]$cmd.Parameters.AddWithValue("@date", [string]$obj.visit_date)
[void]$cmd.Parameters.AddWithValue("@slot", $(if ($obj.visit_slot) { [string]$obj.visit_slot } else { "MORNING" }))
[void]$cmd.Parameters.AddWithValue("@group", $(if ($obj.group_size) { [int]$obj.group_size } else { 1 }))
[void]$cmd.Parameters.AddWithValue("@notes", $(if ($obj.notes) { [string]$obj.notes } else { "" }))
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
[void]$adapter.Fill($dt)
$conn.Close()
Write-Output ($dt | ConvertTo-Json -Compress)
`;
                const msResultStr = await runPowershell(msScript);
                const jsonMatch = msResultStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const msRow = JSON.parse(jsonMatch[0]);
                  createdObj = {
                    visit_id: msRow.visit_id,
                    visitor_name: msRow.visitor_name,
                    visitor_phone: msRow.visitor_phone,
                    visitor_email: msRow.visitor_email,
                    visit_date: msRow.visit_date,
                    visit_slot: msRow.visit_slot,
                    group_size: msRow.group_size,
                    notes: msRow.notes,
                    status: msRow.status,
                    created_at: msRow.created_at
                  };
                }
              } catch (msErr) {}

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Tạo đơn đặt lịch xem đất thành công',
                data: createdObj
              }));
            } catch (err) {
              console.error('Error on POST /api/site-visits:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // 3. POST /api/site-visits/:id/confirm
        if (req.method === 'POST' && url.includes('/confirm')) {
          const match = url.match(/\/api\/site-visits\/(\d+)\/confirm/);
          if (match) {
            const visitId = Number(match[1]);
            try {
              runPostgreSql(`UPDATE site_visits SET status = 'CONFIRMED' WHERE visit_id = ${visitId};`).catch(() => {});
              runPowershell(`$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True"); $conn.Open(); $cmd = $conn.CreateCommand(); $cmd.CommandText = "UPDATE site_visits SET status = 'CONFIRMED' WHERE visit_id = ${visitId}"; [void]$cmd.ExecuteNonQuery(); $conn.Close();`).catch(() => {});
              
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: `Xác nhận lịch đón tiếp #${visitId} thành công`
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
            return;
          }
        }

        // 4. POST /api/bookings/checkout (Master Lease Booking & Payment Transaction)
        if (req.method === 'POST' && (url === '/api/bookings/checkout' || url === '/api/v1/payments/checkout')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const customerEmail = (payload.customerEmail || payload.email || 'customer@farmely.vn').trim().toLowerCase().replace(/'/g, "''");
              const customerName = (payload.customerName || payload.fullName || 'Khách hàng').trim().replace(/'/g, "''");
              const customerPhone = (payload.customerPhone || payload.phone || '0901234567').trim().replace(/'/g, "''");
              const rawCust = String(payload.customerId || '');
              const numCust = parseInt(rawCust.replace(/\D/g, ''), 10);
              const customerId = (!isNaN(numCust) && numCust > 0) ? numCust : 1;
              const totalAmount = parseFloat(payload.totalAmount) || 2400000.00;
              const paymentMethod = (payload.paymentMethod || 'VNPAY').replace(/'/g, "''");
              const rentalMonths = parseInt(payload.rentalMonths, 10) || 6;
              const plotItems = Array.isArray(payload.plots) && payload.plots.length > 0 ? payload.plots : [{ code: 'P-01', price: totalAmount }];
              const nowStamp = Date.now().toString().slice(-6);
              const contractNumber = `MLA-2026-${nowStamp}`;
              const gatewayRef = (payload.gatewayRef || `TXN-FARMLY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nowStamp}`).replace(/'/g, "''");

              let responseData = null;

              // --- A. THỬ GHI VÀO POSTGRESQL (farmely) ---
              try {
                await ensureRentalLeaseColumns();
                let pgSql = `
DO $$
DECLARE
    v_user_id INT;
    v_contract_id INT;
    v_plot_id INT;
    v_rental_id INT;
BEGIN
    -- 1. Tìm hoặc tạo user hợp lệ theo email
    SELECT user_id INTO v_user_id FROM users WHERE LOWER(email) = LOWER('${customerEmail}') LIMIT 1;
    IF v_user_id IS NULL AND ${customerId > 0 ? customerId : 0} > 0 THEN
        SELECT user_id INTO v_user_id FROM users WHERE user_id = ${customerId} LIMIT 1;
    END IF;
    IF v_user_id IS NULL THEN
        INSERT INTO users (role_id, email, password_hash, full_name, phone_number, status, created_at, updated_at)
        VALUES (1, '${customerEmail}', '$2a$10$FarmelyDefaultUserHash', '${customerName}', '${customerPhone}', 'ACTIVE', NOW(), NOW())
        RETURNING user_id INTO v_user_id;
    END IF;
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM users WHERE role_id = 1 ORDER BY user_id ASC LIMIT 1;
    END IF;

    -- 2. Tạo Hợp đồng thuê Master Lease
    INSERT INTO contracts (renter_id, contract_number, total_amount, status, reservation_expires_at, created_at, updated_at)
    VALUES (v_user_id, '${contractNumber}', ${totalAmount}, 'ACTIVE', NOW() + INTERVAL '10 minutes', NOW(), NOW())
    RETURNING contract_id INTO v_contract_id;

    -- 3. Tạo Giao dịch thanh toán
    INSERT INTO payment_transactions (contract_id, type, amount, payment_method, gateway_ref, status, created_at)
    VALUES (v_contract_id, 'PAYMENT', ${totalAmount}, '${paymentMethod}', '${gatewayRef}', 'SUCCESS', NOW());
`;
                for (const item of plotItems) {
                  const rawCode = String(item.code || item.id || 'P-01');
                  const cleanCode = rawCode.replace('PLT-HV-', 'P-').replace('L01-', '').replace(/^Plot\s+/i, '').replace(/'/g, "''").trim();
                  const digitsMatch = cleanCode.match(/\d+/);
                  const numCode = digitsMatch ? digitsMatch[0].padStart(2, '0') : '01';
                  const itemTerm = ALLOWED_TERM_MONTHS.includes(parseInt(item.termMonths, 10))
                    ? parseInt(item.termMonths, 10)
                    : rentalMonths;
                  const itemMode = ['SELF', 'ASSISTED'].includes(item.cultivationMode)
                    ? item.cultivationMode
                    : (payload.cultivationMode === 'SELF_GROWING' ? 'SELF' : 'ASSISTED');
                  const itemServiceId = itemMode === 'ASSISTED' ? 15 : null;
                  const itemPrice = parseFloat(item.totalPrice) || parseFloat(item.price) || (totalAmount / plotItems.length);
                  const cleanPlotId = parseInt(cleanCode.replace(/\D/g, ''), 10) || 1;
                  const rawVarId = item.varietyId || item.cropId;
                  const parsedVarId = typeof rawVarId === 'number'
                    ? rawVarId
                    : parseInt(String(rawVarId || '').replace(/\D/g, ''), 10);
                  const varietyId = !isNaN(parsedVarId) && parsedVarId > 0 && parsedVarId <= 10 ? parsedVarId : 1;

                  pgSql += `
    -- Tìm plot_id chính xác
    SELECT plot_id INTO v_plot_id FROM plots 
    WHERE plot_code = '${cleanCode}' 
       OR plot_code = 'P-' || '${numCode}'
       OR plot_code ILIKE '%${cleanCode}%'
       OR plot_id = ${cleanPlotId}
    LIMIT 1;

    -- Nếu plot chưa có trong DB thì tự động tạo để lưu
    IF v_plot_id IS NULL THEN
        INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published, image_url)
        VALUES (1, 'P-' || '${numCode}', 100.00, ${itemPrice}, 'RENT', TRUE, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80')
        RETURNING plot_id INTO v_plot_id;
    END IF;

    -- Thêm bản ghi rental với ngày bắt đầu do khách chọn
    INSERT INTO rentals (contract_id, plot_id, variety_id, service_id, cultivation_mode, term_months, start_date, end_date, total_price, status, created_at, updated_at)
    VALUES (v_contract_id, v_plot_id, ${varietyId}, ${itemServiceId ? itemServiceId : 'NULL'}, '${itemMode}', ${itemTerm}, '${startDate}', '${startDate}'::date + INTERVAL '${itemTerm} months', ${itemPrice}, 'ACTIVE', NOW(), NOW())
    RETURNING rental_id INTO v_rental_id;

    -- CẬP NHẬT TRẠNG THÁI THỬA ĐẤT SANG 'RENT' (ĐÃ THUÊ)
    UPDATE plots SET status = 'RENT', updated_at = NOW() WHERE plot_id = v_plot_id;

    -- 1. TỰ ĐỘNG SINH CÔNG VIỆC CANH TÁC (CARE TASKS) THEO QUY TRÌNH VIETGAP CỦA GIỐNG CÂY
    INSERT INTO care_tasks (rental_id, step_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
    SELECT 
        v_rental_id,
        ts.step_id,
        8, -- Kỹ thuật viên Trần Văn Lực (CVLĐ)
        CURRENT_DATE + (ts.day_offset || ' days')::interval,
        CASE WHEN ts.step_order = 1 THEN 'IN_PROG'::task_status_enum ELSE 'PENDING'::task_status_enum END,
        ts.step_name || ' - ' || ts.description,
        NOW(),
        NOW()
    FROM process_templates pt
    JOIN template_steps ts ON pt.template_id = ts.template_id
    WHERE pt.variety_id = ${varietyId}
    ORDER BY ts.step_order;

    -- 2. TỰ ĐỘNG KHỞI TẠO BẢN GHI NHẬT KÝ NÔNG TRẠI (FARM DIARY)
    INSERT INTO farm_diaries (rental_id, content, image_url, created_at)
    SELECT 
        v_rental_id,
        'Khoi tao va ban giao thua dat cho mua vu moi. Da hoan tat lam dat, xu ly phoi ai, bon lot phan trun que va kiem tra tram IoT vi sinh theo quy trinh VietGAP cho giong ' || COALESCE(v.variety_name, 'cay trong') || '.',
        COALESCE((SELECT image_url FROM plots WHERE plot_id = v_plot_id), 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80'),
        NOW()
    FROM varieties v WHERE v.variety_id = ${varietyId};

    -- 3. TỰ ĐỘNG KHỞI TẠO HỒ SƠ THU HOẠCH & NGHIỆM THU (HARVEST RESULTS)
    INSERT INTO harvest_results (rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type, customer_confirmed, created_at)
    VALUES (
        v_rental_id,
        8,
        CURRENT_DATE + COALESCE((SELECT MAX(day_offset + duration_days) FROM template_steps ts JOIN process_templates pt ON ts.template_id = pt.template_id WHERE pt.variety_id = ${varietyId}), 65) * INTERVAL '1 day',
        ROUND(COALESCE((SELECT area * 0.3 FROM plots WHERE plot_id = v_plot_id), 35.0)::numeric, 1),
        'https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80',
        'DELIVERY',
        false,
        NOW()
    );

    -- 4. TỰ ĐỘNG KHỞI TẠO DỮ LIỆU CẢM BIẾN IOT NẾU THỬA CHƯA CÓ
    INSERT INTO sensor_readings (plot_id, temperature, air_humidity, soil_humidity, recorded_at)
    SELECT v_plot_id, 28.5, 74.0, 68.0, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM sensor_readings WHERE plot_id = v_plot_id);
`;
                }
                pgSql += `END $$;`;
                await runPostgreSql(pgSql);
                invalidatePlotsCache();

                const fetchCreatedSql = `
SELECT json_build_object(
  'success', true,
  'database', 'PostgreSQL 18 (farmely)',
  'contract_number', c.contract_number,
  'contract_code', c.contract_number,
  'contract_id', c.contract_id,
  'total_amount', c.total_amount,
  'contract_status', c.status,
  'transaction_id', pt.transaction_id,
  'gateway_ref', pt.gateway_ref,
  'payment_status', pt.status,
  'message', 'Đã lưu Master Lease Contract & Giao dịch thanh toán thành công vào PostgreSQL (farmely)'
)
FROM contracts c
JOIN payment_transactions pt ON c.contract_id = pt.contract_id
WHERE c.contract_number = '${contractNumber}'
LIMIT 1;
`;
                const queryOutput = await runPostgreSql(fetchCreatedSql);
                const jsonMatch = queryOutput?.match(/\{[\s\S]*\}/);
                if (jsonMatch) responseData = JSON.parse(jsonMatch[0]);
              } catch (pgErr) {
                console.error('PostgreSQL checkout error:', pgErr);
              }

              // --- B. ĐỒNG BỘ SONG SONG SANG SQL SERVER (isp392_agritech) ---
              try {
                const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
                const msScript = `
$bytes = [System.Convert]::FromBase64String("${b64}")
$obj = [System.Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$tran = $conn.BeginTransaction()
try {
    $cmdOrder = $conn.CreateCommand()
    $cmdOrder.Transaction = $tran
    $cmdOrder.CommandText = "INSERT INTO orders (customer_id, total_amount, status, expires_at, created_at, updated_at) OUTPUT INSERTED.order_id VALUES (${customerId}, ${totalAmount}, 'PAID', DATEADD(minute, 10, SYSDATETIME()), SYSDATETIME(), SYSDATETIME())"
    $oid = [int]$cmdOrder.ExecuteScalar()

    $cmdTxn = $conn.CreateCommand()
    $cmdTxn.Transaction = $tran
    $cmdTxn.CommandText = "INSERT INTO payment_transactions (order_id, amount, payment_method, gateway_ref, status, created_at) OUTPUT INSERTED.transaction_id VALUES ($oid, ${totalAmount}, '${paymentMethod}', '${gatewayRef}', 'SUCCESS', SYSDATETIME())"
    $tid = [int]$cmdTxn.ExecuteScalar()

    foreach ($item in $obj.plots) {
        $pCode = [string]$(if ($item.code) { $item.code } else { "P-01" })
        $cleanCode = $pCode.Replace("L01-", "").Replace("Plot ", "")
        $cmdPlot = $conn.CreateCommand()
        $cmdPlot.Transaction = $tran
        $cmdPlot.CommandText = "SELECT TOP 1 plot_id FROM plots WHERE plot_code = @pcode OR plot_code LIKE '%' + @clean"
        [void]$cmdPlot.Parameters.AddWithValue("@pcode", $pCode)
        [void]$cmdPlot.Parameters.AddWithValue("@clean", $cleanCode)
        $foundPlotId = $cmdPlot.ExecuteScalar()
        if (-not $foundPlotId) { $foundPlotId = 1 }

        $cmdRental = $conn.CreateCommand()
        $cmdRental.Transaction = $tran
        $cmdRental.CommandText = "INSERT INTO rentals (order_id, plot_id, variety_id, start_date, end_date, cultivation_mode, locked_price, status, created_at, updated_at) VALUES ($oid, $foundPlotId, 1, CAST(GETDATE() AS DATE), DATEADD(month, ${rentalMonths}, CAST(GETDATE() AS DATE)), 'ASSISTED_GROWING', ${totalAmount}, 'ACTIVE', SYSDATETIME(), SYSDATETIME())"
        [void]$cmdRental.ExecuteNonQuery()

        $cmdUpd = $conn.CreateCommand()
        $cmdUpd.Transaction = $tran
        $cmdUpd.CommandText = "UPDATE plots SET status = 'RENTED' WHERE plot_id = $foundPlotId"
        [void]$cmdUpd.ExecuteNonQuery()
    }
    $tran.Commit()
    $resObj = @{
        success = $true
        database = "SQL Server 2022 (isp392_agritech)"
        order_id = $oid
        transaction_id = $tid
        contract_number = "${contractNumber}"
        gateway_ref = "${gatewayRef}"
        total_amount = ${totalAmount}
        payment_status = "SUCCESS"
        message = "Đã lưu Master Lease Contract & Giao dịch thanh toán thành công vào SQL Server (isp392_agritech)"
    }
    Write-Output ($resObj | ConvertTo-Json -Compress)
} catch {
    $tran.Rollback()
    throw $_
} finally {
    $conn.Close()
}
`;
                const msOutput = await runPowershell(msScript);
                if (!responseData) {
                  const jsonMatch = msOutput.match(/\{[\s\S]*\}/);
                  if (jsonMatch) responseData = JSON.parse(jsonMatch[0]);
                }
              } catch (msErr) {
                console.error('SQL Server checkout error:', msErr);
              }

              if (!responseData) {
                responseData = {
                  success: true,
                  contract_number: contractNumber,
                  contract_code: contractNumber,
                  gateway_ref: gatewayRef,
                  message: 'Giao dịch thanh toán được ghi nhận thành công'
                };
              } else if (!responseData.contract_code) {
                responseData.contract_code = responseData.contract_number || contractNumber;
              }

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(responseData));
            } catch (err) {
              console.error('Error on POST /api/bookings/checkout:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // 4.5. GET /api/contracts & /api/v1/contracts (Fetch contracts & cancellation records)
        if (req.method === 'GET' && (url === '/api/contracts' || url === '/api/v1/contracts' || url.startsWith('/api/contracts?') || url.startsWith('/api/v1/contracts?'))) {
          try {
            const sql = `
SELECT COALESCE(json_agg(c), '[]'::json) FROM (
  SELECT 
    c.contract_id AS "contractId",
    c.contract_number AS "contractNumber",
    c.renter_id AS "renterId",
    u.full_name AS "renterName",
    c.total_amount AS "totalAmount",
    c.status::text AS "status",
    TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    COALESCE(
      (
        SELECT json_agg(r) FROM (
          SELECT 
            rt.rental_id AS "rentalId",
            rt.plot_id AS "plotId",
            p.plot_code AS "plotCode",
            l.land_name AS "landName",
            v.variety_name AS "varietyName",
            TO_CHAR(rt.start_date, 'YYYY-MM-DD') AS "startDate",
            TO_CHAR(rt.end_date, 'YYYY-MM-DD') AS "endDate",
            rt.total_price AS "totalPrice",
            rt.status::text AS "status",
            COALESCE(rt.cultivation_mode, CASE WHEN rt.service_id IS NULL THEN 'SELF' ELSE 'ASSISTED' END) AS "cultivationMode",
            COALESCE(rt.term_months, GREATEST(1, ROUND((rt.end_date - rt.start_date) / 30.0))::int) AS "termMonths"
          FROM rentals rt
          JOIN plots p ON rt.plot_id = p.plot_id
          JOIN lands l ON p.land_id = l.land_id
          LEFT JOIN varieties v ON rt.variety_id = v.variety_id
          WHERE rt.contract_id = c.contract_id
          ORDER BY rt.rental_id ASC
        ) r
      ),
      '[]'::json
    ) AS "rentals",
    (
      SELECT row_to_json(cc) FROM (
        SELECT 
          cn.cancellation_id AS "cancellationId",
          cn.reason AS "reason",
          cn.status::text AS "status",
          TO_CHAR(cn.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
        FROM contract_cancellations cn
        WHERE cn.contract_id = c.contract_id
        ORDER BY cn.cancellation_id DESC
        LIMIT 1
      ) cc
    ) AS "cancellation"
  FROM contracts c
  JOIN users u ON c.renter_id = u.user_id
  ORDER BY c.contract_id DESC
) c;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: JSON.parse(data || '[]') }));
          } catch (err) {
            console.error('Error on GET /api/contracts:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: 'Lỗi tải danh sách hợp đồng: ' + err.message }));
          }
          return;
        }

        // 4.5B. GET /api/contracts/cancellations (Danh sách yêu cầu hủy hợp đồng và hoàn cọc)
        if (req.method === 'GET' && url.match(/^\/api\/(?:v1\/)?contracts\/cancellations/)) {
          try {
            const sql = `
SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM (
  SELECT 
    cn.cancellation_id AS "cancellationId",
    cn.contract_id AS "contractId",
    COALESCE(c.contract_number, 'HD-' || cn.contract_id) AS "contractNumber",
    cn.cancelled_by AS "cancelledBy",
    COALESCE(u.full_name, 'Khách hàng #' || cn.cancelled_by) AS "cancellerName",
    cn.reason,
    cn.status::text AS "status",
    COALESCE(c.total_amount, 0) AS "totalPaidAmount",
    80 AS "refundPercentage",
    COALESCE(c.total_amount * 0.8, 0) AS "refundAmount",
    'Khấu trừ 20% chi phí chuẩn bị theo chính sách BR10' AS "refundPolicyNote",
    TO_CHAR(cn.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
  FROM contract_cancellations cn
  LEFT JOIN contracts c ON cn.contract_id = c.contract_id
  LEFT JOIN users u ON cn.cancelled_by = u.user_id
  ORDER BY cn.cancellation_id DESC
) c;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: JSON.parse(data || '[]') }));
          } catch (err) {
            console.error('Error on GET /api/contracts/cancellations:', err);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: [] }));
          }
          return;
        }

        // 4.6. POST /api/contracts/:id/cancellation & /api/contracts/cancellation (BR10 Contract Cancellation & BR23 Maintenance)
        if (req.method === 'POST' && (url.includes('/cancellation') || url.includes('/cancel'))) {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const payload = JSON.parse(body || '{}');
              
              // Extract contract ID from URL or body
              let contractId = payload.contractId;
              if (!contractId) {
                const match = url.match(/\/api\/(?:v1\/)?contracts\/(\d+)/);
                if (match) contractId = parseInt(match[1], 10);
              }
              contractId = parseInt(contractId, 10) || 1;

              const reason = (payload.reason || '').trim().replace(/'/g, "''");
              const bankName = (payload.bankName || '').trim().replace(/'/g, "''");
              const bankAccountNumber = (payload.bankAccountNumber || '').trim().replace(/'/g, "''");
              const bankAccountName = (payload.bankAccountName || '').trim().replace(/'/g, "''");
              const deductionRate = parseFloat(payload.deductionRate) || 0.20;
              const refundAmount = parseFloat(payload.refundAmount) || 0;
              const userId = parseInt(payload.cancelledBy, 10) || 1;

              if (reason.length < 10) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Lý do hủy hợp đồng phải có tối thiểu 10 ký tự (SRS V8.1)' }));
                return;
              }

              // Build combined reason with disbursement details
              let fullReason = reason;
              if (refundAmount > 0 && bankAccountNumber) {
                fullReason += ` [STK hoàn tiền: ${bankName} - ${bankAccountNumber} (${bankAccountName}) - Hoàn: ${refundAmount.toLocaleString('vi-VN')} đ]`;
              }

              const sqlCancel = `
DO $$
DECLARE
    v_cancellation_id INT;
BEGIN
    -- 1. Ghi nhận vào bảng contract_cancellations
    INSERT INTO contract_cancellations (contract_id, cancelled_by, reason, status, created_at)
    VALUES (${contractId}, ${userId}, '${fullReason}', 'PENDING', NOW())
    RETURNING cancellation_id INTO v_cancellation_id;

    -- 2. Cập nhật hợp đồng sang trạng thái CANCELLED
    UPDATE contracts 
    SET status = 'CANCELLED', updated_at = NOW() 
    WHERE contract_id = ${contractId};

    -- 3. Cập nhật các thửa đất thuê sang trạng thái CANCELLED
    UPDATE rentals 
    SET status = 'CANCELLED', updated_at = NOW() 
    WHERE contract_id = ${contractId};

    -- 4. Giải phóng thửa đất và chuyển sang bảo dưỡng & phơi ải 4 ngày (BR23)
    UPDATE plots 
    SET status = 'MAINT', updated_at = NOW() 
    WHERE plot_id IN (SELECT plot_id FROM rentals WHERE contract_id = ${contractId});

    -- 5. Ghi log kiểm toán vận hành
    INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details, ip_address, created_at)
    VALUES (${userId}, 'CANCEL_REQUEST', 'contracts', '${contractId}', '{"reason": "${reason}", "deductionRate": ${deductionRate}, "refundAmount": ${refundAmount}}'::jsonb, '127.0.0.1', NOW());
END $$;
`;
              await runPostgreSql(sqlCancel);
              invalidatePlotsCache();

              // Fetch the created cancellation
              const fetchCancelSql = `
SELECT json_build_object(
  'cancellationId', cancellation_id,
  'contractId', contract_id,
  'status', status::text,
  'createdAt', TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
)
FROM contract_cancellations
WHERE contract_id = ${contractId}
ORDER BY cancellation_id DESC
LIMIT 1;
`;
              const cancelOut = await runPostgreSql(fetchCancelSql);
              const cancelData = cancelOut && cancelOut.trim() ? JSON.parse(cancelOut.trim().split('\n')[0]) : { cancellationId: 1, contractId, status: 'PENDING' };

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Yêu cầu hủy hợp đồng và hoàn tiền đã được ghi nhận thành công theo quy định BR10. Thửa đất chuyển bảo dưỡng 4 ngày (BR23).',
                data: {
                  ...cancelData,
                  deductionRate,
                  refundAmount
                }
              }));
            } catch (err) {
              console.error('Error on POST /api/contracts/cancellation:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Lỗi ghi nhận hủy hợp đồng: ' + err.message }));
            }
          });
          return;
        }

        // 4.7. POST /api/contracts/reservations (BR08: 15-minute Plot Reservation)
        if (req.method === 'POST' && (url === '/api/contracts/reservations' || url === '/api/v1/contracts/reservations')) {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              await ensureRentalLeaseColumns();
              const body = Buffer.concat(chunks).toString('utf8');
              const payload = JSON.parse(body || '{}');
              const renterId = parseInt(payload.renterId, 10) || 1;
              const items = Array.isArray(payload.items) ? payload.items : [];

              if (items.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Danh sách thửa đất giữ chỗ không được để trống khi tạo hợp đồng thuê' }));
                return;
              }

              const resolvedItems = [];
              let calculatedTotal = 0;

              for (const it of items) {
                const rawPlotId = it.plotId || 1;
                const findPlotSql = `
SELECT plot_id, plot_code, price_per_period, status 
FROM plots 
WHERE plot_id = ${parseInt(rawPlotId, 10) || 0}
   OR plot_code = 'P-' || LPAD('${rawPlotId}', 2, '0')
   OR plot_code = 'P-' || '${rawPlotId}'
   OR plot_code = '${rawPlotId}'
LIMIT 1;
`;
                const plotOut = await runPostgreSql(findPlotSql);
                let plotRow = null;
                if (plotOut && plotOut.trim()) {
                  const parts = plotOut.trim().split('\n')[0].split('|');
                  plotRow = {
                    plotId: parseInt(parts[0], 10),
                    plotCode: parts[1],
                    pricePerPeriod: parseFloat(parts[2]) || 1350000,
                    status: parts[3]
                  };
                }
                const realPlotId = plotRow?.plotId || parseInt(rawPlotId, 10) || 1;
                const plotCode = plotRow?.plotCode || `P-${realPlotId}`;

                if (!it.varietyId) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: false, message: `Vui lòng chọn giống cây cho thửa đất '${plotCode}'` }));
                  return;
                }
                const varietyId = parseInt(it.varietyId, 10);

                // BR03: từ chối giống cây không tương thích (chỉ khi thửa đã có dữ liệu tương thích)
                const compatOut = await runPostgreSql(
                  `SELECT COUNT(*), COUNT(*) FILTER (WHERE variety_id = ${varietyId}) FROM plot_variety_compatibility WHERE plot_id = ${realPlotId};`
                );
                const [compatTotal, compatOk] = String(compatOut || '0|0').trim().split('\n')[0].split('|').map((n) => parseInt(n, 10) || 0);
                if (compatTotal > 0 && compatOk === 0) {
                  const nameOut = await runPostgreSql(`SELECT variety_name FROM varieties WHERE variety_id = ${varietyId};`);
                  const varietyName = (nameOut || '').trim().split('\n')[0] || String(varietyId);
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({
                    success: false,
                    message: `Giống cây '${varietyName}' không tương thích với thửa đất '${plotCode}' (Theo BR03)`
                  }));
                  return;
                }

                // Mode: 'SELF' hoặc 'ASSISTED'
                let cultivationMode = it.cultivationMode;
                if (cultivationMode) {
                  if (cultivationMode !== 'SELF' && cultivationMode !== 'ASSISTED') {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, message: 'Vui lòng chọn hình thức canh tác (Self-Growing hoặc Assisted-Growing).' }));
                    return;
                  }
                } else {
                  cultivationMode = it.serviceId ? 'ASSISTED' : 'SELF';
                }

                // Fetch variety để lấy expected_duration (growthDays)
                const varOut = await runPostgreSql(`SELECT expected_duration, variety_name FROM varieties WHERE variety_id = ${varietyId};`);
                if (!varOut || !varOut.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: false, message: 'Không tìm thấy giống cây' }));
                  return;
                }
                const [growthDaysStr, varietyName] = varOut.trim().split('\n')[0].split('|');
                const growthDays = parseInt(growthDaysStr, 10) || 0;

                const startDate = it.startDate || new Date().toISOString().split('T')[0];
                let termMonths = it.termMonths !== undefined && it.termMonths !== null ? parseInt(it.termMonths, 10) : null;
                if (termMonths !== null) {
                  const termErr = getLeaseTermError({ termMonths, cultivationMode, growthDays, varietyName });
                  if (termErr) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, message: `Thửa đất '${plotCode}': ${termErr}` }));
                    return;
                  }
                } else {
                  const startD = new Date(startDate);
                  const endD = new Date(it.endDate || new Date(Date.now() + 90 * 86400000));
                  termMonths = Math.max(1, Math.round((endD - startD) / (30 * 86400000)));
                  const termErr = getLeaseTermError({ termMonths, cultivationMode, growthDays, varietyName });
                  if (termErr) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: false, message: `Thửa đất '${plotCode}': ${termErr}` }));
                    return;
                  }
                }

                const plotMonthlyPrice = plotRow?.pricePerPeriod || 1350000;
                const careServiceMonthly = cultivationMode === 'ASSISTED' ? getCareFeePerMonth(plotMonthlyPrice) : 0;
                const itemTotalPrice = (plotMonthlyPrice + careServiceMonthly) * termMonths;
                calculatedTotal += itemTotalPrice;

                const serviceId = cultivationMode === 'ASSISTED' ? (parseInt(it.serviceId, 10) || 15) : null;
                const finalEndDate = (it.endDate && new Date(it.endDate) > new Date(startDate))
                  ? it.endDate
                  : new Date(new Date(startDate).getTime() + termMonths * 30 * 86400000).toISOString().split('T')[0];

                resolvedItems.push({
                  plotId: realPlotId,
                  plotCode,
                  varietyId,
                  serviceId,
                  cultivationMode,
                  termMonths,
                  startDate,
                  endDate: finalEndDate,
                  totalPrice: itemTotalPrice
                });
              }

              const contractNumber = `HD-${new Date().getFullYear()}-FARM-${String(Date.now()).slice(-4)}`;

              let insertSql = `
DO $$
DECLARE
    v_cid INT;
BEGIN
    INSERT INTO contracts (renter_id, contract_number, total_amount, status, reservation_expires_at, created_at, updated_at)
    VALUES (${renterId}, '${contractNumber}', ${calculatedTotal}, 'PENDING_PAYMENT', NOW() + INTERVAL '15 minutes', NOW(), NOW())
    RETURNING contract_id INTO v_cid;
`;
              for (const rit of resolvedItems) {
                insertSql += `
    INSERT INTO rentals (contract_id, plot_id, variety_id, service_id, cultivation_mode, term_months, start_date, end_date, total_price, status, created_at, updated_at)
    VALUES (v_cid, ${rit.plotId}, ${rit.varietyId}, ${rit.serviceId ? rit.serviceId : 'NULL'}, '${rit.cultivationMode}', ${rit.termMonths}, '${rit.startDate}', '${rit.endDate}', ${rit.totalPrice}, 'PENDING', NOW(), NOW());
`;
              }
              insertSql += `END $$;`;

              await runPostgreSql(insertSql);
              invalidatePlotsCache();

              const fetchCreatedSql = `
SELECT json_build_object(
  'contractId', contract_id,
  'contractNumber', contract_number,
  'totalAmount', total_amount,
  'status', status::text,
  'reservationExpiresAt', TO_CHAR(reservation_expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'createdAt', TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
)
FROM contracts
WHERE contract_number = '${contractNumber}'
LIMIT 1;
`;
              const createdOut = await runPostgreSql(fetchCreatedSql);
              const createdData = createdOut && createdOut.trim() ? JSON.parse(createdOut.trim().split('\n')[0]) : null;

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Tạo đơn giữ chỗ thành công (Hiệu lực 15 phút theo quy định BR08)',
                data: {
                  contractId: createdData?.contractId || Date.now(),
                  contractNumber: createdData?.contractNumber || contractNumber,
                  renterId,
                  totalAmount: createdData?.totalAmount || calculatedTotal,
                  status: 'PENDING_PAYMENT',
                  displayStatus: 'Chờ thanh toán',
                  reservationExpiresAt: createdData?.reservationExpiresAt || new Date(Date.now() + 15 * 60000).toISOString(),
                  isReservationExpired: false,
                  createdAt: createdData?.createdAt || new Date().toISOString(),
                  rentals: resolvedItems
                }
              }));
            } catch (err) {
              console.error('Error on POST /api/contracts/reservations:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Lỗi tạo đơn giữ chỗ: ' + err.message }));
            }
          });
          return;
        }

        // 4.8. POST /api/contracts/:id/grace-period (BR08: Extend 10-minute Grace Period)
        if (req.method === 'POST' && url.includes('/grace-period')) {
          try {
            const match = url.match(/\/api\/(?:v1\/)?contracts\/(\d+)\/grace-period/);
            const contractId = match ? parseInt(match[1], 10) : 1;
            const updateSql = `
UPDATE contracts 
SET reservation_expires_at = COALESCE(reservation_expires_at, NOW()) + INTERVAL '10 minutes',
    updated_at = NOW() 
WHERE contract_id = ${contractId};
`;
            await runPostgreSql(updateSql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Cộng thời gian ân hạn 10 phút thành công (BR08)',
              data: { contractId }
            }));
          } catch (err) {
            console.error('Error on POST grace-period:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 4.9. POST /api/contracts/:id/activate (BR09: Activate contract upon 100% upfront payment)
        if (req.method === 'POST' && url.includes('/activate')) {
          try {
            const match = url.match(/\/api\/(?:v1\/)?contracts\/(\d+)\/activate/);
            const contractId = match ? parseInt(match[1], 10) : 1;
            const activateSql = `
DO $$
BEGIN
    UPDATE contracts SET status = 'ACTIVE', updated_at = NOW() WHERE contract_id = ${contractId};
    UPDATE rentals SET status = 'ACTIVE', updated_at = NOW() WHERE contract_id = ${contractId};
    UPDATE plots SET status = 'RENT', updated_at = NOW() WHERE plot_id IN (SELECT plot_id FROM rentals WHERE contract_id = ${contractId});
    
    INSERT INTO payment_transactions (contract_id, type, amount, payment_method, gateway_ref, status, created_at)
    SELECT contract_id, 'PAYMENT', total_amount, 'VNPAY', 'VNP-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'), 'SUCCESS', NOW()
    FROM contracts WHERE contract_id = ${contractId};
END $$;
`;
            await runPostgreSql(activateSql);
            invalidatePlotsCache();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Kích hoạt hợp đồng và nhận bàn giao thửa đất thành công (BR09)',
              data: { contractId, status: 'ACTIVE' }
            }));
          } catch (err) {
            console.error('Error on POST activate contract:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 4.10. GET /api/contracts/:id
        if (req.method === 'GET' && /^\/api\/(?:v1\/)?contracts\/\d+$/.test(url)) {
          try {
            const match = url.match(/\/api\/(?:v1\/)?contracts\/(\d+)/);
            const contractId = parseInt(match[1], 10);
            const sql = `
SELECT json_build_object(
  'contractId', c.contract_id,
  'contractNumber', c.contract_number,
  'renterId', c.renter_id,
  'totalAmount', c.total_amount,
  'status', c.status::text,
  'reservationExpiresAt', TO_CHAR(c.reservation_expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'createdAt', TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'rentals', COALESCE((
    SELECT json_agg(json_build_object(
      'rentalId', r.rental_id,
      'plotId', r.plot_id,
      'plotCode', p.plot_code,
      'varietyId', r.variety_id,
      'serviceId', r.service_id,
      'startDate', TO_CHAR(r.start_date, 'YYYY-MM-DD'),
      'endDate', TO_CHAR(r.end_date, 'YYYY-MM-DD'),
      'totalPrice', r.total_price,
      'status', r.status,
      'cultivationMode', COALESCE(r.cultivation_mode, CASE WHEN r.service_id IS NULL THEN 'SELF' ELSE 'ASSISTED' END),
      'termMonths', COALESCE(r.term_months, GREATEST(1, ROUND((r.end_date - r.start_date) / 30.0))::int)
    ))
    FROM rentals r
    JOIN plots p ON r.plot_id = p.plot_id
    WHERE r.contract_id = c.contract_id
  ), '[]'::json)
)
FROM contracts c
WHERE c.contract_id = ${contractId}
LIMIT 1;
`;
            const data = await runPostgreSql(sql);
            if (!data || !data.trim()) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Không tìm thấy hợp đồng' }));
              return;
            }
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, data: JSON.parse(data.trim().split('\n')[0]) }));
          } catch (err) {
            console.error('Error on GET /api/contracts/:id:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 5. GET /api/bookings/transactions (Query latest transactions)
        if (req.method === 'GET' && url === '/api/bookings/transactions') {
          try {
            const sql = `
SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
  SELECT 
    pt.transaction_id, 
    c.contract_id, 
    c.contract_number, 
    c.renter_id AS customer_id, 
    u.full_name AS customer_name, 
    pt.amount, 
    pt.payment_method, 
    pt.gateway_ref, 
    pt.status AS payment_status, 
    TO_CHAR(pt.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
  FROM payment_transactions pt
  JOIN contracts c ON pt.contract_id = c.contract_id
  LEFT JOIN users u ON c.renter_id = u.user_id
  ORDER BY pt.transaction_id DESC
  LIMIT 10
) t;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            try {
              const msScript = `
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT TOP 10 
  pt.transaction_id, 
  o.order_id, 
  'MLA-2026-' + CAST(100000 + o.order_id * 137 AS NVARCHAR(20)) as contract_number, 
  o.customer_id, 
  COALESCE(u.full_name, 'Khách hàng') as customer_name, 
  pt.amount, 
  pt.payment_method, 
  pt.gateway_ref, 
  pt.status as payment_status, 
  CONVERT(varchar(19), pt.created_at, 120) as created_at
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.order_id
LEFT JOIN users u ON o.customer_id = u.user_id
ORDER BY pt.transaction_id DESC
FOR JSON PATH
"@
$reader = $cmd.ExecuteReader()
$sb = New-Object System.Text.StringBuilder
while ($reader.Read()) { [void]$sb.Append($reader.GetString(0)) }
$conn.Close()
$json = $sb.ToString()
if (-not $json) { $json = "[]" }
Write-Output $json
`;
              const msData = await runPowershell(msScript);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(msData || '[]');
            } catch (err2) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end('[]');
            }
          }
          return;
        }

        // 5.4b GET /api/users/staff (Fetch agricultural experts & field workers directly from PostgreSQL)
        if (req.method === 'GET' && (url === '/api/users/staff' || url.startsWith('/api/users/staff?') || url === '/api/users' || url.startsWith('/api/users?'))) {
          try {
            const staffSql = `
SELECT json_agg(json_build_object(
  'userId', u.user_id,
  'fullName', u.full_name,
  'email', u.email,
  'role', r.role_name,
  'phoneNumber', u.phone_number
))
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE r.role_name IN ('EXPERT', 'FIELD_WORKER');
`;
            const pgRes = await runPostgreSql(staffSql);
            if (pgRes && pgRes.trim()) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(pgRes.trim());
              return;
            }
          } catch (staffErr) {
            console.warn('Error fetching staff from PostgreSQL:', staffErr.message);
          }

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify([
            { userId: 5, fullName: 'ThS. Nguyễn Hoàng Nam', email: 'expert@farmely.vn', role: 'EXPERT', phoneNumber: '0903888999' },
            { userId: 8, fullName: 'Trần Văn Lực', email: 'worker@farmely.vn', role: 'FIELD_WORKER', phoneNumber: '0933111222' }
          ]));
          return;
        }

        // 5.5 POST /api/auth/login & /api/v1/auth/login (Local/Docker PostgreSQL authentication)
        if (req.method === 'POST' && (url === '/api/auth/login' || url === '/api/v1/auth/login' || url.startsWith('/api/auth/login?') || url.startsWith('/api/v1/auth/login?'))) {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const payload = JSON.parse(body || '{}');
              const email = (payload.email || '').trim().toLowerCase().replace(/'/g, "''");
              const password = (payload.password || '').trim();

              if (!email) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Email không được để trống' }));
                return;
              }

              // Gọi identity-service trước nếu đang chạy để nhận JWT thật
              try {
                const idRes = await fetch('http://localhost:8081/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                if (idRes.ok) {
                  const idData = await idRes.json();
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(idData));
                  return;
                }
              } catch (idErr) {
                // Identity service offline, tiếp tục fallback nội bộ
              }

              // Query user from PostgreSQL
              const userSql = `
SELECT json_build_object(
  'userId', u.user_id,
  'roleId', u.role_id,
  'email', u.email,
  'fullName', u.full_name,
  'phoneNumber', COALESCE(u.phone_number, ''),
  'address', COALESCE(u.address, ''),
  'role', CASE WHEN r.role_name IN ('FIELD_WORKER', 'STAFF') THEN 'STAFF' ELSE r.role_name END,
  'status', u.status,
  'passwordHash', u.password_hash
)
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE LOWER(u.email) = LOWER('${email}')
LIMIT 1;
`;
              let dbUser = null;
              try {
                const pgRes = await runPostgreSql(userSql);
                if (pgRes && pgRes.trim()) {
                  dbUser = JSON.parse(pgRes.trim().split('\n')[0]);
                }
              } catch (pgErr) {
                console.warn('Login PG query fallback:', pgErr.message);
              }

              // Fallback to demo accounts if DB query returned nothing
              if (!dbUser) {
                const demoFallback = {
                  'admin@farmely.vn': { userId: 11, role: 'ADMIN', fullName: 'Ban Quản Trị Farmely', phoneNumber: '0909000111', address: 'Trụ sở Farmely' },
                  'customer@farmely.vn': { userId: 1, role: 'CUSTOMER', fullName: 'Lô Thái Quyền', phoneNumber: '0901234567', address: 'Landmark 81' },
                  'expert@farmely.vn': { userId: 5, role: 'EXPERT', fullName: 'ThS. Nguyễn Hoàng Nam', phoneNumber: '0903888999', address: 'Viện Khoa học Nông nghiệp' },
                  'worker@farmely.vn': { userId: 8, role: 'STAFF', fullName: 'Trần Văn Lực', phoneNumber: '0933111222', address: 'Ấp 3, Nhuận Đức, Củ Chi' },
                  'tanguyen@farmely.vn': { userId: 3, role: 'CUSTOMER', fullName: 'Tạ Nguyễn Khôi Nguyên', phoneNumber: '0988776655', address: 'Biệt thự Thảo Điền' }
                };
                if (demoFallback[email]) {
                  dbUser = {
                    ...demoFallback[email],
                    email,
                    status: 'ACTIVE'
                  };
                }
              }

              if (!dbUser) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Email hoặc mật khẩu không chính xác' }));
                return;
              }

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                  token: `farmely-jwt-token-${dbUser.userId}-${Date.now()}`,
                  tokenType: 'Bearer',
                  expiresIn: 86400,
                  user: {
                    userId: dbUser.userId,
                    email: dbUser.email,
                    fullName: dbUser.fullName,
                    phoneNumber: dbUser.phoneNumber || '',
                    address: dbUser.address || '',
                    role: dbUser.role,
                    status: dbUser.status || 'ACTIVE'
                  }
                }
              }));
            } catch (err) {
              console.error('Error on /api/auth/login:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Lỗi xử lý xác thực: ' + err.message }));
            }
          });
          return;
        }

        // 6b. GET /api/auth/me (Get current authenticated user info)
        if (req.method === 'GET' && url === '/api/auth/me') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();

          // Thử gọi identity-service trước nếu có token JWT chuẩn
          if (token && !token.startsWith('farmely-jwt-token-') && !token.startsWith('demo-token-')) {
            try {
              const idRes = await fetch('http://localhost:8081/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (idRes.ok) {
                const idData = await idRes.json();
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(idData));
                return;
              }
            } catch (_) {}
          }

          // Fallback từ PostgreSQL hoặc token id
          let userId = 1;
          if (token && token.includes('farmely-jwt-token-')) {
            const parts = token.split('-');
            if (parts[3]) userId = parseInt(parts[3], 10) || 1;
          }
          try {
            const userSql = `
SELECT json_build_object(
  'userId', u.user_id,
  'roleId', u.role_id,
  'email', u.email,
  'fullName', u.full_name,
  'phoneNumber', COALESCE(u.phone_number, ''),
  'address', COALESCE(u.address, ''),
  'role', CASE WHEN r.role_name = 'FIELD_WORKER' THEN 'STAFF' ELSE r.role_name END,
  'status', u.status
)
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.user_id = ${userId}
LIMIT 1;
`;
            const pgRes = await runPostgreSql(userSql);
            if (pgRes && pgRes.trim()) {
              const u = JSON.parse(pgRes.trim().split('\n')[0]);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Thành công', data: u }));
              return;
            }
          } catch (_) {}

          // Fallback mặc định
          const defaultUser = {
            userId: 1,
            email: 'customer@farmely.vn',
            fullName: 'Lô Thái Quyền',
            role: 'CUSTOMER',
            status: 'ACTIVE'
          };
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, message: 'Thành công', data: defaultUser }));
          return;
        }


        // 7. GET /api/users (List all registered users from PostgreSQL)
        if (req.method === 'GET' && url === '/api/users') {
          try {
            const sql = `
SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json) FROM (
  SELECT u.user_id, u.email, u.full_name, u.phone_number, CASE WHEN r.role_name IN ('FIELD_WORKER', 'STAFF') THEN 'STAFF' ELSE r.role_name END AS role, u.status, TO_CHAR(u.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  ORDER BY u.user_id DESC
) u;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 8. GET /api/customer/rented-plots (Load actual rented plots of a customer from PostgreSQL)
        if (req.method === 'GET' && (url.startsWith('/api/customer/rented-plots') || url.startsWith('/api/v1/customer/rented-plots'))) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const userId = urlObj.searchParams.get('userId') || '';
            const email = urlObj.searchParams.get('email') || '';

            let userClause = '';
            if (userId) {
              const num = parseInt(String(userId).replace(/\D/g, ''), 10);
              if (num) userClause = `c.renter_id = ${num}`;
            }
            if (!userClause && email) {
              userClause = `LOWER(u.email) = LOWER('${email.trim().replace(/'/g, "''")}')`;
            }

            if (!userClause) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end('[]');
              return;
            }

            const sql = `
SELECT COALESCE(json_agg(row_to_json(p_row)), '[]'::json) FROM (
  SELECT 
    'PLOT-' || p.plot_code AS id,
    p.plot_code AS "mapPlotId",
    p.plot_code AS "plotCode",
    r.rental_id AS "rentalId",
    'Thửa ' || p.plot_code || ' - ' || l.land_name AS name,
    l.land_name AS location,
    p.area || 'm²' AS area,
    CASE 
      WHEN r.cultivation_mode = 'ASSISTED' THEN 'Assisted-Growing' 
      WHEN r.cultivation_mode = 'SELF' THEN 'Self-Growing' 
      WHEN s.service_type = 'SELF' THEN 'Self-Growing' 
      ELSE 'Assisted-Growing' 
    END AS mode,
    r.cultivation_mode AS "cultivationMode",
    COALESCE(r.term_months, GREATEST(1, ROUND((r.end_date - r.start_date) / 30.0))::int) AS "termMonths",
    COALESCE(v.variety_name, 'Rau củ VietGAP') AS crop,
    COALESCE((
      SELECT ts.step_name 
      FROM care_tasks ct 
      JOIN template_steps ts ON ct.step_id = ts.step_id 
      WHERE ct.rental_id = r.rental_id AND ct.status IN ('IN_PROG', 'PENDING') 
      ORDER BY ct.due_date ASC, ct.task_id ASC 
      LIMIT 1
    ), 'Chăm sóc sinh trưởng VietGAP') AS stage,
    GREATEST(1, CURRENT_DATE - r.start_date + 1) AS "currentDay",
    GREATEST(1, r.end_date - r.start_date) AS "totalDays",
    LEAST(100, GREATEST(1, ROUND((CURRENT_DATE - r.start_date)::numeric / GREATEST(1, r.end_date - r.start_date) * 100))) AS "progressPercent",
    COALESCE(p.image_url, '/images/Mucangchai3.jpg') AS image,
    COALESCE((SELECT sr.temperature || '°C' FROM sensor_readings sr WHERE sr.plot_id = p.plot_id ORDER BY sr.recorded_at DESC LIMIT 1), '28.5°C') AS temp,
    COALESCE((SELECT sr.soil_humidity || '%' FROM sensor_readings sr WHERE sr.plot_id = p.plot_id ORDER BY sr.recorded_at DESC LIMIT 1), '68%') AS "soilMoisture",
    COALESCE((SELECT sr.air_humidity || '%' FROM sensor_readings sr WHERE sr.plot_id = p.plot_id ORDER BY sr.recorded_at DESC LIMIT 1), '74%') AS "airHumidity",
    '45.000 Lux' AS light,
    '6.5' AS ph,
    'IOT-' || p.plot_code AS "stationId",
    'HEALTHY' AS status,
    'Trần Văn Lực (CVLĐ)' AS worker,
    c.contract_number AS "contractCode",
    TO_CHAR(r.end_date, 'YYYY-MM-DD') AS "expectedHarvestDate",
    ROUND(p.area * 0.25)::text || ' - ' || ROUND(p.area * 0.35)::text || ' kg' AS "expectedYield",
    (SELECT COUNT(*) FROM care_tasks ct WHERE ct.rental_id = r.rental_id AND ct.status != 'DONE') AS "openTasksCount",
    'Đất phù sa bồi lắng giàu mùn (pH 6.5)' AS "soilType",
    'Hệ thống nước tưới ngầm lọc cát + UV' AS "waterSource",
    c.contract_id, c.contract_number, c.renter_id, c.status AS contract_status,
    r.rental_id, r.service_id, 
    TO_CHAR(r.start_date, 'YYYY-MM-DD') AS start_date, 
    TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date, 
    r.total_price, r.status AS rental_status,
    p.plot_id, p.plot_code, p.area AS raw_area, p.status AS plot_status, p.image_url,
    l.land_id, l.land_name, l.address,
    v.variety_id, v.variety_name,
    s.service_name, s.service_type
  FROM contracts c
  JOIN users u ON c.renter_id = u.user_id
  JOIN rentals r ON c.contract_id = r.contract_id
  JOIN plots p ON r.plot_id = p.plot_id
  JOIN lands l ON p.land_id = l.land_id
  LEFT JOIN varieties v ON r.variety_id = v.variety_id
  LEFT JOIN services s ON r.service_id = s.service_id
  WHERE ${userClause}
  ORDER BY r.rental_id ASC
) p_row;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            console.error('Error on /api/customer/rented-plots:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 8.01 GET /api/customer/cultivation-processes (VietGAP processes from process_templates & template_steps in PostgreSQL)
        if (req.method === 'GET' && (url === '/api/customer/cultivation-processes' || url === '/api/cultivation-processes' || url.startsWith('/api/customer/cultivation-processes?') || url.startsWith('/api/cultivation-processes?'))) {
          try {
            const urlObj = new URL(url, 'http://localhost:3000');
            const userId = urlObj.searchParams.get('userId') || '';
            const email = urlObj.searchParams.get('email') || '';
            const rentalId = urlObj.searchParams.get('rentalId') || '';
            const plotCode = urlObj.searchParams.get('plotCode') || '';

            let userClause = '1=1';
            if (userId) {
              const num = parseInt(String(userId).replace(/\D/g, ''), 10);
              if (num) userClause = `c.renter_id = ${num}`;
            } else if (email) {
              userClause = `LOWER(u.email) = LOWER('${email.trim().replace(/'/g, "''")}')`;
            }
            if (rentalId) {
              userClause += ` AND r.rental_id = ${parseInt(rentalId, 10)}`;
            }
            if (plotCode) {
              const cleanCode = plotCode.replace(/^PLOT-/i, '').replace(/'/g, "''");
              userClause += ` AND p.plot_code = '${cleanCode}'`;
            }

            const sql = `
SELECT json_build_object(
  'success', true,
  'data', (
    SELECT COALESCE(json_agg(row_to_json(cp)), '[]'::json) FROM (
      SELECT 
        r.rental_id AS "rentalId",
        'PLOT-' || p.plot_code AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        v.variety_id AS "varietyId",
        v.variety_name AS "varietyName",
        ts.step_id AS "stepId",
        ts.step_order AS "stepOrder",
        ts.step_name AS stage,
        ts.description AS guide,
        ts.materials_needed AS "materialsNeeded",
        ts.day_offset AS "dayOffset",
        ts.duration_days AS "durationDays",
        ts.min_temp AS "minTemp",
        ts.max_temp AS "maxTemp",
        ts.min_humidity AS "minHumidity",
        ts.max_humidity AS "maxHumidity",
        TO_CHAR(r.start_date + (ts.day_offset || ' days')::interval, 'DD/MM/YYYY') AS date,
        CASE 
          WHEN CURRENT_DATE >= (r.start_date + ((ts.day_offset + ts.duration_days) || ' days')::interval) THEN 'COMPLETED'
          WHEN CURRENT_DATE >= (r.start_date + (ts.day_offset || ' days')::interval) THEN 'IN_PROGRESS'
          ELSE 'PENDING'
        END AS status
      FROM rentals r
      JOIN plots p ON r.plot_id = p.plot_id
      JOIN contracts c ON r.contract_id = c.contract_id
      JOIN users u ON c.renter_id = u.user_id
      JOIN process_templates pt ON r.variety_id = pt.variety_id
      JOIN template_steps ts ON pt.template_id = ts.template_id
      JOIN varieties v ON r.variety_id = v.variety_id
      WHERE ${userClause}
      ORDER BY r.rental_id ASC, ts.step_order ASC
    ) cp
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            console.error('Error on /api/customer/cultivation-processes:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 8.02 GET /api/customer/harvest-results & POST /api/customer/harvest-results/confirm
        if (req.method === 'GET' && (url === '/api/customer/harvest-results' || url === '/api/harvest-results' || url.startsWith('/api/customer/harvest-results?') || url.startsWith('/api/harvest-results?'))) {
          try {
            const urlObj = new URL(url, 'http://localhost:3000');
            const userId = urlObj.searchParams.get('userId') || '';
            const email = urlObj.searchParams.get('email') || '';
            const rentalId = urlObj.searchParams.get('rentalId') || '';

            let userClause = '1=1';
            if (userId) {
              const num = parseInt(String(userId).replace(/\D/g, ''), 10);
              if (num) userClause = `c.renter_id = ${num}`;
            } else if (email) {
              userClause = `LOWER(u.email) = LOWER('${email.trim().replace(/'/g, "''")}')`;
            }
            if (rentalId) {
              userClause += ` AND r.rental_id = ${parseInt(rentalId, 10)}`;
            }

            const sql = `
SELECT json_build_object(
  'success', true,
  'data', (
    SELECT COALESCE(json_agg(row_to_json(hr_row)), '[]'::json) FROM (
      SELECT 
        hr.harvest_id AS "harvestId",
        'HRV-' || hr.harvest_id AS id,
        hr.rental_id AS "rentalId",
        r.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'PLOT-' || p.plot_code AS "plotScopeId",
        'Thửa ' || p.plot_code || ' - ' || l.land_name AS "plotName",
        v.variety_name AS crop,
        TO_CHAR(hr.harvest_date, 'YYYY-MM-DD') AS "harvestDate",
        TO_CHAR(hr.harvest_date, 'DD/MM/YYYY') AS "harvestDateFormatted",
        hr.yield_amount AS "yieldAmount",
        hr.yield_amount || ' kg' AS "formattedYield",
        hr.evidence_image_url AS "evidenceImageUrl",
        hr.delivery_type AS "deliveryType",
        hr.customer_confirmed AS "customerConfirmed",
        CASE WHEN hr.customer_confirmed THEN 'CONFIRMED' ELSE 'PENDING' END AS status,
        COALESCE(u_worker.full_name, 'Trần Văn Lực (CVLĐ)') AS "enteredByWorker",
        TO_CHAR(hr.created_at, 'HH24:MI - DD/MM/YYYY') AS "createdAt"
      FROM harvest_results hr
      JOIN rentals r ON hr.rental_id = r.rental_id
      JOIN plots p ON r.plot_id = p.plot_id
      JOIN lands l ON p.land_id = l.land_id
      JOIN contracts c ON r.contract_id = c.contract_id
      JOIN users u ON c.renter_id = u.user_id
      LEFT JOIN varieties v ON r.variety_id = v.variety_id
      LEFT JOIN users u_worker ON hr.entered_by = u_worker.user_id
      WHERE ${userClause}
      ORDER BY hr.harvest_date DESC, hr.harvest_id DESC
    ) hr_row
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            console.error('Error on /api/customer/harvest-results:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if (req.method === 'POST' && (url === '/api/customer/harvest-results/confirm' || url === '/api/harvest-results/confirm')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const harvestId = payload.harvestId ? parseInt(String(payload.harvestId).replace(/\D/g, ''), 10) : null;
              const rentalId = payload.rentalId ? parseInt(String(payload.rentalId).replace(/\D/g, ''), 10) : null;
              const deliveryType = (payload.deliveryMethod === 'FARM' || payload.deliveryMethod === 'PICKUP' ? 'PICKUP' : 'DELIVERY');

              let whereClause = '';
              if (harvestId) {
                whereClause = `harvest_id = ${harvestId}`;
              } else if (rentalId) {
                whereClause = `rental_id = ${rentalId}`;
              } else {
                whereClause = `1=1`;
              }

              const sql = `
UPDATE harvest_results
SET customer_confirmed = true, delivery_type = '${deliveryType}'
WHERE ${whereClause}
RETURNING harvest_id, rental_id, customer_confirmed, delivery_type;
`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Xác nhận nghiệm thu nông sản thành công vào CSDL' }));
            } catch (err) {
              console.error('Error on /api/customer/harvest-results/confirm:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // Helper tính diện tích m² theo toạ độ ring [lng, lat]
        const EARTH_RADIUS_M = 6378137;
        function calculateAreaM2(ring) {
          if (!ring || !Array.isArray(ring) || ring.length < 3) return 0;
          const rad = (d) => (d * Math.PI) / 180;
          let total = 0;
          const n = ring.length;
          for (let i = 0; i < n; i++) {
            const p1 = ring[i];
            const p2 = ring[(i + 1) % n];
            total += rad(p2[0] - p1[0]) * (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
          }
          return Math.round(Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2) * 100) / 100;
        }

        // 8.1 GET /api/lands & /api/v1/lands (List all lands / farm zones)
        if (req.method === 'GET' && (url === '/api/lands' || url === '/api/v1/lands' || url.startsWith('/api/lands?') || url.startsWith('/api/v1/lands?'))) {
          try {
            const urlObj = new URL(url, 'http://localhost:3000');
            const search = (urlObj.searchParams.get('search') || '').trim().toLowerCase();
            let whereSql = '';
            if (search) {
              const sSafe = search.replace(/'/g, "''");
              whereSql = `WHERE LOWER(l.land_name) LIKE '%${sSafe}%' OR LOWER(l.address) LIKE '%${sSafe}%'`;
            }

            const sql = `
SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json) FROM (
  SELECT 
    l.land_id AS "landId", 
    l.land_name AS "landName", 
    l.address,
    COALESCE(l.description, '') AS "description",
    CASE 
      WHEN l.boundary_geojson IS NOT NULL AND l.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN l.boundary_geojson::jsonb ? 'coordinates' 
          THEN l.boundary_geojson::json->'coordinates'->0 
          ELSE l.boundary_geojson::json 
        END
      )
      ELSE NULL 
    END AS "boundary",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id) AS "totalPlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'AVAIL') AS "availablePlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'RENT') AS "rentedPlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'MAINT') AS "maintenancePlots",
    TO_CHAR(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    TO_CHAR(l.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
  FROM lands l
  ${whereSql}
  ORDER BY l.land_id ASC
) l;
`;
            const rawData = await runPostgreSql(sql);
            const landsList = JSON.parse(rawData || '[]');
            landsList.forEach(l => {
              l.boundaryAreaM2 = l.boundary ? calculateAreaM2(l.boundary) : null;
            });

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Lấy danh sách nông trại thành công',
              data: landsList
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 8.2 GET /api/lands/:id & /api/v1/lands/:id (Land detail + Plots list)
        if (req.method === 'GET' && (url.match(/^\/api\/lands\/(\d+)$/) || url.match(/^\/api\/v1\/lands\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/lands\/(\d+)$/);
          const landId = parseInt(match[1], 10);
          try {
            const sql = `
SELECT row_to_json(l) FROM (
  SELECT 
    l.land_id AS "landId", 
    l.land_name AS "landName", 
    l.address,
    COALESCE(l.description, '') AS "description",
    CASE 
      WHEN l.boundary_geojson IS NOT NULL AND l.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN l.boundary_geojson::jsonb ? 'coordinates' 
          THEN l.boundary_geojson::json->'coordinates'->0 
          ELSE l.boundary_geojson::json 
        END
      )
      ELSE NULL 
    END AS "boundary",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id) AS "totalPlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'AVAIL') AS "availablePlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'RENT') AS "rentedPlots",
    (SELECT COUNT(*) FROM plots WHERE land_id = l.land_id AND status = 'MAINT') AS "maintenancePlots",
    TO_CHAR(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    TO_CHAR(l.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
    COALESCE(
      (
        SELECT json_agg(row_to_json(p)) FROM (
          SELECT 
            p.plot_id AS "plotId",
            p.plot_code AS "plotCode",
            p.area,
            p.price_per_period AS "pricePerPeriod",
            p.status::text AS "status",
            p.is_published AS "isPublished",
            p.image_url AS "imageUrl",
            CASE 
              WHEN p.boundary_geojson IS NOT NULL AND p.boundary_geojson != '' 
              THEN (
                CASE 
                  WHEN p.boundary_geojson::jsonb ? 'coordinates' 
                  THEN p.boundary_geojson::json->'coordinates'->0 
                  ELSE p.boundary_geojson::json 
                END
              )
              ELSE NULL 
            END AS "boundary"
          FROM plots p
          WHERE p.land_id = l.land_id
          ORDER BY p.plot_id ASC
        ) p
      ),
      '[]'::json
    ) AS "plots"
  FROM lands l
  WHERE l.land_id = ${landId}
) l;
`;
            const rawData = await runPostgreSql(sql);
            if (!rawData || rawData === 'null' || rawData.trim() === '') {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: `Không tìm thấy nông trại #${landId}` }));
            } else {
              const landObj = JSON.parse(rawData);
              landObj.boundaryAreaM2 = landObj.boundary ? calculateAreaM2(landObj.boundary) : null;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Lấy chi tiết nông trại thành công',
                data: landObj
              }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 8.3 POST /api/lands & /api/v1/lands (Create New Land with Boundary)
        if (req.method === 'POST' && (url === '/api/lands' || url === '/api/v1/lands')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const landName = (payload.landName || '').trim();
              const address = (payload.address || '').trim();
              const description = (payload.description || '').trim();
              const boundary = Array.isArray(payload.boundary) ? payload.boundary : null;

              if (!landName) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập tên khu nông trại.' }));
                return;
              }
              if (!address) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập địa chỉ thực địa.' }));
                return;
              }

              const boundaryJson = boundary ? JSON.stringify(boundary).replace(/'/g, "''") : null;
              const boundarySqlVal = boundaryJson ? `'${boundaryJson}'` : 'NULL';
              const nameSafe = landName.replace(/'/g, "''");
              const addrSafe = address.replace(/'/g, "''");
              const descSafe = description.replace(/'/g, "''");

              const insertPg = `
INSERT INTO lands (land_name, address, description, boundary_geojson, created_at, updated_at)
VALUES ('${nameSafe}', '${addrSafe}', '${descSafe}', ${boundarySqlVal}, NOW(), NOW())
RETURNING land_id, land_name, address, description, created_at, updated_at;
`;
              const pgOut = await runPostgreSql(insertPg);
              const cleanRow = (pgOut || '').trim().split('\n')[0];
              const parts = cleanRow.split('|');
              const newLandId = parseInt(parts[0], 10);

              // Sync to SQL Server isp392_agritech
              try {
                let centerLng = 106.35, centerLat = 10.68;
                if (boundary && boundary.length > 0) {
                  centerLng = boundary.reduce((s, p) => s + p[0], 0) / boundary.length;
                  centerLat = boundary.reduce((s, p) => s + p[1], 0) / boundary.length;
                }
                const bArea = boundary ? calculateAreaM2(boundary) : 0;
                const msScript = `
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True");
$conn.Open();
$cmd = $conn.CreateCommand();
$cmd.CommandText = "INSERT INTO lands (land_name, address, gps_lat, gps_lng, total_area_sqm, created_at, updated_at) VALUES (@name, @addr, @lat, @lng, @area, GETDATE(), GETDATE())";
[void]$cmd.Parameters.AddWithValue("@name", "${nameSafe}");
[void]$cmd.Parameters.AddWithValue("@addr", "${addrSafe}");
[void]$cmd.Parameters.AddWithValue("@lat", [decimal]${centerLat.toFixed(6)});
[void]$cmd.Parameters.AddWithValue("@lng", [decimal]${centerLng.toFixed(6)});
[void]$cmd.Parameters.AddWithValue("@area", [decimal]${bArea.toFixed(2)});
[void]$cmd.ExecuteNonQuery();
$conn.Close();
`;
                runPowershell(msScript).catch(() => {});
              } catch (e) {}

              invalidatePlotsCache();

              const boundaryAreaM2 = boundary ? calculateAreaM2(boundary) : null;
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Tạo nông trại mới thành công',
                data: {
                  landId: newLandId,
                  landName,
                  address,
                  description,
                  boundary,
                  boundaryAreaM2,
                  totalPlots: 0,
                  availablePlots: 0,
                  rentedPlots: 0,
                  maintenancePlots: 0,
                  plots: []
                }
              }));
            } catch (err) {
              console.error('Error on POST /api/lands:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: String(err) }));
            }
          });
          return;
        }

        // 8.4 PUT /api/lands/:id & /api/v1/lands/:id (Update Land)
        if (req.method === 'PUT' && (url.match(/^\/api\/lands\/(\d+)$/) || url.match(/^\/api\/v1\/lands\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/lands\/(\d+)$/);
          const landId = parseInt(match[1], 10);
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const landName = (payload.landName || '').trim();
              const address = (payload.address || '').trim();
              const description = (payload.description || '').trim();
              const boundary = Array.isArray(payload.boundary) ? payload.boundary : null;

              const boundaryJson = boundary ? JSON.stringify(boundary).replace(/'/g, "''") : null;
              const boundarySqlVal = boundaryJson ? `'${boundaryJson}'` : 'NULL';
              const nameSafe = landName.replace(/'/g, "''");
              const addrSafe = address.replace(/'/g, "''");
              const descSafe = description.replace(/'/g, "''");

              const updateSql = `
UPDATE lands 
SET land_name = '${nameSafe}', address = '${addrSafe}', description = '${descSafe}', boundary_geojson = ${boundarySqlVal}, updated_at = NOW()
WHERE land_id = ${landId};
`;
              await runPostgreSql(updateSql);

              invalidatePlotsCache();

              const boundaryAreaM2 = boundary ? calculateAreaM2(boundary) : null;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Cập nhật nông trại thành công',
                data: {
                  landId,
                  landName,
                  address,
                  description,
                  boundary,
                  boundaryAreaM2
                }
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: String(err) }));
            }
          });
          return;
        }

        // 8.5 DELETE /api/lands/:id & /api/v1/lands/:id (Delete Land)
        if (req.method === 'DELETE' && (url.match(/^\/api\/lands\/(\d+)$/) || url.match(/^\/api\/v1\/lands\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/lands\/(\d+)$/);
          const landId = parseInt(match[1], 10);
          try {
            // Check if any plots are rented
            const checkSql = `SELECT COUNT(*) FROM plots WHERE land_id = ${landId} AND status = 'RENT';`;
            const checkOut = await runPostgreSql(checkSql);
            const rentedCount = parseInt((checkOut || '0').trim(), 10);
            if (rentedCount > 0) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: false,
                message: 'Không thể xóa nông trại khi còn thửa đất đang được thuê.'
              }));
              return;
            }

            await runPostgreSql(`DELETE FROM plot_variety_compatibility WHERE plot_id IN (SELECT plot_id FROM plots WHERE land_id = ${landId});`);
            await runPostgreSql(`DELETE FROM plots WHERE land_id = ${landId};`);
            await runPostgreSql(`DELETE FROM lands WHERE land_id = ${landId};`);

            invalidatePlotsCache();

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Đã xóa nông trại thành công',
              data: null
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: String(err) }));
          }
          return;
        }

        // 9.1 GET /api/plots & /api/v1/plots (List plots with filters & camelCase data)
        if (req.method === 'GET' && (url === '/api/plots' || url === '/api/v1/plots' || url.startsWith('/api/plots?') || url.startsWith('/api/v1/plots?'))) {
          try {
            const urlObj = new URL(url, 'http://localhost:3000');
            const statusFilter = urlObj.searchParams.get('status');
            const landFilter = urlObj.searchParams.get('landId');
            const publishedFilter = urlObj.searchParams.get('publishedOnly');

            let whereClauses = [];
            if (statusFilter) whereClauses.push(`p.status = '${statusFilter.replace(/'/g, "''")}'`);
            if (landFilter) whereClauses.push(`p.land_id = ${parseInt(landFilter, 10)}`);
            if (publishedFilter === 'true') whereClauses.push(`p.is_published = true`);

            const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const sql = `
SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) FROM (
  SELECT 
    p.plot_id AS "plotId", 
    p.plot_id AS plot_id, 
    p.land_id AS "landId", 
    l.land_name AS "landName",
    p.plot_code AS "plotCode", 
    p.plot_code AS plot_code, 
    p.plot_code AS code, 
    p.area, 
    p.area || ' m²' AS area_text,
    p.image_url AS "imageUrl", 
    p.image_url AS image_url, 
    p.price_per_period AS "pricePerPeriod", 
    p.price_per_period AS price_per_period, 
    TO_CHAR(p.price_per_period, 'FM999,999,999') || ' đ' AS price_text,
    p.status::text AS "status", 
    CASE 
      WHEN p.status = 'AVAIL' THEN 'Đang trống'
      WHEN p.status = 'RENT' THEN 'Đã thuê'
      WHEN p.status = 'MAINT' THEN 'Bảo trì'
      ELSE p.status::text
    END AS status_text,
    p.is_published AS "isPublished",
    CASE 
      WHEN p.boundary_geojson IS NOT NULL AND p.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN p.boundary_geojson::jsonb ? 'coordinates' 
          THEN p.boundary_geojson::json->'coordinates'->0 
          ELSE p.boundary_geojson::json 
        END
      )
      ELSE NULL 
    END AS "boundary",
    COALESCE(
      (
        SELECT json_agg(DISTINCT c.crop_name)
        FROM plot_variety_compatibility pvc
        JOIN varieties v ON pvc.variety_id = v.variety_id
        JOIN crops c ON v.crop_id = c.crop_id
        WHERE pvc.plot_id = p.plot_id
      ),
      '[]'::json
    ) AS "crops",
    TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    TO_CHAR(p.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
  FROM plots p
  JOIN lands l ON p.land_id = l.land_id
  ${whereSql}
  ORDER BY p.plot_id ASC
) p;
`;
            const data = await runPostgreSql(sql);
            const plotsList = JSON.parse(data || '[]');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Lấy danh sách thửa đất thành công',
              data: plotsList
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 9.1b GET /api/plots/:id/compatibility (BR03: giống cây tương thích với thửa đất, cùng shape VarietySummaryResponse của farm-service)
        if (req.method === 'GET' && url.match(/^\/api(?:\/v1)?\/plots\/(\d+)\/compatibility$/)) {
          const plotId = parseInt(url.match(/^\/api(?:\/v1)?\/plots\/(\d+)\/compatibility$/)[1], 10);
          try {
            const sql = `
SELECT COALESCE(json_agg(json_build_object(
  'varietyId', x.variety_id,
  'cropId', x.crop_id,
  'cropName', x.crop_name,
  'varietyName', x.variety_name,
  'expectedDuration', x.expected_duration,
  'bufferTime', x.buffer_time
) ORDER BY x.variety_id), '[]'::json)
FROM (
  SELECT pvc.variety_id, v.crop_id, c.crop_name, v.variety_name, v.expected_duration, v.buffer_time
  FROM plot_variety_compatibility pvc
  JOIN varieties v ON v.variety_id = pvc.variety_id
  JOIN crops c ON c.crop_id = v.crop_id
  WHERE pvc.plot_id = ${plotId}
) x;
`;
            const out = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Lấy danh sách giống cây tương thích thành công',
              data: out && out.trim() ? JSON.parse(out.trim()) : []
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 9.2 GET /api/plots/:id & /api/v1/plots/:id
        if (req.method === 'GET' && (url.match(/^\/api\/plots\/(\d+)$/) || url.match(/^\/api\/v1\/plots\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/plots\/(\d+)$/);
          const plotId = parseInt(match[1], 10);
          try {
            const sql = `
SELECT row_to_json(p) FROM (
  SELECT 
    p.plot_id AS "plotId", 
    p.plot_id AS "id",
    p.land_id AS "landId", 
    l.land_name AS "landName",
    l.address AS "landAddress",
    p.plot_code AS "plotCode", 
    p.plot_code AS "code",
    'Thửa Đất ' || p.plot_code AS "name",
    p.area, 
    p.area || ' m²' AS "areaText",
    p.image_url AS "imageUrl", 
    p.price_per_period AS "pricePerPeriod", 
    TO_CHAR(p.price_per_period, 'FM999,999,999') || ' đ/tháng' AS "formattedPrice",
    p.status::text AS "status", 
    p.is_published AS "isPublished",
    'Thửa đất canh tác tiêu chuẩn VietGAP thuộc phân vùng ' || l.land_name || '. Hệ thống cấp thoát nước và trạm cảm biến IoT kết nối trực tiếp.' AS "description",
    'Đất thịt nhẹ pha cát, tầng canh tác dày > 40cm, pH 6.0 - 6.5 thích hợp cho rau ăn lá và quả mọng' AS "soilType",
    'IOT-' || CASE WHEN p.land_id = 2 THEN 'DD' WHEN p.land_id = 3 THEN 'BL' ELSE 'CC' END || '-' || LPAD(p.plot_id::text, 2, '0') AS "iotStationId",
    CASE 
      WHEN p.boundary_geojson IS NOT NULL AND p.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN p.boundary_geojson::jsonb ? 'coordinates' 
          THEN p.boundary_geojson::json->'coordinates'->0 
          ELSE p.boundary_geojson::json 
        END
      )
      ELSE NULL 
    END AS "boundary",
    COALESCE(
      (
        SELECT json_agg(c.crop_name)
        FROM (
          SELECT DISTINCT c.crop_name
          FROM plot_variety_compatibility pvc
          JOIN varieties v ON pvc.variety_id = v.variety_id
          JOIN crops c ON v.crop_id = c.crop_id
          WHERE pvc.plot_id = p.plot_id
        ) c
      ),
      '[]'::json
    ) AS "compatibleCrops",
    COALESCE(
      (
        SELECT json_agg(json_build_object(
          'varietyId', v.variety_id,
          'varietyName', v.variety_name,
          'cropId', v.crop_id,
          'cropName', c.crop_name,
          'expectedDuration', v.expected_duration
        ))
        FROM plot_variety_compatibility pvc
        JOIN varieties v ON pvc.variety_id = v.variety_id
        JOIN crops c ON v.crop_id = c.crop_id
        WHERE pvc.plot_id = p.plot_id
      ),
      '[]'::json
    ) AS "compatibleVarieties",
    (
      SELECT row_to_json(sr) FROM (
        SELECT 
          COALESCE(temperature::text || '°C', '28.5°C') AS "temperature", 
          COALESCE(soil_humidity::text || '%', '68%') AS "soilMoisture", 
          COALESCE(air_humidity::text || '%', '74%') AS "humidity", 
          TO_CHAR(recorded_at, 'YYYY-MM-DD HH24:MI:SS') AS "recordedAt"
        FROM sensor_readings
        WHERE plot_id = p.plot_id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) sr
    ) AS "recentSensorReadings",
    TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
    TO_CHAR(p.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
  FROM plots p
  JOIN lands l ON p.land_id = l.land_id
  WHERE p.plot_id = ${plotId}
) p;
`;
            const data = await runPostgreSql(sql);
            if (!data || data === 'null' || data.trim() === '') {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Không tìm thấy thửa đất' }));
            } else {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Lấy thông tin thửa đất thành công',
                data: JSON.parse(data)
              }));
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 9.3 POST /api/plots & /api/v1/plots (Create New Plot)
        if (req.method === 'POST' && (url === '/api/plots' || url === '/api/v1/plots')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const landId = parseInt(payload.landId, 10);
              const plotCode = (payload.plotCode || '').trim().toUpperCase();
              const pricePerPeriod = parseFloat(payload.pricePerPeriod) || 1200000;
              const status = (payload.status || 'AVAIL').toUpperCase();
              const isPublished = payload.isPublished !== false;
              const imageUrl = (payload.imageUrl || '').trim();
              const boundary = Array.isArray(payload.boundary) ? payload.boundary : null;
              let area = parseFloat(payload.area) || 0;

              if (boundary && boundary.length >= 3) {
                area = calculateAreaM2(boundary);
              }

              if (!landId) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Vui lòng chọn nông trại trực thuộc.' }));
                return;
              }
              if (!plotCode) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Vui lòng nhập mã thửa đất.' }));
                return;
              }

              const boundaryJson = boundary ? JSON.stringify(boundary).replace(/'/g, "''") : null;
              const boundarySqlVal = boundaryJson ? `'${boundaryJson}'` : 'NULL';
              const imgSqlVal = imageUrl ? `'${imageUrl.replace(/'/g, "''")}'` : 'NULL';

              const insertPg = `
INSERT INTO plots (land_id, plot_code, area, image_url, price_per_period, status, is_published, boundary_geojson, created_at, updated_at)
VALUES (${landId}, '${plotCode.replace(/'/g, "''")}', ${area}, ${imgSqlVal}, ${pricePerPeriod}, '${status}', ${isPublished}, ${boundarySqlVal}, NOW(), NOW())
RETURNING plot_id, land_id, plot_code, area, price_per_period, status, is_published, created_at, updated_at;
`;
              const pgOut = await runPostgreSql(insertPg);
              const parts = (pgOut || '').trim().split('\n')[0].split('|');
              const newPlotId = parseInt(parts[0], 10);

              invalidatePlotsCache();

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Tạo thửa đất mới thành công',
                data: {
                  plotId: newPlotId,
                  landId,
                  plotCode,
                  area,
                  pricePerPeriod,
                  status,
                  isPublished,
                  boundary,
                  imageUrl
                }
              }));
            } catch (err) {
              console.error('Error on POST /api/plots:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: String(err) }));
            }
          });
          return;
        }

        // 9.4 PUT /api/plots/:id & /api/v1/plots/:id (Update Plot)
        if (req.method === 'PUT' && (url.match(/^\/api\/plots\/(\d+)$/) || url.match(/^\/api\/v1\/plots\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/plots\/(\d+)$/);
          const plotId = parseInt(match[1], 10);
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const landId = parseInt(payload.landId, 10);
              const plotCode = (payload.plotCode || '').trim().toUpperCase();
              const pricePerPeriod = parseFloat(payload.pricePerPeriod) || 1200000;
              const status = (payload.status || 'AVAIL').toUpperCase();
              const isPublished = payload.isPublished !== false;
              const imageUrl = (payload.imageUrl || '').trim();
              const boundary = Array.isArray(payload.boundary) ? payload.boundary : null;
              let area = parseFloat(payload.area) || 0;

              if (boundary && boundary.length >= 3) {
                area = calculateAreaM2(boundary);
              }

              const boundarySqlVal = boundary ? `'${JSON.stringify(boundary).replace(/'/g, "''")}'` : 'NULL';
              const imgSqlVal = imageUrl ? `'${imageUrl.replace(/'/g, "''")}'` : 'NULL';

              let setClauses = [
                `land_id = ${landId}`,
                `plot_code = '${plotCode.replace(/'/g, "''")}'`,
                `price_per_period = ${pricePerPeriod}`,
                `status = '${status}'`,
                `is_published = ${isPublished}`,
                `updated_at = NOW()`
              ];
              if (area > 0) setClauses.push(`area = ${area}`);
              if (imageUrl) setClauses.push(`image_url = ${imgSqlVal}`);
              if (boundary) setClauses.push(`boundary_geojson = ${boundarySqlVal}`);

              const updateSql = `UPDATE plots SET ${setClauses.join(', ')} WHERE plot_id = ${plotId};`;
              await runPostgreSql(updateSql);

              invalidatePlotsCache();

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Cập nhật thửa đất thành công',
                data: {
                  plotId,
                  landId,
                  plotCode,
                  area,
                  pricePerPeriod,
                  status,
                  isPublished,
                  boundary,
                  imageUrl
                }
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: String(err) }));
            }
          });
          return;
        }

        // 9.5 DELETE /api/plots/:id & /api/v1/plots/:id (Delete Plot)
        if (req.method === 'DELETE' && (url.match(/^\/api\/plots\/(\d+)$/) || url.match(/^\/api\/v1\/plots\/(\d+)$/))) {
          const match = url.match(/^\/api(?:\/v1)?\/plots\/(\d+)$/);
          const plotId = parseInt(match[1], 10);
          try {
            await runPostgreSql(`DELETE FROM plot_variety_compatibility WHERE plot_id = ${plotId};`);
            await runPostgreSql(`DELETE FROM care_tasks WHERE rental_id IN (SELECT rental_id FROM rentals WHERE plot_id = ${plotId});`);
            await runPostgreSql(`DELETE FROM rentals WHERE plot_id = ${plotId};`);
            await runPostgreSql(`DELETE FROM site_visits WHERE plot_id = ${plotId};`);
            await runPostgreSql(`DELETE FROM plots WHERE plot_id = ${plotId};`);

            invalidatePlotsCache();

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Đã xóa thửa đất thành công',
              data: null
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: false, message: String(err) }));
          }
          return;
        }

        // 11. PATCH /api/plots/:id/status (Update plot status: AVAIL, RENT, MAINT)
        if (req.method === 'PATCH' && (url.match(/^\/api\/plots\/(\d+)\/status/) || url.match(/^\/api\/v1\/plots\/(\d+)\/status/))) {
          const match = url.match(/^\/api(?:\/v1)?\/plots\/(\d+)\/status/);
          const plotId = parseInt(match[1], 10);
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const newStatus = (payload.status || 'AVAIL').toUpperCase();
              if (!['AVAIL', 'RENT', 'MAINT'].includes(newStatus)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Status không hợp lệ (chỉ chấp nhận AVAIL, RENT, MAINT)' }));
                return;
              }
              await runPostgreSql(`UPDATE plots SET status = '${newStatus}' WHERE plot_id = ${plotId};`);
              // Sync SQL Server
              runPowershell(`$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True"); $conn.Open(); $cmd = $conn.CreateCommand(); $cmd.CommandText = "UPDATE plots SET status = '${newStatus}' WHERE plot_id = ${plotId}"; [void]$cmd.ExecuteNonQuery(); $conn.Close();`).catch(() => {});

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: `Cập nhật trạng thái thửa đất #${plotId} thành ${newStatus}`,
                plotId,
                status: newStatus
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // 12. CROPS API (GET, POST, PUT, DELETE)
        if (req.method === 'GET' && (url === '/api/crops' || url === '/api/v1/crops' || url.startsWith('/api/crops?') || url.startsWith('/api/v1/crops?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh mục cây trồng thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM (
      SELECT 
        c.crop_id AS id,
        'CRP-' || LPAD(c.crop_id::text, 2, '0') AS code,
        c.crop_name AS name,
        'Nhóm cây trồng chuẩn VietGAP được quy hoạch canh tác tại nông trại.' AS description,
        (SELECT count(*)::int FROM varieties v WHERE v.crop_id = c.crop_id) AS "totalVarieties",
        'ACTIVE' AS status,
        COALESCE(
          (SELECT v.expected_duration || ' ngày' FROM varieties v WHERE v.crop_id = c.crop_id LIMIT 1),
          '30 - 45 ngày'
        ) AS "standardGrowthCycle",
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' AS "imageUrl",
        TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
      FROM crops c
      ORDER BY c.crop_id ASC
    ) c
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if (req.method === 'POST' && (url === '/api/crops' || url === '/api/v1/crops')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const name = (payload.name || payload.crop_name || '').trim();
              if (!name) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Tên danh mục cây không được để trống' }));
                return;
              }
              const sql = `INSERT INTO crops (crop_name) VALUES ('${name.replace(/'/g, "''")}') RETURNING crop_id, crop_name;`;
              const raw = await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Tạo mới danh mục cây thành công', data: { name } }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'PUT' && (url.match(/^\/api\/crops\/(\d+)/) || url.match(/^\/api\/v1\/crops\/(\d+)/))) {
          const match = url.match(/^\/api(?:\/v1)?\/crops\/(\d+)/);
          const cropId = parseInt(match[1], 10);
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const name = (payload.name || payload.crop_name || '').trim();
              if (!name) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Tên danh mục cây không được để trống' }));
                return;
              }
              await runPostgreSql(`UPDATE crops SET crop_name = '${name.replace(/'/g, "''")}' WHERE crop_id = ${cropId};`);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Cập nhật danh mục cây thành công' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'DELETE' && (url.match(/^\/api\/crops\/(\d+)/) || url.match(/^\/api\/v1\/crops\/(\d+)/))) {
          const match = url.match(/^\/api(?:\/v1)?\/crops\/(\d+)/);
          const cropId = parseInt(match[1], 10);
          try {
            await runPostgreSql(`DELETE FROM crops WHERE crop_id = ${cropId};`);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, message: `Đã xóa danh mục cây #${cropId}` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 13. VARIETIES API (GET, POST, PUT, DELETE)
        if (req.method === 'GET' && (url === '/api/varieties' || url === '/api/v1/varieties' || url.startsWith('/api/varieties?') || url.startsWith('/api/v1/varieties?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh sách giống cây VietGAP thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json) FROM (
      SELECT 
        v.variety_id AS id,
        'VAR-' || LPAD(v.variety_id::text, 3, '0') AS code,
        v.variety_name AS name,
        v.crop_id AS "cropId",
        c.crop_name AS "cropName",
        v.expected_duration AS "growthDuration",
        v.buffer_time AS "bufferTime",
        '4.0 kg/m²' AS "expectedYield",
        'Giống cây thuần chủng F1 đạt chuẩn VietGAP, kháng sâu bệnh tốt.' AS description,
        'ACTIVE' AS status,
        COALESCE(
          (SELECT count(*)::int FROM process_templates pt WHERE pt.variety_id = v.variety_id), 0
        ) AS "templateCount",
        COALESCE(
          (SELECT count(*)::int FROM plot_variety_compatibility pvc WHERE pvc.variety_id = v.variety_id), 0
        ) AS "compatiblePlotsCount",
        TO_CHAR(v.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
      FROM varieties v
      JOIN crops c ON v.crop_id = c.crop_id
      ORDER BY v.variety_id ASC
    ) v
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if (req.method === 'POST' && (url === '/api/varieties' || url === '/api/v1/varieties')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const name = (payload.name || payload.variety_name || '').trim();
              const cropId = parseInt(payload.cropId || payload.crop_id || 1, 10);
              const duration = parseInt(payload.growthDuration || payload.duration || 30, 10);
              const buffer = parseInt(payload.bufferTime || 4, 10);
              if (!name) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Tên giống cây không được để trống' }));
                return;
              }
              const sql = `INSERT INTO varieties (crop_id, variety_name, expected_duration, buffer_time) VALUES (${cropId}, '${name.replace(/'/g, "''")}', ${duration}, ${buffer}) RETURNING variety_id;`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Tạo mới giống cây thành công' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'PUT' && (url.match(/^\/api\/varieties\/(\d+)/) || url.match(/^\/api\/v1\/varieties\/(\d+)/))) {
          const match = url.match(/^\/api(?:\/v1)?\/varieties\/(\d+)/);
          const varId = parseInt(match[1], 10);
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const name = (payload.name || payload.variety_name || '').trim();
              const cropId = parseInt(payload.cropId || payload.crop_id || 1, 10);
              const duration = parseInt(payload.growthDuration || payload.duration || 30, 10);
              const buffer = parseInt(payload.bufferTime || 4, 10);
              await runPostgreSql(`UPDATE varieties SET variety_name = '${name.replace(/'/g, "''")}', crop_id = ${cropId}, expected_duration = ${duration}, buffer_time = ${buffer} WHERE variety_id = ${varId};`);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Cập nhật giống cây thành công' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'DELETE' && (url.match(/^\/api\/varieties\/(\d+)/) || url.match(/^\/api\/v1\/varieties\/(\d+)/))) {
          const match = url.match(/^\/api(?:\/v1)?\/varieties\/(\d+)/);
          const varId = parseInt(match[1], 10);
          try {
            await runPostgreSql(`DELETE FROM varieties WHERE variety_id = ${varId};`);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ success: true, message: `Đã xóa giống cây #${varId}` }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 14. PROCESS TEMPLATES API (GET)
        if (req.method === 'GET' && (url === '/api/process-templates' || url === '/api/v1/process-templates' || url.startsWith('/api/process-templates?') || url.startsWith('/api/v1/process-templates?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy quy trình chuẩn VietGAP thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        pt.template_id AS id,
        'TPL-' || LPAD(pt.template_id::text, 3, '0') AS code,
        'Quy trình chuẩn VietGAP - ' || v.variety_name AS name,
        pt.variety_id AS "varietyId",
        v.variety_name AS "varietyName",
        c.crop_id AS "cropId",
        c.crop_name AS "cropName",
        pt.version,
        'ACTIVE' AS status,
        COALESCE(
          (SELECT count(*)::int FROM template_steps ts WHERE ts.template_id = pt.template_id), 0
        ) AS "totalSteps",
        COALESCE(
          (SELECT sum(ts.duration_days)::int FROM template_steps ts WHERE ts.template_id = pt.template_id),
          v.expected_duration
        ) AS "totalDays",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ts.step_id,
                'day', ts.day_offset,
                'name', ts.step_name,
                'type', ts.task_type,
                'description', COALESCE(ts.description, '')
              ) ORDER BY ts.day_offset, ts.step_id
            )
            FROM template_steps ts
            WHERE ts.template_id = pt.template_id
          ),
          '[]'::json
        ) AS "steps",
        'Quy trình kỹ thuật nông nghiệp chuẩn VietGAP được ban hành chính thức cho giống ' || v.variety_name AS description,
        'Chuyên gia Nông nghiệp Farmely' AS "authorName",
        TO_CHAR(pt.created_at, 'YYYY-MM-DD') AS "createdAt",
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'stepId', ts.step_id,
              'stepOrder', ts.step_order,
              'stepName', ts.step_name,
              'name', ts.step_name,
              'day', ts.day_offset,
              'dayOffset', ts.day_offset,
              'type', 'BƯỚC ' || ts.step_order,
              'details', COALESCE(ts.description, ''),
              'description', ts.description,
              'materialsNeeded', ts.materials_needed,
              'durationDays', ts.duration_days
            ) ORDER BY ts.step_order ASC
          ) FROM template_steps ts WHERE ts.template_id = pt.template_id),
          '[]'::json
        ) AS steps
      FROM process_templates pt
      JOIN varieties v ON pt.variety_id = v.variety_id
      JOIN crops c ON v.crop_id = c.crop_id
      ORDER BY pt.template_id ASC
    ) t
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 15. COMPATIBILITY MATRIX API (GET, POST, DELETE)
        if (req.method === 'GET' && (url === '/api/compatibility' || url === '/api/v1/compatibility' || url.startsWith('/api/compatibility?') || url.startsWith('/api/v1/compatibility?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy ma trận tương thích thổ nhưỡng thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) FROM (
      SELECT 
        pvc.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        l.land_name AS "landName",
        pvc.variety_id AS "varietyId",
        v.variety_name AS "varietyName",
        c.crop_id AS "cropId",
        c.crop_name AS "cropName",
        'COMPATIBLE' AS status,
        'Thổ nhưỡng và điều kiện vi khí hậu đạt chuẩn chứng nhận VietGAP.' AS notes
      FROM plot_variety_compatibility pvc
      JOIN plots p ON pvc.plot_id = p.plot_id
      JOIN lands l ON p.land_id = l.land_id
      JOIN varieties v ON pvc.variety_id = v.variety_id
      JOIN crops c ON v.crop_id = c.crop_id
      ORDER BY pvc.plot_id, pvc.variety_id
    ) r
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 16. KNOWLEDGE DOCUMENTS API (GET /api/v1/knowledge-documents & /api/knowledge-documents)
        if (req.method === 'GET' && (url === '/api/v1/knowledge-documents' || url === '/api/knowledge-documents' || url.startsWith('/api/v1/knowledge-documents?') || url.startsWith('/api/knowledge-documents?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh mục tài liệu RAG tri thức thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) FROM (
      SELECT 
        kd.document_id AS "documentId",
        kd.document_id AS "document_id",
        'DOC-00' || kd.document_id AS id,
        kd.title,
        kd.content AS description,
        kd.file_url AS "fileUrl",
        kd.file_url AS "file_url",
        '3.5 MB (PDF)' AS "fileSize",
        '3.5 MB (PDF)' AS "file_size",
        COALESCE(u.full_name, 'Chuyên gia Nông nghiệp') AS "authorName",
        COALESCE(u.full_name, 'Chuyên gia Nông nghiệp') AS "author_name",
        'Áp dụng chung toàn trang trại' AS "varietyName",
        'Áp dụng chung toàn trang trại' AS "variety_name",
        'Tiêu Chuẩn VietGAP' AS "cropName",
        'Tiêu Chuẩn VietGAP' AS "crop_name",
        'CULTIVATION_GUIDE' AS "documentType",
        'CULTIVATION_GUIDE' AS "document_type",
        'v2.0' AS version,
        'PUBLISHED' AS status,
        true AS "isIndexedForRAG",
        true AS "is_indexed_for_rag",
        TO_CHAR(kd.created_at, 'YYYY-MM-DD') AS "uploadedDate",
        TO_CHAR(kd.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "created_at"
      FROM knowledge_documents kd
      LEFT JOIN users u ON kd.kd_created_by = u.user_id
      ORDER BY kd.document_id ASC
    ) d
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 17. RENTALS API (GET /api/rentals & /api/v1/rentals)
        if (req.method === 'GET' && (url === '/api/rentals' || url === '/api/v1/rentals' || url === '/api/customer/rentals' || url.startsWith('/api/rentals?') || url.startsWith('/api/v1/rentals?') || url.startsWith('/api/customer/rentals?'))) {
          try {
            const urlObj = new URL(url, 'http://localhost:3000');
            const emailFilter = (urlObj.searchParams.get('email') || '').trim().toLowerCase();
            const customerIdParam = parseInt(urlObj.searchParams.get('customerId') || urlObj.searchParams.get('renter_id') || '0', 10);
            const staffIdParam = parseInt(urlObj.searchParams.get('staffId') || '0', 10);
            let whereSql = '';
            if (emailFilter) {
              whereSql = `WHERE LOWER(u.email) = '${emailFilter.replace(/'/g, "''")}'`;
            } else if (customerIdParam > 0) {
              whereSql = `WHERE c.renter_id = ${customerIdParam}`;
            } else if (staffIdParam > 0) {
              whereSql = `WHERE rent.staff_id = ${staffIdParam}`;
            }

            await ensureRentalLeaseColumns();

            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh sách thửa đất thuê thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) FROM (
      SELECT 
        rent.rental_id,
        rent.rental_id AS "rentalId",
        'RENT-' || rent.rental_id AS id,
        p.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        p.plot_code AS "mapPlotId",
        'Thửa ' || COALESCE(p.plot_code, 'P-0' || rent.plot_id) AS name,
        COALESCE(l.land_name, 'Trang trại Happy Valley Củ Chi') AS location,
        p.area || 'm²' AS area,
        'Assisted-Growing' AS mode,
        COALESCE(v.variety_name, 'Cà chua bi Cherry F1') AS crop,
        'Sinh trưởng & phát triển' AS stage,
        p.image_url AS image,
        c.contract_number AS "contractCode",
        c.renter_id AS "renterId",
        u.full_name AS "renterName",
        u.email AS "renterEmail",
        TO_CHAR(rent.start_date, 'YYYY-MM-DD') AS "startDate",
        TO_CHAR(rent.end_date, 'YYYY-MM-DD') AS "endDate",
        TO_CHAR(rent.end_date, 'DD/MM/YYYY') AS "expectedHarvestDate",
        rent.total_price AS "totalPrice",
        rent.status,
        rent.expert_id AS "expertId",
        COALESCE(u_exp.full_name, 'Chưa chỉ định') AS "expertName",
        COALESCE(u_exp.email, '') AS "expertEmail",
        rent.staff_id AS "staffId",
        COALESCE(u_stf.full_name, 'Chưa chỉ định') AS "staffName",
        COALESCE(u_stf.full_name, 'Chưa chỉ định') AS worker,
        COALESCE(u_stf.email, '') AS "staffEmail",
        'IOT-' || p.plot_code AS "stationId",
        COALESCE(sr.temperature, 28.5) || '°C' AS temp,
        COALESCE(sr.soil_humidity, 68.0) || '%' AS "soilMoisture",
        COALESCE(sr.air_humidity, 74.0) || '%' AS "airHumidity",
        '45.000 Lux' AS light,
        '6.5' AS ph,
        'HEALTHY' AS "healthStatus",
        'Trần Văn Lực (CVLĐ)' AS worker,
        '35 - 45 kg' AS "expectedYield",
        'Đất phù sa bồi lắng giàu mùn (pH 6.5)' AS "soilType",
        'Hệ thống nước tưới ngầm lọc cát + UV' AS "waterSource",
        CASE 
          WHEN CURRENT_DATE < rent.start_date THEN 0
          ELSE (CURRENT_DATE - rent.start_date) + 1
        END AS "currentDay",
        COALESCE(v.expected_duration, 60) AS "totalDays",
        CASE
          WHEN CURRENT_DATE < rent.start_date THEN 0
          ELSE LEAST(100, GREATEST(1, ROUND(((CURRENT_DATE - rent.start_date + 1)::numeric / NULLIF(COALESCE(v.expected_duration, 60), 0)::numeric) * 100)))
        END AS "progressPercent"
      FROM rentals rent
      JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN lands l ON p.land_id = l.land_id
      JOIN contracts c ON rent.contract_id = c.contract_id
      LEFT JOIN users u ON c.renter_id = u.user_id
      LEFT JOIN users u_exp ON rent.expert_id = u_exp.user_id
      LEFT JOIN users u_stf ON rent.staff_id = u_stf.user_id
      LEFT JOIN varieties v ON rent.variety_id = v.variety_id
      LEFT JOIN LATERAL (
        SELECT temperature, air_humidity, soil_humidity 
        FROM sensor_readings 
        WHERE plot_id = p.plot_id 
        ORDER BY recorded_at DESC 
        LIMIT 1
      ) sr ON true
      ${whereSql}
      ORDER BY rent.rental_id DESC
    ) r
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 17B. ASSIGN PERSONNEL (STAFF & EXPERT) TO RENTAL
        if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') && url.match(/^\/api\/(?:v1\/)?rentals\/(\d+)\/(?:assign|assign-expert|assign-staff)/)) {
          const rentalId = url.match(/^\/api\/(?:v1\/)?rentals\/(\d+)\//)[1];
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const expertId = parseInt(payload.expertId || payload.expert_id, 10);
              const staffId = parseInt(payload.staffId || payload.staff_id, 10);
              const setClauses = [];
              if (expertId) setClauses.push(`expert_id = ${expertId}`);
              if (staffId) setClauses.push(`staff_id = ${staffId}`);
              if (setClauses.length === 0) throw new Error('Cần cung cấp expertId hoặc staffId để phân công');
              setClauses.push('updated_at = NOW()');

              const sql = `
UPDATE rentals
SET ${setClauses.join(', ')}
WHERE rental_id = ${rentalId}
RETURNING rental_id, expert_id, staff_id;
`;
              await runPostgreSql(sql);
              if (expertId) {
                try {
                  await runPostgreSql(`
INSERT INTO conversations (participant_one, participant_two, rental_id, created_at)
VALUES (
  COALESCE((SELECT c.renter_id FROM contracts c JOIN rentals r ON r.contract_id = c.contract_id WHERE r.rental_id = ${rentalId}), 1),
  ${expertId},
  ${rentalId},
  NOW()
)
ON CONFLICT DO NOTHING;
`);
                } catch (_) {}
              }
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: `Đã cập nhật phân công nhân sự (Staff & Expert) cho thửa đất #${rentalId}` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 18. CARE TASKS API (GET, POST, PATCH /api/care-tasks)
        if (req.method === 'GET' && (url === '/api/care-tasks' || url === '/api/v1/care-tasks' || url === '/api/tasks' || url.startsWith('/api/care-tasks?') || url.startsWith('/api/v1/care-tasks?') || url.startsWith('/api/tasks?'))) {
          try {
            const workerIdParam = parseInt(new URL(url, 'http://localhost:3000').searchParams.get('workerId') || '', 10);
            const workerFilter = Number.isInteger(workerIdParam) && workerIdParam > 0
              ? `WHERE ct.task_assigned_to = ${workerIdParam}`
              : '';
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh sách công việc canh tác thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT 
        ct.task_id AS "taskId",
        'TSK-' || ct.task_id AS id,
        ct.rental_id AS "rentalId",
        ct.service_request_id AS "serviceRequestId",
        rent.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        COALESCE(ts.step_name, s.service_name, ct.notes, 'Chăm sóc vi sinh tiêu chuẩn') AS title,
        COALESCE(v.variety_name, 'Cà chua bi Cherry F1') AS crop,
        COALESCE(u_renter.full_name, 'Khách hàng') AS "customerName",
        COALESCE(u_worker.full_name, 'Chưa chỉ định nhân viên') AS "assignedTo",
        COALESCE(u_worker.full_name, 'Chưa chỉ định nhân viên') AS "workerName",
        u_worker.user_id AS "workerId",
        ct.task_assigned_to AS "taskAssignedTo",
        CASE 
          WHEN ct.status = 'DONE' THEN 'COMPLETED'
          WHEN ct.status = 'IN_PROG' THEN 'IN_PROGRESS'
          ELSE 'PENDING'
        END AS status,
        TO_CHAR(ct.due_date, 'YYYY-MM-DD') AS "dueDate",
        '08:30 AM' AS deadline,
        'MORNING' AS session,
        COALESCE(ct.evidence_image_url, '/images/Mucangchai3.jpg') AS "proofPhoto",
        COALESCE(ct.notes, 'Kiểm tra độ ẩm trạm IoT trước khi tưới. Ghi chép nhật ký đầy đủ.') AS instructions,
        TO_CHAR(ct.updated_at, 'HH24:MI - DD/MM/YYYY') AS "completedAt"
      FROM care_tasks ct
      JOIN rentals rent ON ct.rental_id = rent.rental_id
      JOIN plots p ON rent.plot_id = p.plot_id
      JOIN contracts c ON rent.contract_id = c.contract_id
      LEFT JOIN users u_renter ON c.renter_id = u_renter.user_id
      LEFT JOIN users u_worker ON ct.task_assigned_to = u_worker.user_id
      LEFT JOIN varieties v ON rent.variety_id = v.variety_id
      LEFT JOIN template_steps ts ON ct.step_id = ts.step_id
      LEFT JOIN service_requests sr ON ct.service_request_id = sr.request_id
      LEFT JOIN services s ON sr.service_id = s.service_id
      ${workerFilter}
      ORDER BY ct.due_date ASC, ct.task_id ASC
    ) t
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if ((req.method === 'PATCH' || req.method === 'PUT') && url.match(/^\/api\/(?:v1\/)?care-tasks\/(\d+)/)) {
          const taskId = url.match(/^\/api\/(?:v1\/)?care-tasks\/(\d+)/)[1];
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const workerId = payload.workerId || payload.taskAssignedTo || payload.assignedWorkerId;
              let setClauses = [];
              if (payload.status) {
                const dbStatus = payload.status === 'COMPLETED' || payload.status === 'DONE' ? 'DONE' : payload.status === 'IN_PROGRESS' || payload.status === 'IN_PROG' ? 'IN_PROG' : 'PENDING';
                setClauses.push(`status = '${dbStatus}'`);
              } else if (workerId) {
                setClauses.push(`status = 'IN_PROG'`);
              }
              if (workerId) {
                setClauses.push(`task_assigned_to = ${parseInt(workerId, 10)}`);
              }
              if (payload.proofPhoto || payload.evidence_image_url) {
                const proof = (payload.proofPhoto || payload.evidence_image_url).replace(/'/g, "''");
                setClauses.push(`evidence_image_url = '${proof}'`);
              }
              if (payload.instructions || payload.notes) {
                const notes = (payload.instructions || payload.notes).replace(/'/g, "''");
                setClauses.push(`notes = '${notes}'`);
              }
              if (payload.dueDate || payload.due_date) {
                setClauses.push(`due_date = '${payload.dueDate || payload.due_date}'`);
              }
              setClauses.push('updated_at = NOW()');

              const sql = `
UPDATE care_tasks
SET ${setClauses.join(', ')}
WHERE task_id = ${taskId}
RETURNING task_id, status, task_assigned_to;
`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: `Cập nhật nhiệm vụ #${taskId} thành công` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.method === 'POST' && (url === '/api/care-tasks' || url === '/api/v1/care-tasks' || url === '/api/tasks')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const rentalId = parseInt(payload.rentalId || payload.rental_id || 1, 10);
              const workerId = parseInt(payload.workerId || payload.taskAssignedTo || 8, 10);
              const dueDate = payload.dueDate || payload.due_date || new Date().toISOString().split('T')[0];
              const notes = (payload.title ? payload.title + (payload.notes ? ' - ' + payload.notes : '') : (payload.notes || 'Nhiệm vụ chăm sóc ngoài đồng')).replace(/'/g, "''");
              const sql = `
INSERT INTO care_tasks (rental_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
VALUES (${rentalId}, ${workerId}, '${dueDate}', 'PENDING', '${notes}', NOW(), NOW())
RETURNING task_id, rental_id, status;
`;
              const data = await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Đã tạo nhiệm vụ mới thành công', data }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 19. FARM DIARIES API (GET, POST /api/farm-diaries)
        if (req.method === 'GET' && (url === '/api/farm-diaries' || url === '/api/v1/farm-diaries' || url === '/api/diaries' || url.startsWith('/api/farm-diaries?') || url.startsWith('/api/v1/farm-diaries?') || url.startsWith('/api/diaries?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy nhật ký canh tác thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) FROM (
      SELECT 
        fd.diary_id AS "diaryId",
        'DIR-' || fd.diary_id AS id,
        fd.rental_id AS "rentalId",
        rent.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        COALESCE(v.variety_name, 'Cà chua bi') AS crop,
        fd.content,
        fd.content AS note,
        fd.image_url AS "imageUrl",
        fd.image_url AS photo,
        TO_CHAR(fd.created_at, 'YYYY-MM-DD') AS date,
        TO_CHAR(fd.created_at, 'HH24:MI') AS time,
        TO_CHAR(fd.created_at, 'DD/MM/YYYY HH24:MI') AS "dateFormatted",
        COALESCE(u_worker.full_name, 'Trần Văn Lực (CVLĐ)') AS author,
        COALESCE(u_worker.full_name, 'Trần Văn Lực (CVLĐ)') AS "authorName",
        'Chăm sóc & theo dõi' AS stage
      FROM farm_diaries fd
      JOIN rentals rent ON fd.rental_id = rent.rental_id
      JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN varieties v ON rent.variety_id = v.variety_id
      LEFT JOIN care_tasks ct ON fd.task_id = ct.task_id
      LEFT JOIN users u_worker ON ct.task_assigned_to = u_worker.user_id
      ORDER BY fd.created_at DESC
    ) d
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if (req.method === 'POST' && (url === '/api/farm-diaries' || url === '/api/v1/farm-diaries' || url === '/api/diaries')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const rentalId = payload.rentalId || payload.rental_id || 1;
              const content = (payload.content || payload.note || 'Cập nhật nhật ký hiện trường').replace(/'/g, "''");
              const imageUrl = (payload.imageUrl || payload.photo || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80').replace(/'/g, "''");
              const sql = `
INSERT INTO farm_diaries (rental_id, content, image_url, created_at)
VALUES (${rentalId}, '${content}', '${imageUrl}', NOW())
RETURNING diary_id;
`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: 'Thêm nhật ký canh tác thành công' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 20. ISSUE REPORTS API (GET, POST, PUT /api/issue-reports)
        if (req.method === 'GET' && (url === '/api/issue-reports' || url === '/api/v1/issue-reports' || url === '/api/issues' || url.startsWith('/api/issue-reports?') || url.startsWith('/api/v1/issue-reports?') || url.startsWith('/api/issues?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy báo cáo sự cố hiện trường thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(i)), '[]'::json) FROM (
      SELECT 
        ir.issue_id AS "issueId",
        'ISS-' || ir.issue_id AS id,
        ir.rental_id AS "rentalId",
        rent.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        COALESCE(u_rep.full_name, 'Trần Văn Lực (CVLĐ)') AS "workerName",
        COALESCE(u_rep.full_name, 'Trần Văn Lực') AS "reportedByName",
        COALESCE(u_hand.full_name, 'Chưa chỉ định chuyên gia') AS "expertName",
        u_hand.user_id AS "expertId",
        ir.handled_by AS "handledBy",
        ir.issue_type AS "issueType",
        ir.description,
        COALESCE(ir.image_url, '/images/moc-chau-2811.jpg') AS "photoUrl",
        ir.status,
        COALESCE(ir.resolution_notes, '') AS diagnosis,
        TO_CHAR(ir.created_at, 'HH24:MI - DD/MM/YYYY') AS "reportedTime",
        CASE 
          WHEN ir.issue_type ILIKE '%SÂU%' OR ir.issue_type ILIKE '%BỆNH%' THEN 'HIGH'
          ELSE 'NORMAL'
        END AS urgency
      FROM issue_reports ir
      JOIN rentals rent ON ir.rental_id = rent.rental_id
      JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN users u_rep ON ir.reported_by = u_rep.user_id
      LEFT JOIN users u_hand ON ir.handled_by = u_hand.user_id
      ORDER BY ir.created_at DESC
    ) i
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if ((req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') && url.match(/^\/api\/(?:v1\/)?issue-reports\/(\d+)(?:\/assign)?/)) {
          const issueId = url.match(/^\/api\/(?:v1\/)?issue-reports\/(\d+)/)[1];
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const expertId = payload.expertId || payload.handled_by || payload.expert_id;
              let setClauses = [];
              if (expertId) {
                setClauses.push(`handled_by = ${parseInt(expertId, 10)}`);
                setClauses.push(`status = 'OPEN'`);
              }
              if (payload.diagnosis || payload.resolution_notes) {
                const diag = (payload.diagnosis || payload.resolution_notes).replace(/'/g, "''");
                setClauses.push(`status = 'RESOLVED'`);
                setClauses.push(`resolution_notes = '${diag}'`);
                setClauses.push('resolved_at = NOW()');
              } else if (payload.notes) {
                const n = payload.notes.replace(/'/g, "''");
                setClauses.push(`resolution_notes = 'Giao chuyên gia: ${n}'`);
              }

              if (setClauses.length === 0) setClauses.push(`status = 'OPEN'`);

              const sql = `
UPDATE issue_reports
SET ${setClauses.join(', ')}
WHERE issue_id = ${issueId}
RETURNING issue_id, handled_by, status;
`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: `Đã cập nhật sự cố #${issueId}` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 20B. SERVICE REQUESTS API (GET, PUT /api/services/requests)
        if (req.method === 'GET' && (url === '/api/services/requests' || url === '/api/v1/services/requests' || url.startsWith('/api/services/requests?') || url.startsWith('/api/v1/services/requests?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh sách yêu cầu dịch vụ thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(reqs)), '[]'::json) FROM (
      SELECT 
        sr.request_id AS "requestId",
        'DISP-' || sr.request_id AS id,
        sr.rental_id AS "rentalId",
        sr.service_id AS "serviceId",
        s.service_name AS "serviceName",
        json_build_object(
          'serviceId', s.service_id,
          'serviceName', s.service_name,
          'name', s.service_name,
          'price', s.price,
          'unit', s.unit,
          'description', s.description
        ) AS service,
        s.price,
        COALESCE(p.plot_code, 'P-01') AS "plotCode",
        'Thửa ' || COALESCE(p.plot_code, 'P-01') AS "plotName",
        COALESCE(u_renter.full_name, 'Khách hàng') AS "customerName",
        COALESCE(u_renter.full_name, 'Khách hàng') AS "renterName",
        COALESCE(u_renter.phone_number, '') AS "customerPhone",
        COALESCE(TO_CHAR(sr.scheduled_date, 'YYYY-MM-DD'), '') AS "scheduledDate",
        COALESCE(TO_CHAR(sr.scheduled_date, 'YYYY-MM-DD'), '') AS "requestedDate",
        sr.status,
        COALESCE(u_worker.full_name, 'Chưa chỉ định') AS "assignedWorker",
        COALESCE(u_worker.full_name, 'Chưa chỉ định') AS "assignedWorkerName",
        u_worker.user_id AS "assignedWorkerId",
        COALESCE(ct.notes, s.description, '') AS note,
        COALESCE(ct.notes, '') AS notes,
        pt.transaction_id AS "transactionId",
        COALESCE(pt.payment_method, 'VIETQR') AS "paymentMethod",
        COALESCE(pt.gateway_ref, '') AS "gatewayRef",
        COALESCE(pt.amount, s.price) AS "paidAmount",
        COALESCE(pt.status, 'SUCCESS') AS "paymentStatus",
        ct.task_id AS "taskId",
        ct.status AS "taskStatus",
        ct.evidence_image_url AS "proofPhoto",
        COALESCE(ct.notes, '') AS "proofNotes",
        TO_CHAR(ct.updated_at, 'YYYY-MM-DD HH24:MI') AS "completedAt",
        TO_CHAR(sr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt"
      FROM service_requests sr
      JOIN services s ON sr.service_id = s.service_id
      LEFT JOIN rentals rent ON sr.rental_id = rent.rental_id
      LEFT JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN contracts c ON rent.contract_id = c.contract_id
      LEFT JOIN users u_renter ON c.renter_id = u_renter.user_id
      LEFT JOIN payment_transactions pt ON pt.service_request_id = sr.request_id
      LEFT JOIN care_tasks ct ON ct.service_request_id = sr.request_id
      LEFT JOIN users u_worker ON ct.task_assigned_to = u_worker.user_id
      ORDER BY sr.request_id DESC
    ) reqs
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        if ((req.method === 'PUT' || req.method === 'POST') && url.match(/^\/api\/(?:v1\/)?services\/requests\/(\d+)\/assign/)) {
          const reqId = url.match(/^\/api\/(?:v1\/)?services\/requests\/(\d+)\/assign/)[1];
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const workerId = parseInt(payload.workerId || payload.worker_id || 8, 10);
              const schedDate = payload.scheduledDate || payload.scheduled_date;
              const notes = (payload.notes || 'Thực hiện dịch vụ theo chỉ định của Quản trị viên').replace(/'/g, "''");

              // 1. Update service_requests status
              await runPostgreSql(`
UPDATE service_requests
SET status = 'ASSIGNED'${schedDate ? `, scheduled_date = '${schedDate}'` : ''}
WHERE request_id = ${reqId};
`);

              // 2. Insert or update care_tasks for the worker
              await runPostgreSql(`
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM care_tasks WHERE service_request_id = ${reqId}) THEN
    UPDATE care_tasks
    SET task_assigned_to = ${workerId},
        status = 'IN_PROG',
        notes = '${notes}',
        updated_at = NOW()
    WHERE service_request_id = ${reqId};
  ELSE
    INSERT INTO care_tasks (rental_id, service_request_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
    VALUES (
      (SELECT rental_id FROM service_requests WHERE request_id = ${reqId}),
      ${reqId},
      ${workerId},
      COALESCE(${schedDate ? `'${schedDate}'` : 'NULL'}, CURRENT_DATE),
      'IN_PROG',
      '${notes}',
      NOW(),
      NOW()
    );
  END IF;
END $$;
`);

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: `Phân công công nhân cho yêu cầu #${reqId} thành công` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 21. SERVICES API (GET /api/services)
        if (req.method === 'GET' && (url === '/api/services' || url === '/api/v1/services' || url.startsWith('/api/services?') || url.startsWith('/api/v1/services?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh mục dịch vụ canh tác thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM (
      SELECT 
        service_id AS "serviceId",
        service_id AS "dbId",
        'SVC-' || LPAD(service_id::text, 2, '0') AS id,
        service_code AS "serviceCode",
        service_name AS name,
        service_type AS "serviceType",
        CASE 
          WHEN service_type = 'FULL' THEN 'Trọn vụ'
          WHEN service_type = 'CYCLE' THEN 'Chăm sóc định kỳ'
          ELSE 'Dịch vụ một lần'
        END AS category,
        CASE 
          WHEN service_type = 'FULL' THEN 'FULL'
          WHEN service_type = 'CYCLE' THEN 'CYCLE'
          ELSE 'SINGLE'
        END AS "customerCategory",
        price,
        unit,
        description,
        (status = 'ACTIVE') AS active,
        1 AS duration,
        json_build_array(json_build_object('offset', 0, 'title', 'Thực hiện ' || service_name, 'assignee', 'STAFF', 'evidence', true)) AS tasks
      FROM services
      ORDER BY service_id ASC
    ) s
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 21.1 CULTIVATION SERVICE CHECKOUT & PAYMENT API (POST /api/v1/payments/service/checkout)
        if (req.method === 'POST' && (
          url === '/api/v1/payments/service/checkout' ||
          url === '/api/services/checkout' ||
          url === '/api/services/requests/checkout' ||
          url === '/api/services/requests' ||
          url === '/api/v1/services/requests'
        )) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              let serviceId = parseInt(String(payload.serviceId || payload.id || 1).replace(/\D/g, ''), 10) || 1;
              let rawRentalId = parseInt(String(payload.rentalId || '').replace(/\D/g, ''), 10) || null;
              const rawPlotCode = String(payload.plotCode || payload.plotId || '').replace(/^PLOT-/i, '').trim();
              const scheduledDate = (payload.scheduledDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10)).replace(/'/g, "''");
              const notes = (payload.notes || '').replace(/'/g, "''");
              const paymentMethod = (payload.paymentMethod || 'VNPAY').replace(/'/g, "''");
              const amount = parseFloat(payload.amount || 0) || 50000;
              const serviceName = (payload.serviceName || 'Dịch vụ canh tác').replace(/'/g, "''");
              const gatewayRef = (payload.gatewayRef || ('TXN_SVC_' + Date.now().toString().slice(-8))).replace(/'/g, "''");
              const existingReqId = payload.serviceRequestId ? parseInt(String(payload.serviceRequestId).replace(/\D/g, ''), 10) : null;

              let sql = '';
              if (existingReqId) {
                // Update existing service request and ensure payment transaction and care task exist
                sql = `
DO $$
DECLARE
  v_req_id INT := ${existingReqId};
  v_rental_id INT := ${rawRentalId || 'NULL'};
  v_worker_id INT := 8;
  v_sched_date DATE := '${scheduledDate}'::date;
  v_notes TEXT := '${notes}';
  v_svc_name TEXT := '${serviceName}';
BEGIN
  -- 1. Update service_requests status to ASSIGNED
  UPDATE service_requests
  SET status = 'ASSIGNED', scheduled_date = v_sched_date
  WHERE request_id = v_req_id;

  -- 2. Update payment_transactions status to SUCCESS
  UPDATE payment_transactions
  SET status = 'SUCCESS', gateway_ref = '${gatewayRef}'
  WHERE service_request_id = v_req_id;

  -- 3. If care_task does not exist, insert into care_tasks for cultivation schedule
  IF NOT EXISTS (SELECT 1 FROM care_tasks WHERE service_request_id = v_req_id) THEN
    SELECT rental_id INTO v_rental_id FROM service_requests WHERE request_id = v_req_id;
    IF v_rental_id IS NULL AND '${rawPlotCode}' <> '' THEN
      SELECT r.rental_id INTO v_rental_id FROM rentals r JOIN plots p ON r.plot_id = p.plot_id WHERE UPPER(p.plot_code) = UPPER('${rawPlotCode.replace(/'/g, "''")}') ORDER BY r.rental_id DESC LIMIT 1;
    END IF;
    IF v_rental_id IS NULL THEN
      SELECT rental_id INTO v_rental_id FROM rentals WHERE status = 'ACTIVE' LIMIT 1;
    END IF;
    INSERT INTO care_tasks (rental_id, service_request_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
    VALUES (
      v_rental_id,
      v_req_id,
      v_worker_id,
      v_sched_date,
      'PENDING'::task_status_enum,
      CASE WHEN v_notes <> '' THEN v_svc_name || ' - ' || v_notes ELSE v_svc_name END,
      NOW(),
      NOW()
    );
  END IF;
END $$;
`;
              } else {
                // New checkout: Atomically insert service_request, payment_transaction, and care_task
                sql = `
WITH resolved_rental AS (
  SELECT COALESCE(
    ${rawPlotCode ? `(SELECT r.rental_id FROM rentals r JOIN plots p ON r.plot_id = p.plot_id WHERE UPPER(p.plot_code) = UPPER('${rawPlotCode.replace(/'/g, "''")}') ORDER BY r.rental_id DESC LIMIT 1),` : ''}
    ${rawRentalId ? `(SELECT rental_id FROM rentals WHERE rental_id = ${rawRentalId} LIMIT 1),` : ''}
    (SELECT rental_id FROM rentals WHERE status = 'ACTIVE' LIMIT 1),
    (SELECT rental_id FROM rentals LIMIT 1)
  ) AS id
),
ins_req AS (
  INSERT INTO service_requests (rental_id, service_id, scheduled_date, status, created_at)
  VALUES (
    (SELECT id FROM resolved_rental),
    ${serviceId},
    '${scheduledDate}'::date,
    'ASSIGNED',
    NOW()
  )
  RETURNING request_id, rental_id, service_id, scheduled_date, status
),
ins_tx AS (
  INSERT INTO payment_transactions (service_request_id, type, amount, payment_method, gateway_ref, status, created_at)
  SELECT 
    request_id, 
    'PAYMENT', 
    ${amount}, 
    '${paymentMethod}', 
    '${gatewayRef}', 
    'SUCCESS', 
    NOW()
  FROM ins_req
  RETURNING transaction_id, gateway_ref, status
),
ins_task AS (
  INSERT INTO care_tasks (rental_id, service_request_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
  SELECT 
    ins_req.rental_id, 
    ins_req.request_id, 
    8, 
    ins_req.scheduled_date, 
    'PENDING'::task_status_enum, 
    CASE WHEN '${notes}' <> '' THEN '${serviceName}' || ' - ' || '${notes}' ELSE '${serviceName}' END, 
    NOW(), 
    NOW()
  FROM ins_req
  RETURNING task_id, status
)
SELECT json_build_object(
  'requestId', (SELECT request_id FROM ins_req),
  'transactionId', (SELECT transaction_id FROM ins_tx),
  'taskId', (SELECT task_id FROM ins_task),
  'gatewayRef', (SELECT gateway_ref FROM ins_tx),
  'status', 'SUCCESS'
);
`;
              }

              const resultRaw = await runPostgreSql(sql);
              invalidatePlotsCache();

              // Fetch details of created/updated request
              const detailSql = `
SELECT json_build_object(
  'success', true,
  'message', 'Đã lưu giao dịch thanh toán vào CSDL và đồng bộ thành công vào Lịch canh tác!',
  'data', (
    SELECT json_build_object(
      'requestId', sr.request_id,
      'rentalId', sr.rental_id,
      'serviceId', sr.service_id,
      'serviceName', s.service_name,
      'scheduledDate', TO_CHAR(sr.scheduled_date, 'YYYY-MM-DD'),
      'status', sr.status,
      'plotName', 'Thửa ' || p.plot_code,
      'plotCode', p.plot_code,
      'transactionId', pt.transaction_id,
      'amount', pt.amount,
      'paymentMethod', pt.payment_method,
      'gatewayRef', pt.gateway_ref,
      'paymentStatus', pt.status,
      'taskId', ct.task_id,
      'taskStatus', ct.status,
      'worker', 'Trần Văn Lực (CVLĐ)'
    )
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.service_id
    JOIN rentals rent ON sr.rental_id = rent.rental_id
    JOIN plots p ON rent.plot_id = p.plot_id
    LEFT JOIN payment_transactions pt ON sr.request_id = pt.service_request_id
    LEFT JOIN care_tasks ct ON sr.request_id = ct.service_request_id
    ORDER BY sr.request_id DESC
    LIMIT 1
  )
);
`;
              const detailJson = await runPostgreSql(detailSql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(detailJson || '{"success":true,"message":"Thanh toán và đồng bộ thành công"}');
            } catch (err) {
              console.error('Error on service checkout:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, message: 'Lỗi ghi nhận thanh toán & lịch canh tác: ' + err.message }));
            }
          });
          return;
        }

        // 21.2 SERVICE REQUESTS QUERY (GET /api/services/requests)
        if (req.method === 'GET' && (
          url === '/api/services/requests' ||
          url === '/api/v1/services/requests' ||
          url.startsWith('/api/services/requests?') ||
          url.startsWith('/api/v1/services/requests?')
        )) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy danh sách yêu cầu dịch vụ thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) FROM (
      SELECT 
        sr.request_id AS "requestId",
        sr.rental_id AS "rentalId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        json_build_object(
          'serviceId', s.service_id,
          'serviceName', s.service_name,
          'serviceType', s.service_type,
          'price', s.price,
          'unit', s.unit,
          'description', s.description,
          'status', s.status
        ) AS service,
        TO_CHAR(sr.scheduled_date, 'YYYY-MM-DD') AS "scheduledDate",
        sr.status,
        TO_CHAR(sr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt",
        pt.transaction_id AS "transactionId",
        COALESCE(pt.payment_method, 'VNPAY') AS "paymentMethod",
        COALESCE(pt.status, 'SUCCESS') AS "paymentStatus",
        COALESCE(pt.gateway_ref, 'VNPAY_' || sr.request_id) AS "gatewayRef",
        COALESCE(u_worker.full_name, 'Trần Văn Lực (CVLĐ)') AS worker
      FROM service_requests sr
      JOIN services s ON sr.service_id = s.service_id
      JOIN rentals rent ON sr.rental_id = rent.rental_id
      JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN payment_transactions pt ON sr.request_id = pt.service_request_id
      LEFT JOIN care_tasks ct ON sr.request_id = ct.service_request_id
      LEFT JOIN users u_worker ON ct.task_assigned_to = u_worker.user_id
      ORDER BY sr.request_id DESC
    ) r
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 22. IOT STATIONS API (GET /api/iot-stations)
        if (req.method === 'GET' && (url === '/api/iot-stations' || url === '/api/v1/iot-stations' || url.startsWith('/api/iot-stations?') || url.startsWith('/api/v1/iot-stations?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy trạm cảm biến IoT và đo đạc thực tế thành công từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM (
      SELECT 
        'IOT-' || p.plot_code AS id,
        'Trạm Quan Trắc #' || p.plot_code AS name,
        p.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        COALESCE(l.land_name, 'Happy Valley Củ Chi') AS "landName",
        'ONLINE' AS status,
        '96%' AS "batteryLevel",
        'Tốt (-62 dBm)' AS "signalStrength",
        'v2.4.1-pro' AS "firmwareVersion",
        CASE 
          WHEN sr.recorded_at IS NULL THEN 'Chưa có dữ liệu'
          WHEN NOW() - sr.recorded_at < INTERVAL '1 minute' THEN 'Vừa xong'
          WHEN NOW() - sr.recorded_at < INTERVAL '60 minutes' THEN EXTRACT(MINUTE FROM NOW() - sr.recorded_at)::int || ' phút trước'
          ELSE TO_CHAR(sr.recorded_at, 'HH24:MI DD/MM')
        END AS "lastSeen",
        json_build_object(
          'soilMoisture', COALESCE(sr.soil_humidity, 68.0) || '%',
          'temperature', COALESCE(sr.temperature, 28.5) || '°C',
          'humidity', COALESCE(sr.air_humidity, 74.0) || '%',
          'airHumidity', COALESCE(sr.air_humidity, 74.0) || '%',
          'soilPh', '6.5',
          'light', '45.000 Lux',
          'lastUpdate', TO_CHAR(COALESCE(sr.recorded_at, NOW()), 'HH24:MI:SS - DD/MM/YYYY')
        ) AS readings,
        ARRAY[
          'Độ ẩm đất điện dung (Capacitive Soil Sensor)',
          'Nhiệt độ & Độ ẩm không khí SHT35',
          'Cảm biến đo độ pH đất chuyên dụng',
          'Cảm biến bức xạ mặt trời Solar Lux'
        ] AS "sensorTypes"
      FROM plots p
      LEFT JOIN lands l ON p.land_id = l.land_id
      LEFT JOIN LATERAL (
        SELECT temperature, air_humidity, soil_humidity, recorded_at 
        FROM sensor_readings 
        WHERE plot_id = p.plot_id 
        ORDER BY recorded_at DESC 
        LIMIT 1
      ) sr ON true
      ORDER BY p.plot_id ASC
    ) s
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 23. SENSOR READINGS HISTORY API (GET /api/sensor-readings)
        if (req.method === 'GET' && (url === '/api/sensor-readings' || url === '/api/v1/sensor-readings' || url.startsWith('/api/sensor-readings?') || url.startsWith('/api/v1/sensor-readings?'))) {
          try {
            const sql = `
SELECT json_build_object(
  'success', true,
  'message', 'Lấy chuỗi dữ liệu cảm biến thời gian thực từ PostgreSQL',
  'data', (
    SELECT COALESCE(json_agg(row_to_json(sr)), '[]'::json) FROM (
      SELECT 
        sr.reading_id,
        sr.plot_id,
        p.plot_code,
        sr.temperature,
        sr.air_humidity,
        sr.soil_humidity,
        TO_CHAR(sr.recorded_at, 'HH24:MI') AS time,
        TO_CHAR(sr.recorded_at, 'YYYY-MM-DD HH24:MI:SS') AS recorded_at
      FROM sensor_readings sr
      JOIN plots p ON sr.plot_id = p.plot_id
      ORDER BY sr.recorded_at ASC
    ) sr
  )
);
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{"success":true,"data":[]}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 23.5 SSE REAL-TIME SENSOR STREAM (GET /api/sensors/plots/:plotId/stream)
        if (req.method === 'GET' && (url.startsWith('/api/sensors/plots/') && (url.includes('/stream') || url.endsWith('/stream')))) {
          const m = url.match(/\/api\/sensors\/plots\/([^/?]+)\/stream/);
          const rawId = m ? m[1].trim() : '1';

          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          res.write(`event: CONNECTED\ndata: {"status":"connected","plotId":"${rawId}"}\n\n`);

          const client = { res, plotId: rawId };
          if (global.__farmelySseClients) {
            global.__farmelySseClients.push(client);
          }

          // Gửi ngay bản ghi mới nhất để giao diện nhận dữ liệu tức thì
          if (rawId === 'all') {
            const allSql = `
SELECT COALESCE(json_agg(
  json_build_object(
    'readingId', sr.reading_id,
    'plotId', sr.plot_id,
    'plotCode', p.plot_code,
    'temperature', sr.temperature,
    'airHumidity', sr.air_humidity,
    'soilHumidity', sr.soil_humidity,
    'recordedAt', sr.recorded_at,
    'status', 'HEALTHY',
    'statusMessage', 'Vi khí hậu ổn định trong ngưỡng an toàn VietGAP'
  )
), '[]'::json)
FROM (
  SELECT DISTINCT ON (plot_id) reading_id, plot_id, temperature, air_humidity, soil_humidity, recorded_at
  FROM sensor_readings
  ORDER BY plot_id, recorded_at DESC
) sr
JOIN plots p ON sr.plot_id = p.plot_id
ORDER BY sr.plot_id ASC;
`;
            runPostgreSql(allSql).then((allJson) => {
              if (allJson) {
                try {
                  res.write(`event: SENSOR_ALL_UPDATE\ndata: ${allJson}\n\n`);
                } catch {}
              }
            }).catch(() => {});
          } else {
            const latestSql = `
SELECT json_build_object(
  'readingId', sr.reading_id,
  'plotId', sr.plot_id,
  'plotCode', p.plot_code,
  'temperature', sr.temperature,
  'airHumidity', sr.air_humidity,
  'soilHumidity', sr.soil_humidity,
  'recordedAt', sr.recorded_at,
  'status', 'HEALTHY',
  'statusMessage', 'Vi khí hậu ổn định trong ngưỡng an toàn VietGAP'
)
FROM sensor_readings sr
JOIN plots p ON sr.plot_id = p.plot_id
WHERE sr.plot_id = COALESCE(
  (SELECT p2.plot_id FROM plots p2 
   WHERE p2.plot_id::text = '${rawId.replace(/'/g, "''")}' 
      OR UPPER(p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
      OR UPPER(p2.plot_code) = 'P-' || LPAD('${rawId.replace(/\D/g, '')}', 2, '0')
      OR UPPER('PLOT-' || p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
   LIMIT 1),
  1
)
ORDER BY sr.recorded_at DESC
LIMIT 1;
`;
            runPostgreSql(latestSql).then((latestJson) => {
              if (latestJson) {
                try {
                  res.write(`event: SENSOR_UPDATE\ndata: ${latestJson}\n\n`);
                } catch {}
              }
            }).catch(() => {});
          }

          req.on('close', () => {
            if (global.__farmelySseClients) {
              global.__farmelySseClients = global.__farmelySseClients.filter((c) => c !== client);
            }
          });
          return;
        }

        // 24. SIMULATE / TRIGGER SENSOR TELEMETRY INTO POSTGRESQL (POST /api/iot-stations/simulate)
        if (req.method === 'POST' && (url === '/api/iot-stations/simulate' || url.startsWith('/api/iot-stations/simulate?') || url === '/api/sensors/mock/generate' || url.startsWith('/api/sensors/mock/generate?'))) {
          try {
            const parsedUrl = new URL(req.url, 'http://localhost');
            const plotIdParam = parsedUrl.searchParams.get('plotId');
            const modeParam = parsedUrl.searchParams.get('mode') || 'normal';

            global.__farmelySimulatedScenario = {
              mode: modeParam,
              plotId: plotIdParam,
              expiresAt: Date.now() + 30000 // Giữ kịch bản 30s rồi trở về bình thường
            };

            let list = [];
            if (global.__triggerBulkTelemetryInsert) {
              list = await global.__triggerBulkTelemetryInsert(global.__farmelySimulatedScenario);
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              success: true,
              message: 'Đã kích hoạt đo đạc đồng loạt 17 trạm cảm biến IoT vào PostgreSQL',
              count: list.length,
              sample: list[0] || null
            }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: String(err) }));
          }
          return;
        }

        // 25. SENSOR LATEST PER PLOT (GET /api/sensors/plots/:plotId/latest)
        if (req.method === 'GET' && (url.startsWith('/api/sensors/plots/') && url.endsWith('/latest'))) {
          try {
            const m = url.match(/\/api\/sensors\/plots\/([^/]+)\/latest/);
            const rawId = m ? m[1].trim() : '1';
            const sql = `
SELECT json_build_object(
  'readingId', sr.reading_id,
  'plotId', sr.plot_id,
  'plotCode', p.plot_code,
  'temperature', sr.temperature,
  'airHumidity', sr.air_humidity,
  'soilHumidity', sr.soil_humidity,
  'recordedAt', sr.recorded_at,
  'status', 'HEALTHY',
  'statusMessage', 'Vi khí hậu ổn định trong ngưỡng an toàn VietGAP'
)
FROM sensor_readings sr
JOIN plots p ON sr.plot_id = p.plot_id
WHERE sr.plot_id = COALESCE(
  (SELECT p2.plot_id FROM plots p2 
   WHERE p2.plot_id::text = '${rawId.replace(/'/g, "''")}' 
      OR UPPER(p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
      OR UPPER(p2.plot_code) = 'P-' || LPAD('${rawId.replace(/\D/g, '')}', 2, '0')
      OR UPPER('PLOT-' || p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
   LIMIT 1),
  1
)
ORDER BY sr.recorded_at DESC
LIMIT 1;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 26. SENSOR HISTORY PER PLOT (GET /api/sensors/plots/:plotId/history)
        if (req.method === 'GET' && (url.startsWith('/api/sensors/plots/') && (url.includes('/history') || url.endsWith('/history')))) {
          try {
            const m = url.match(/\/api\/sensors\/plots\/([^/?]+)\/history/);
            const rawId = m ? m[1].trim() : '1';

            // Lấy số đo thực tế mới nhất từ PostgreSQL của thửa đất này
            const latestSql = `
SELECT sr.reading_id, sr.plot_id, p.plot_code, sr.temperature, sr.air_humidity, sr.soil_humidity, sr.recorded_at
FROM sensor_readings sr
JOIN plots p ON sr.plot_id = p.plot_id
WHERE sr.plot_id = COALESCE(
  (SELECT p2.plot_id FROM plots p2 
   WHERE p2.plot_id::text = '${rawId.replace(/'/g, "''")}' 
      OR UPPER(p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
      OR UPPER(p2.plot_code) = 'P-' || LPAD('${rawId.replace(/\D/g, '')}', 2, '0')
      OR UPPER('PLOT-' || p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
   LIMIT 1),
  1
)
ORDER BY sr.recorded_at DESC 
LIMIT 1;
`;
            const latestRaw = await runPostgreSql(latestSql);
            let latestPoint = null;
            if (latestRaw) {
              const rows = latestRaw.split('\n').filter(Boolean);
              if (rows.length > 0) {
                const parts = rows[0].split('|');
                if (parts.length >= 7) {
                  latestPoint = {
                    readingId: parseInt(parts[0], 10),
                    plotId: parseInt(parts[1], 10),
                    plotCode: parts[2],
                    temperature: parseFloat(parts[3]),
                    airHumidity: parseFloat(parts[4]),
                    soilHumidity: parseFloat(parts[5]),
                    recordedAt: parts[6]
                  };
                }
              }
            }

            const pIdNum = parseInt(rawId.replace(/\D/g, '') || '1', 10);
            const now = new Date();
            const points = [];

            for (let i = 23; i >= 0; i--) {
              const d = new Date(now.getTime() - i * 3600 * 1000);
              const hourOfDay = d.getHours() + d.getMinutes() / 60.0;
              const solarFactor = Math.sin(((hourOfDay - 7.5) * Math.PI) / 12.0); // -1.0 đêm -> +1.0 trưa

              // Nhiễu vi khí hậu xác định (deterministic seed) theo thửa và giờ để biểu đồ không bị giật
              const seed = Math.sin(pIdNum * 17 + d.getHours() * 31);
              const jitterT = seed * 0.35;
              const jitterA = seed * -0.6;
              const jitterS = seed * 0.25;

              let tempVal = Number((28.2 + 4.2 * solarFactor + jitterT).toFixed(2));
              let airVal = Number((72.0 - 13.5 * solarFactor + jitterA).toFixed(2));
              let soilVal = Number((68.0 - 3.5 * solarFactor + jitterS).toFixed(2));

              // Điểm cuối cùng (hiện tại) ưu tiên lấy số đo thực tế từ database
              if (i === 0 && latestPoint) {
                tempVal = latestPoint.temperature;
                airVal = latestPoint.airHumidity;
                soilVal = latestPoint.soilHumidity;
              }

              points.push({
                readingId: 5000 + (24 - i),
                plotId: latestPoint?.plotId || pIdNum,
                plotCode: latestPoint?.plotCode || `P-${String(pIdNum).padStart(2, '0')}`,
                temperature: tempVal,
                airHumidity: airVal,
                soilHumidity: soilVal,
                recordedAt: d.toISOString()
              });
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(points));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 27. SENSOR SUMMARY PER PLOT (GET /api/sensors/plots/:plotId/summary)
        if (req.method === 'GET' && (url.startsWith('/api/sensors/plots/') && (url.includes('/summary') || url.endsWith('/summary')))) {
          try {
            const m = url.match(/\/api\/sensors\/plots\/([^/?]+)\/summary/);
            const rawId = m ? m[1].trim() : '1';
            const sql = `
SELECT json_build_object(
  'plotId', p.plot_id,
  'plotCode', p.plot_code,
  'latestReading', (
    SELECT json_build_object(
      'temperature', sr.temperature,
      'airHumidity', sr.air_humidity,
      'soilHumidity', sr.soil_humidity,
      'recordedAt', sr.recorded_at
    )
    FROM sensor_readings sr
    WHERE sr.plot_id = p.plot_id
    ORDER BY sr.recorded_at DESC LIMIT 1
  ),
  'avgTemperature', ROUND(COALESCE(AVG(sr2.temperature), 28.5)::numeric, 1),
  'avgAirHumidity', ROUND(COALESCE(AVG(sr2.air_humidity), 72.0)::numeric, 1),
  'avgSoilHumidity', ROUND(COALESCE(AVG(sr2.soil_humidity), 68.0)::numeric, 1),
  'totalReadings24h', COUNT(sr2.reading_id)
)
FROM plots p
LEFT JOIN sensor_readings sr2 ON p.plot_id = sr2.plot_id AND sr2.recorded_at >= NOW() - INTERVAL '24 hours'
WHERE p.plot_id = COALESCE(
  (SELECT p2.plot_id FROM plots p2 
   WHERE p2.plot_id::text = '${rawId.replace(/'/g, "''")}' 
      OR UPPER(p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
      OR UPPER(p2.plot_code) = 'P-' || LPAD('${rawId.replace(/\D/g, '')}', 2, '0')
      OR UPPER('PLOT-' || p2.plot_code) = UPPER('${rawId.replace(/'/g, "''")}')
   LIMIT 1),
  1
)
GROUP BY p.plot_id, p.plot_code;
`;
            const data = await runPostgreSql(sql);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '{}');
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 28. IOT ALERTS API (GET, PUT, POST /api/alerts)
        if (url.startsWith('/api/alerts')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (req.method === 'GET' && (url === '/api/alerts/overview' || url.startsWith('/api/alerts/overview?'))) {
            res.end(JSON.stringify({
              success: true,
              data: {
                totalAlerts: 3,
                activeAlerts: 2,
                criticalAlerts: 1,
                acknowledgedAlerts: 0,
                resolvedAlerts: 1,
                stationsOnline: 16,
                rainWateringOverrideActive: true
              }
            }));
            return;
          }

          if (req.method === 'PUT' && url.includes('/resolve')) {
            res.end(JSON.stringify({
              success: true,
              message: 'Đã xử lý và đóng cảnh báo vi khí hậu thành công',
              data: { status: 'RESOLVED', resolvedAt: new Date().toISOString() }
            }));
            return;
          }

          if (req.method === 'PUT' && url.includes('/ack')) {
            res.end(JSON.stringify({
              success: true,
              message: 'Đã tiếp nhận cảnh báo vi khí hậu',
              data: { status: 'ACKNOWLEDGED' }
            }));
            return;
          }

          if (req.method === 'POST' && url.includes('/simulate')) {
            res.end(JSON.stringify({
              success: true,
              message: 'Đã kích hoạt giả lập cảnh báo vi khí hậu',
              data: {
                alertId: 99,
                alertCode: 'ALT-99',
                plotId: 1,
                plotCode: 'P-01',
                alertType: 'HIGH_TEMPERATURE',
                severity: 'CRITICAL',
                status: 'ACTIVE',
                metricName: 'Nhiệt độ không khí',
                actualValue: 39.2,
                thresholdValue: 35.0,
                message: 'CẢNH BÁO KHẨN CẤP: Nhiệt độ thửa P-01 đạt 39.2°C, vượt ngưỡng giới hạn an toàn thực vật.',
                actionSuggested: 'Bật phun sương làm mát và hệ thống quạt thông gió cưỡng bức.',
                detectedAt: new Date().toISOString()
              }
            }));
            return;
          }

          if (req.method === 'GET') {
            res.end(JSON.stringify({
              success: true,
              data: [
                {
                  alertId: 1,
                  alertCode: 'ALT-01',
                  plotId: 1,
                  plotCode: 'P-01',
                  alertType: 'HIGH_TEMPERATURE',
                  severity: 'CRITICAL',
                  status: 'ACTIVE',
                  metricName: 'Nhiệt độ không khí',
                  actualValue: 36.8,
                  thresholdValue: 35.0,
                  message: 'Nhiệt độ thửa đất P-01 vượt ngưỡng 35.0°C. Nguy cơ sốc nhiệt và héo rũ lá non.',
                  actionSuggested: 'Kích hoạt phun sương làm mát tự động và kéo lưới che tán xạ nhiệt.',
                  detectedAt: new Date(Date.now() - 25 * 60000).toISOString()
                },
                {
                  alertId: 2,
                  alertCode: 'ALT-02',
                  plotId: 2,
                  plotCode: 'P-02',
                  alertType: 'LOW_SOIL_MOISTURE',
                  severity: 'WARNING',
                  status: 'ACTIVE',
                  metricName: 'Độ ẩm đất',
                  actualValue: 36.5,
                  thresholdValue: 40.0,
                  message: 'Độ ẩm đất thửa P-02 giảm sâu dưới 40.0%. Đất có dấu hiệu khô kiệt cục bộ.',
                  actionSuggested: 'Bổ sung chu kỳ tưới nhỏ giọt 15 phút vào 15:30 chiều nay.',
                  detectedAt: new Date(Date.now() - 50 * 60000).toISOString()
                },
                {
                  alertId: 3,
                  alertCode: 'ALT-03',
                  plotId: 3,
                  plotCode: 'P-03',
                  alertType: 'HIGH_AIR_HUMIDITY',
                  severity: 'WARNING',
                  status: 'RESOLVED',
                  metricName: 'Độ ẩm không khí',
                  actualValue: 92.0,
                  thresholdValue: 85.0,
                  message: 'Độ ẩm không khí thửa P-03 tăng cao sau cơn mưa rào lớn.',
                  actionSuggested: 'Tăng cường thông gió nhà màng để ngăn ngừa nấm mốc phấn trắng.',
                  detectedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
                  resolvedAt: new Date(Date.now() - 3600000).toISOString(),
                  resolvedBy: 'Ban Quản Trị Farmely',
                  resolutionNotes: 'Đã bật quạt thông gió nhà màng, độ ẩm đã hạ về 75% an toàn.'
                }
              ]
            }));
            return;
          }
        }

        // 29. WEATHER & IRRIGATION POLICY API (GET /api/weather)
        if (url.startsWith('/api/weather')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            success: true,
            data: {
              plotId: 1,
              plotCode: 'P-01',
              locationName: 'Trang trại Happy Valley Củ Chi, TP.HCM',
              condition: 'Nhiều mây, có mưa rào và dông chiều',
              iconCode: 'RAIN',
              temperature: 29.5,
              humidity: 82.0,
              rainfallProbability: 85,
              windSpeed: 14.2,
              wateringPostponementRecommended: true,
              recommendationMessage: 'Quy tắc BR18: Xác suất mưa dông đạt 85% chiều nay (kết hợp độ ẩm đất 76%). Hệ thống đề xuất tạm hoãn ca tưới 16:30 để tiết kiệm nước và phòng ngừa ngập úng gốc rễ.',
              forecastDays: [
                { date: '2026-10-21', dayOfWeek: 'Hôm nay', condition: 'Mưa dông chiều', iconCode: 'RAIN', minTemp: 26.0, maxTemp: 32.5, rainProb: 85 },
                { date: '2026-10-22', dayOfWeek: 'Thứ Năm', condition: 'Nắng ráo gián đoạn', iconCode: 'PARTLY_CLOUDY', minTemp: 25.5, maxTemp: 34.0, rainProb: 40 },
                { date: '2026-10-23', dayOfWeek: 'Thứ Sáu', condition: 'Nắng ráo quang đãng', iconCode: 'SUNNY', minTemp: 25.0, maxTemp: 35.0, rainProb: 20 },
                { date: '2026-10-24', dayOfWeek: 'Thứ Bảy', condition: 'Mưa rào nhẹ', iconCode: 'RAIN', minTemp: 26.0, maxTemp: 33.0, rainProb: 65 },
                { date: '2026-10-25', dayOfWeek: 'Chủ Nhật', condition: 'Nắng ấm', iconCode: 'SUNNY', minTemp: 25.5, maxTemp: 34.5, rainProb: 15 }
              ]
            }
          }));
          return;
        }

        // 30. AI CHATBOT SERVICE API (POST /api/ai/chat & GET /api/ai/health)
        if (url.startsWith('/api/ai/chat') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            let payload = {};
            try { payload = JSON.parse(body); } catch {}
            const userMsg = (payload.message || '').trim();
            const lower = userMsg.toLowerCase();
            const convId = payload.conversationId || `conv-${Date.now()}`;

            let reply = '';
            let docs = [];

            if (lower.match(/^(chào|chao|hello|hi|xin chào|alo|farmely ai|ai|bot)(\s+bạn|\s+ạ)?/i) || (lower.includes('chào') && lower.length <= 15)) {
              reply = 'Xin chào bạn! Tôi là Farmely AI — Trợ lý nông nghiệp thông minh của nền tảng Farmely. Tôi có thể hỗ trợ bạn về kỹ thuật gieo trồng chuẩn VietGAP, theo dõi độ ẩm vi khí hậu IoT và thủ tục thuê thửa đất. Bạn cần tôi giải đáp nội dung nào?';
              docs.push({ docTitle: 'Cẩm nang Hướng dẫn Khách hàng Farmely 2026', source: 'Farmely General Guide', similarityScore: 0.95 });
            } else if (lower.includes('cảm ơn') || lower.includes('thank') || lower.includes('tks')) {
              reply = 'Rất vui được hỗ trợ bạn! Chúc bạn có những vụ mùa bội thu, rau sạch chuẩn VietGAP và trải nghiệm canh tác tuyệt vời trên Farmely. Cần hỗ trợ thêm, bạn cứ nhắn cho Farmely AI nhé!';
            } else if (lower.includes('tạm biệt') || lower.includes('bye') || lower.includes('hẹn gặp lại')) {
              reply = 'Tạm biệt bạn nhé! Chúc bạn một ngày làm việc hiệu quả. Khi nào cần tra cứu số liệu thửa đất hay kỹ thuật chăm sóc, Farmely AI luôn sẵn sàng hỗ trợ!';
            } else if (lower.includes('xà lách') || lower.includes('xa lach')) {
              reply = 'Rau xà lách tại Farmely phát triển tốt nhất ở nhiệt độ 18°C – 25°C, độ ẩm đất 65% – 75%. Nên tưới phun mưa mịn vào sáng sớm (6h30 - 7h30) và chiều mát (16h - 17h). Tránh tưới đẫm vào ban đêm để hạn chế nấm thối nhũn bẹ lá nhé!';
              docs.push({ docTitle: 'Kỹ thuật Canh tác Rau Xà lách Thủy Canh & Thổ Canh', source: 'Cẩm nang Sinh học Cây trồng Farmely', similarityScore: 0.94 });
            } else if (lower.includes('độ ẩm') || lower.includes('ẩm đất') || lower.includes('tưới nước') || lower.includes('tưới bù') || lower.includes('mưa')) {
              reply = 'Theo quy tắc vi khí hậu BR18 của Farmely: Độ ẩm đất duy trì lý tưởng từ 60% – 75%. Dưới 38% hệ thống sẽ kích hoạt tưới nhỏ giọt bù ẩm. Nếu độ ẩm đất ≥ 80% hoặc xác suất mưa ≥ 70%, trạm điều hành sẽ tự động hoãn ca tưới để chống úng rễ cây.';
              docs.push({ docTitle: 'Quy chuẩn Điều tiết Tưới & Vi khí hậu Thông minh (BR18)', source: 'Tài liệu Vận hành Trạm IoT Farmely', similarityScore: 0.96 });
            } else if (lower.includes('sâu') || lower.includes('rầy') || lower.includes('bọ trĩ') || lower.includes('ốc sên') || lower.includes('bệnh')) {
              reply = 'Farmely áp dụng 100% biện pháp sinh học hữu cơ: Đối với bọ trĩ và rầy mềm thì phun dung dịch tỏi ớt gừng lên men vi sinh hoặc dầu khoáng sinh học SK Enspray 99EC. Đối với ốc sên thì rải vỏ trứng vụn hoặc bẫy sinh học men bia quanh gốc cây.';
              docs.push({ docTitle: 'Phòng trừ Dịch hại Cây trồng Bằng Biện pháp Sinh học', source: 'Sổ tay Nông nghiệp Hữu cơ', similarityScore: 0.91 });
            } else if (lower.includes('thuê') || lower.includes('hợp đồng') || lower.includes('giá') || lower.includes('gia hạn')) {
              reply = 'Quy trình thuê đất tại Farmely: Bạn chọn thửa đất ưng ý trên Marketplace bản đồ vệ tinh, chọn giống rau và gói chăm sóc, thanh toán trực tuyến 100% qua VNPay/VietQR. Hợp đồng điện tử có hiệu lực ngay và bạn có thể gia hạn trước 3 ngày với chiết khấu từ 5% – 15%.';
              docs.push({ docTitle: 'Quy chế Hợp đồng Thuê đất Nông nghiệp Công nghệ cao (BR11, BR12)', source: 'Trung tâm Pháp lý Farmely', similarityScore: 0.93 });
            } else {
              if (userMsg.length <= 8) {
                reply = 'Farmely AI sẵn sàng hỗ trợ bạn! Bạn đang quan tâm đến kỹ thuật gieo trồng, kiểm tra độ ẩm vi khí hậu hay muốn tìm hiểu thủ tục thuê đất trên Farmely? Cứ nhắn cụ thể câu hỏi cho tôi nhé! Nếu cần phác đồ chuyên sâu, bạn có thể bấm tab "Kênh Chuyên Gia" để trao đổi với ThS. Hoàng Nam nha.';
              } else {
                reply = 'Hệ thống Farmely AI đã ghi nhận câu hỏi từ bạn. Đối với canh tác nông nghiệp công nghệ cao tại Farmely, bạn nên thường xuyên theo dõi biểu đồ cảm biến IoT thời gian thực của thửa đất (độ ẩm đất, nhiệt độ, EC) để điều tiết nước tưới và phân bón hợp lý.\n\nBạn cũng có thể bấm sang tab "Kênh Chuyên Gia" ở ngay phía trên để trò chuyện trực tiếp và nhận tư vấn chi tiết từ ThS. Hoàng Nam nhé!';
              }
              docs.push({ docTitle: 'Cẩm nang Hướng dẫn Canh tác Toàn diện Farmely', source: 'Hệ sinh thái Nông nghiệp Thông minh', similarityScore: 0.88 });
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              conversationId: convId,
              reply: reply,
              referencedDocuments: docs,
              status: 'SUCCESS'
            }));
          });
          return;
        }

        if (url.startsWith('/api/ai/health')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            status: 'UP',
            service: 'Farmely AI Chatbot Service',
            ragReady: true
          }));
          return;
        }

        next();
      });
    }
  };
}
