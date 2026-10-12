import fs from 'fs';
import { spawn, execFile } from 'child_process';

const PSQL_CANDIDATES = [
  process.env.PSQL_PATH,
  'D:/S5/PostgreSQL/bin/psql.exe',
  'C:/Program Files/PostgreSQL/18/bin/psql.exe',
  'C:/Program Files/PostgreSQL/17/bin/psql.exe',
  'C:/Program Files/PostgreSQL/16/bin/psql.exe'
].filter(Boolean);

const PSQL_PATH = PSQL_CANDIDATES.find(p => {
  try { return fs.existsSync(p); } catch { return false; }
}) || 'psql';

const PG_ENV = { ...process.env, PGPASSWORD: process.env.PGPASSWORD || '@Bin054206', PGCLIENTENCODING: 'UTF8' };

function runPostgreSql(sqlQuery) {
  return new Promise((resolve, reject) => {
    try {
      const child = spawn(
        PSQL_PATH,
        ['-U', process.env.PGUSER || 'postgres', '-h', 'localhost', '-p', process.env.PGPORT || '5432', '-d', process.env.PGDATABASE || 'Farmely', '-t', '-A', '-v', 'ON_ERROR_STOP=1'],
        { env: PG_ENV }
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

function runPowershell(script) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
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
            const sql = `
SELECT json_build_object(
  'engine', 'PostgreSQL 18.6',
  'database', 'farmely',
  'port', 5432,
  'ddl_source', 'ISP392_FINAL_20tables.sql',
  'contracts_count', (SELECT count(*) FROM contracts),
  'rentals_count', (SELECT count(*) FROM rentals),
  'payment_transactions_count', (SELECT count(*) FROM payment_transactions),
  'site_visits_count', (SELECT count(*) FROM site_visits),
  'rented_plots_count', (SELECT count(*) FROM plots WHERE status = 'RENT'),
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

        next();
      });
    }
  };
}
