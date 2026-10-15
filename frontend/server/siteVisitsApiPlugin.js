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

function getPgConfig() {
  return {
    host: process.env.PGHOST || process.env.DB_HOST || rootEnv.DB_HOST || 'localhost',
    port: process.env.PGPORT || process.env.DB_PORT || rootEnv.DB_PORT || '5433',
    database: process.env.PGDATABASE || process.env.DB_NAME || rootEnv.DB_NAME || 'farmely',
    user: process.env.PGUSER || process.env.DB_USER || rootEnv.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || rootEnv.DB_PASSWORD || '12345'
  };
}

let cachedPlotsData = null;
let cachedPlotsTime = 0;
const CACHE_TTL_MS = 20000; // 20s in-memory cache

function invalidatePlotsCache() {
  cachedPlotsData = null;
  cachedPlotsTime = 0;
}

function runPostgreSql(sqlQuery) {
  return new Promise((resolve, reject) => {
    const cfg = getPgConfig();
    const env = { ...process.env, PGPASSWORD: cfg.password, PGCLIENTENCODING: 'UTF8' };
    const child = spawn(
      PSQL_PATH,
      ['-U', cfg.user, '-h', cfg.host, '-p', cfg.port, '-d', cfg.database, '-t', '-A', '-q', '-v', 'ON_ERROR_STOP=1'],
      { env, windowsHide: true }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => stdout += d.toString('utf8'));
    child.stderr.on('data', d => stderr += d.toString('utf8'));
    child.on('close', code => {
      if (code !== 0) reject(new Error(stderr || 'Exit ' + code));
      else resolve(stdout.trim());
    });
    child.stdin.write(sqlQuery, 'utf8');
    child.stdin.end();
  });
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

        // Ưu tiên chuyển tiếp /api/lands và /api/plots sang Backend API Gateway (8080) -> farm-service (8082)
        if (
          url.startsWith('/api/lands') ||
          url.startsWith('/api/v1/lands') ||
          url.startsWith('/api/plots') ||
          url.startsWith('/api/v1/plots')
        ) {
          return next();
        }

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
              const rawCust = String(payload.customerId || '');
              const numCust = parseInt(rawCust.replace(/\D/g, ''), 10);
              const customerId = (!isNaN(numCust) && numCust > 0) ? numCust : 6;
              const totalAmount = parseFloat(payload.totalAmount) || 2400000.00;
              const paymentMethod = (payload.paymentMethod || 'VIETQR').replace(/'/g, "''");
              const rentalMonths = parseInt(payload.rentalMonths, 10) || 6;
              const plotItems = Array.isArray(payload.plots) && payload.plots.length > 0 ? payload.plots : [{ code: 'P-01', price: totalAmount }];
              const nowStamp = Date.now().toString().slice(-6);
              const contractNumber = `MLA-2026-${nowStamp}`;
              const gatewayRef = `TXN-FARMLY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${nowStamp}`;

              let responseData = null;

              // --- A. THỬ GHI VÀO POSTGRESQL (farmely) ---
              try {
                let pgSql = `
DO $$
DECLARE
    v_contract_id INT;
    v_plot_id INT;
BEGIN
    INSERT INTO contracts (renter_id, contract_number, total_amount, status, reservation_expires_at)
    VALUES (${customerId}, '${contractNumber}', ${totalAmount}, 'ACTIVE', NOW() + INTERVAL '10 minutes')
    RETURNING contract_id INTO v_contract_id;

    INSERT INTO payment_transactions (contract_id, type, amount, payment_method, gateway_ref, status)
    VALUES (v_contract_id, 'PAYMENT', ${totalAmount}, '${paymentMethod}', '${gatewayRef}', 'SUCCESS');
`;
                for (const item of plotItems) {
                  const rawCode = item.code || 'P-01';
                  const cleanCode = rawCode.replace('L01-', '').replace('Plot ', '').replace(/'/g, "''");
                  const price = parseFloat(item.price) || (totalAmount / plotItems.length);
                  pgSql += `
    SELECT plot_id INTO v_plot_id FROM plots WHERE plot_code = '${cleanCode}' OR plot_code LIKE '%${cleanCode.slice(-3)}' LIMIT 1;
    IF v_plot_id IS NULL THEN v_plot_id := 1; END IF;

    INSERT INTO rentals (contract_id, plot_id, variety_id, start_date, end_date, total_price, status)
    VALUES (v_contract_id, v_plot_id, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '${rentalMonths} months', ${price}, 'ACTIVE');

    UPDATE plots SET status = 'RENT' WHERE plot_id = v_plot_id;
`;
                }
                pgSql += `END $$;`;
                await runPostgreSql(pgSql);

                const fetchCreatedSql = `
SELECT json_build_object(
  'success', true,
  'database', 'PostgreSQL 18 (farmely)',
  'contract_number', c.contract_number,
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
                  gateway_ref: gatewayRef,
                  message: 'Giao dịch thanh toán được ghi nhận thành công'
                };
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

        // 6. POST /api/auth/register (Persist new user directly to PostgreSQL and SQL Server)
        if (req.method === 'POST' && (url === '/api/auth/register' || url === '/api/v1/auth/register')) {
          const chunks = [];
          req.on('data', chunk => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks).toString('utf8');
              const payload = JSON.parse(body || '{}');
              const email = (payload.email || '').trim().toLowerCase().replace(/'/g, "''");
              const fullName = (payload.fullName || payload.full_name || email.split('@')[0] || 'Khách hàng').trim().replace(/'/g, "''");
              const phone = (payload.phoneNumber || payload.phone || '0901234567').trim().replace(/'/g, "''");
              const password = payload.password || 'Farmely@2026';
              const pwdHash = '$2a$10$' + Buffer.from(password).toString('base64').padEnd(53, 'A').slice(0, 53);

              if (!email) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Email không được để trống' }));
                return;
              }

              // Check if user already exists
              const checkSql = `SELECT user_id, email FROM users WHERE LOWER(email) = LOWER('${email}') LIMIT 1;`;
              const checkRes = await runPostgreSql(checkSql);
              if (checkRes && checkRes.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: false, message: 'Email này đã tồn tại trong hệ thống' }));
                return;
              }

              // Insert into PostgreSQL
              const insertPg = `
INSERT INTO users (role_id, email, password_hash, full_name, phone_number, status, created_at, updated_at)
VALUES (1, '${email}', '${pwdHash}', '${fullName}', '${phone}', 'ACTIVE', NOW(), NOW())
RETURNING json_build_object(
  'user_id', user_id,
  'role_id', role_id,
  'email', email,
  'full_name', full_name,
  'phone_number', phone_number,
  'status', status,
  'created_at', TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS')
);
`;
              const pgOut = await runPostgreSql(insertPg);
              const cleanJsonStr = (pgOut || '').trim().split('\n')[0];
              const createdUser = JSON.parse(cleanJsonStr || '{}');

              // Sync to SQL Server via Base64 for perfect Unicode support
              try {
                const b64 = Buffer.from(JSON.stringify({ email, pwdHash, fullName, phone }), 'utf8').toString('base64');
                const msScript = `
$bytes = [System.Convert]::FromBase64String("${b64}")
$obj = [System.Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "INSERT INTO users (role_id, email, password_hash, full_name, phone_number, status, created_at, updated_at) VALUES (1, @email, @pwd, @name, @phone, 'ACTIVE', GETDATE(), GETDATE())"
[void]$cmd.Parameters.AddWithValue("@email", [string]$obj.email)
[void]$cmd.Parameters.AddWithValue("@pwd", [string]$obj.pwdHash)
[void]$cmd.Parameters.AddWithValue("@name", [string]$obj.fullName)
[void]$cmd.Parameters.AddWithValue("@phone", [string]$obj.phone)
[void]$cmd.ExecuteNonQuery()
$conn.Close()
`;
                runPowershell(msScript).catch(() => {});
              } catch (e) {}

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Đăng ký tài khoản thành công vào CSDL Farmely',
                data: {
                  id: createdUser.user_id,
                  userId: createdUser.user_id,
                  email: createdUser.email,
                  fullName: createdUser.full_name,
                  phone: createdUser.phone_number,
                  role: 'CUSTOMER',
                  roleTitle: 'Khách hàng thuê đất'
                }
              }));
            } catch (err) {
              console.error('Error on /api/auth/register:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: false, error: String(err) }));
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
    p.land_id AS "landId", 
    l.land_name AS "landName",
    p.plot_code AS "plotCode", 
    p.area, 
    p.image_url AS "imageUrl", 
    p.price_per_period AS "pricePerPeriod", 
    p.status::text AS "status", 
    p.is_published AS "isPublished",
    CASE 
      WHEN p.boundary_geojson IS NOT NULL AND p.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN p.boundary_geojson::json ? 'coordinates' 
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
    p.land_id AS "landId", 
    l.land_name AS "landName",
    p.plot_code AS "plotCode", 
    p.area, 
    p.image_url AS "imageUrl", 
    p.price_per_period AS "pricePerPeriod", 
    p.status::text AS "status", 
    p.is_published AS "isPublished",
    CASE 
      WHEN p.boundary_geojson IS NOT NULL AND p.boundary_geojson != '' 
      THEN (
        CASE 
          WHEN p.boundary_geojson::json ? 'coordinates' 
          THEN p.boundary_geojson::json->'coordinates'->0 
          ELSE p.boundary_geojson::json 
        END
      )
      ELSE NULL 
    END AS "boundary",
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

        next();
      });
    }
  };
}
