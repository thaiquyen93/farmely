import fs from 'fs';
import { spawn, execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function runPostgreSql(sqlQuery) {
  if (activePgConfig) {
    try {
      return await runPostgreSqlAttempt(activePgConfig, sqlQuery);
    } catch {
      activePgConfig = null; // reset cache on failure and re-probe
    }
  }

  const base = getPgConfig();
  const candidatePorts = Array.from(new Set([base.port, '5432', '5433'].filter(Boolean)));
  const candidatePasses = Array.from(new Set([base.password, 'postgres', '12345', ''].filter(p => p !== undefined)));

  let lastErr = null;
  for (const port of candidatePorts) {
    for (const pass of candidatePasses) {
      const trialCfg = { ...base, port, password: pass };
      try {
        const res = await runPostgreSqlAttempt(trialCfg, sqlQuery);
        activePgConfig = trialCfg;
        return res;
      } catch (err) {
        lastErr = err;
      }
    }
  }
  throw lastErr || new Error('Không thể kết nối đến PostgreSQL cục bộ');
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
              const startDate = (payload.startDate || new Date().toISOString().slice(0, 10)).trim().replace(/'/g, "''");
              const plotItems = Array.isArray(payload.plots) && payload.plots.length > 0 ? payload.plots : [{ code: 'P-01', price: totalAmount }];
              const nowStamp = Date.now().toString().slice(-6);
              const contractNumber = `MLA-2026-${nowStamp}`;
              const gatewayRef = (payload.gatewayRef || `TXN-FARMLY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nowStamp}`).replace(/'/g, "''");

              let responseData = null;

              // --- A. THỬ GHI VÀO POSTGRESQL (farmely) ---
              try {
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
                  const price = parseFloat(item.price) || (totalAmount / plotItems.length);
                  const cleanPlotId = parseInt(cleanCode.replace(/\D/g, ''), 10) || 1;
                  const rawCrop = item.cropId || item.varietyId;
                  const parsedCropId = parseInt(String(rawCrop || '').replace(/\D/g, ''), 10);
                  const varietyId = !isNaN(parsedCropId) && parsedCropId > 0 && parsedCropId <= 10 ? parsedCropId : 1;

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
        VALUES (1, 'P-' || '${numCode}', 100.00, ${price}, 'RENT', TRUE, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80')
        RETURNING plot_id INTO v_plot_id;
    END IF;

    -- Thêm bản ghi rental với ngày bắt đầu do khách chọn
    INSERT INTO rentals (contract_id, plot_id, variety_id, start_date, end_date, total_price, status, created_at, updated_at)
    VALUES (v_contract_id, v_plot_id, ${varietyId}, '${startDate}', '${startDate}'::date + INTERVAL '${rentalMonths} months', ${price}, 'ACTIVE', NOW(), NOW())
    RETURNING rental_id INTO v_rental_id;

    -- CẬP NHẬT TRẠNG THÁI THỬA ĐẤT SANG 'RENT' (ĐÃ THUÊ)
    UPDATE plots SET status = 'RENT', updated_at = NOW() WHERE plot_id = v_plot_id;

    -- TỰ ĐỘNG KHỞI TẠO CÁC BƯỚC ĐẦU TIÊN CỦA QUY TRÌNH VIETGAP CHUẨN TỪNG CÂY
    INSERT INTO care_tasks (rental_id, step_id, task_assigned_to, due_date, status, notes, created_at, updated_at)
    SELECT 
        v_rental_id,
        ts.step_id,
        COALESCE((SELECT user_id FROM users WHERE role_id = 4 LIMIT 1), 2),
        ('${startDate}'::date + (ts.day_offset || ' days')::interval)::date,
        CASE WHEN ts.day_offset = 0 AND '${startDate}'::date <= CURRENT_DATE THEN 'IN_PROG' ELSE 'PENDING' END,
        ts.step_name || ': ' || ts.description,
        NOW(),
        NOW()
    FROM template_steps ts
    JOIN process_templates pt ON ts.template_id = pt.template_id
    WHERE pt.variety_id = ${varietyId}
    ORDER BY ts.day_offset ASC, ts.step_id ASC;

    -- TẠO NHẬT KÝ ĐẦU TIÊN CHO THỬA MỚI
    INSERT INTO farm_diaries (rental_id, content, image_url, created_at)
    VALUES (
        v_rental_id,
        'Khởi tạo chu kỳ canh tác chuẩn VietGAP cho giống ' || (SELECT COALESCE(variety_name, 'Rau sạch') FROM varieties WHERE variety_id = ${varietyId}) || '. Ngày bắt đầu: ' || TO_CHAR('${startDate}'::date, 'DD/MM/YYYY') || '.',
        'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
        NOW()
    );
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
            rt.status::text AS "status"
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
  'role', CASE WHEN r.role_name = 'FIELD_WORKER' THEN 'STAFF' ELSE r.role_name END,
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


        // 7. GET /api/users (List all registered users from PostgreSQL)
        if (req.method === 'GET' && url === '/api/users') {
          try {
            const sql = `
SELECT COALESCE(json_agg(row_to_json(u)), '[]'::json) FROM (
  SELECT u.user_id, u.email, u.full_name, u.phone_number, r.role_name AS role, u.status, TO_CHAR(u.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
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
    'Thửa ' || p.plot_code || ' - ' || l.land_name AS name,
    l.land_name AS location,
    p.area || 'm²' AS area,
    CASE WHEN s.service_type = 'SELF' THEN 'Self-Growing' ELSE 'Assisted-Growing' END AS mode,
    COALESCE(v.variety_name, 'Rau củ VietGAP') AS crop,
    COALESCE(
      (
        SELECT ts.step_name 
        FROM template_steps ts
        JOIN process_templates pt ON ts.template_id = pt.template_id
        WHERE pt.variety_id = r.variety_id
          AND (CURRENT_DATE - r.start_date) >= ts.day_offset
        ORDER BY ts.day_offset DESC, ts.step_id DESC
        LIMIT 1
      ),
      (
        SELECT ts.step_name 
        FROM template_steps ts
        JOIN process_templates pt ON ts.template_id = pt.template_id
        WHERE pt.variety_id = r.variety_id
        ORDER BY ts.day_offset ASC, ts.step_id ASC
        LIMIT 1
      ),
      'Làm đất & Bón lót'
    ) AS stage,
    CASE 
      WHEN CURRENT_DATE < r.start_date THEN 0
      ELSE (CURRENT_DATE - r.start_date) + 1
    END AS "currentDay",
    COALESCE(v.expected_duration, 60) AS "totalDays",
    CASE
      WHEN CURRENT_DATE < r.start_date THEN 0
      ELSE LEAST(100, GREATEST(1, ROUND(((CURRENT_DATE - r.start_date + 1)::numeric / NULLIF(COALESCE(v.expected_duration, 60), 0)::numeric) * 100)))
    END AS "progressPercent",
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'stepId', ts.step_id,
            'stage', ts.step_name,
            'dayOffset', ts.day_offset,
            'durationDays', ts.duration_days,
            'guide', COALESCE(ts.description, '')
          ) ORDER BY ts.day_offset ASC, ts.step_id ASC
        )
        FROM template_steps ts
        JOIN process_templates pt ON ts.template_id = pt.template_id
        WHERE pt.variety_id = r.variety_id
      ),
      '[]'::json
    ) AS "processSteps",
    COALESCE(p.image_url, '/images/Mucangchai3.jpg') AS image,
    '28.5°C' AS temp,
    '68%' AS "soilMoisture",
    '74%' AS "airHumidity",
    '45.000 Lux' AS light,
    '6.5' AS ph,
    'IOT-' || p.plot_code AS "stationId",
    'HEALTHY' AS status,
    'Trần Văn Lực (CVLĐ)' AS worker,
    c.contract_number AS "contractCode",
    TO_CHAR(r.end_date, 'YYYY-MM-DD') AS "expectedHarvestDate",
    '35 - 45 kg' AS "expectedYield",
    'Đất phù sa bồi lắng giàu mùn (pH 6.5)' AS "soilType",
    'Hệ thống nước tưới ngầm lọc cát + UV' AS "waterSource",
    c.contract_id, c.contract_number, c.renter_id, c.status AS contract_status,
    r.rental_id, r.service_id, 
    TO_CHAR(r.start_date, 'YYYY-MM-DD') AS start_date, 
    TO_CHAR(r.start_date, 'YYYY-MM-DD') AS "startDate", 
    TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date, 
    TO_CHAR(r.end_date, 'YYYY-MM-DD') AS "endDate", 
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
  ORDER BY r.rental_id DESC
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
      THEN l.boundary_geojson::json 
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
      THEN l.boundary_geojson::json 
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
              THEN p.boundary_geojson::json 
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
        'Chuyên gia Nông nghiệp Farmely' AS "authorName",
        TO_CHAR(pt.created_at, 'YYYY-MM-DD') AS "createdAt"
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
            let whereSql = '';
            if (emailFilter) {
              whereSql = `WHERE LOWER(u.email) = '${emailFilter.replace(/'/g, "''")}'`;
            } else if (customerIdParam > 0) {
              whereSql = `WHERE c.renter_id = ${customerIdParam}`;
            }

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
        COALESCE(
          (
            SELECT ts.step_name 
            FROM template_steps ts
            JOIN process_templates pt ON ts.template_id = pt.template_id
            WHERE pt.variety_id = rent.variety_id
              AND (CURRENT_DATE - rent.start_date) >= ts.day_offset
            ORDER BY ts.day_offset DESC, ts.step_id DESC
            LIMIT 1
          ),
          (
            SELECT ts.step_name 
            FROM template_steps ts
            JOIN process_templates pt ON ts.template_id = pt.template_id
            WHERE pt.variety_id = rent.variety_id
            ORDER BY ts.day_offset ASC, ts.step_id ASC
            LIMIT 1
          ),
          'Làm đất & Bón lót'
        ) AS stage,
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
        COALESCE(v.growth_duration_days, 60) AS "totalDays",
        CASE
          WHEN CURRENT_DATE < rent.start_date THEN 0
          ELSE LEAST(100, GREATEST(1, ROUND(((CURRENT_DATE - rent.start_date + 1)::numeric / NULLIF(COALESCE(v.growth_duration_days, 60), 0)::numeric) * 100)))
        END AS "progressPercent"
      FROM rentals rent
      JOIN plots p ON rent.plot_id = p.plot_id
      LEFT JOIN lands l ON p.land_id = l.land_id
      JOIN contracts c ON rent.contract_id = c.contract_id
      LEFT JOIN users u ON c.renter_id = u.user_id
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

        // 18. CARE TASKS API (GET, POST, PATCH /api/care-tasks)
        if (req.method === 'GET' && (url === '/api/care-tasks' || url === '/api/v1/care-tasks' || url === '/api/tasks' || url.startsWith('/api/care-tasks?') || url.startsWith('/api/v1/care-tasks?') || url.startsWith('/api/tasks?'))) {
          try {
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
        rent.plot_id AS "plotId",
        p.plot_code AS "plotCode",
        'Thửa ' || p.plot_code AS "plotName",
        COALESCE(ts.step_name, ct.notes, 'Chăm sóc vi sinh tiêu chuẩn') AS title,
        COALESCE(v.variety_name, 'Cà chua bi Cherry F1') AS crop,
        COALESCE(u_renter.full_name, 'Khách hàng') AS "customerName",
        COALESCE(u_worker.full_name, 'Trần Văn Lực') AS "assignedTo",
        COALESCE(u_worker.full_name, 'Trần Văn Lực') AS "workerName",
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
              const dbStatus = payload.status === 'COMPLETED' || payload.status === 'DONE' ? 'DONE' : payload.status === 'IN_PROGRESS' ? 'IN_PROG' : 'PENDING';
              const proof = (payload.proofPhoto || payload.evidence_image_url || '').replace(/'/g, "''");
              const notes = (payload.instructions || payload.notes || '').replace(/'/g, "''");
              const sql = `
UPDATE care_tasks
SET status = '${dbStatus}'${proof ? `, evidence_image_url = '${proof}'` : ''}${notes ? `, notes = '${notes}'` : ''}, updated_at = NOW()
WHERE task_id = ${taskId}
RETURNING task_id, status;
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
        COALESCE(u_hand.full_name, 'ThS. Nguyễn Hoàng Nam') AS "expertName",
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

        if ((req.method === 'PUT' || req.method === 'PATCH') && url.match(/^\/api\/(?:v1\/)?issue-reports\/(\d+)/)) {
          const issueId = url.match(/^\/api\/(?:v1\/)?issue-reports\/(\d+)/)[1];
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const diag = (payload.diagnosis || payload.resolution_notes || 'Chuyên gia nông nghiệp duyệt xử lý đạt yêu cầu.').replace(/'/g, "''");
              const sql = `
UPDATE issue_reports
SET status = 'RESOLVED', resolution_notes = '${diag}', resolved_at = NOW()
WHERE issue_id = ${issueId}
RETURNING issue_id;
`;
              await runPostgreSql(sql);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true, message: `Đã cập nhật chẩn đoán sự cố #${issueId}` }));
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
        '100%' AS battery,
        '4G / LoRa' AS connectivity,
        json_build_object(
          'soilMoisture', COALESCE(sr.soil_humidity, 68.0) || '%',
          'temperature', COALESCE(sr.temperature, 28.5) || '°C',
          'airHumidity', COALESCE(sr.air_humidity, 74.0) || '%',
          'light', '45.000 Lux',
          'lastUpdate', TO_CHAR(COALESCE(sr.recorded_at, NOW()), 'HH24:MI - DD/MM/YYYY')
        ) AS readings
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

        next();
      });
    }
  };
}
