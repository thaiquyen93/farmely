import { execFile } from 'child_process';

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

        // 1. GET /api/site-visits
        if (req.method === 'GET' && (url === '/api/site-visits' || url.startsWith('/api/site-visits?'))) {
          try {
            const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT 
    v.visit_id, 
    v.plot_id, 
    p.plot_code, 
    p.area, 
    v.visitor_name, 
    v.visitor_phone, 
    v.visitor_email, 
    CONVERT(varchar(10), v.visit_date, 120) as visit_date, 
    v.visit_slot, 
    v.group_size, 
    v.notes, 
    v.status, 
    CONVERT(varchar(19), v.created_at, 120) as created_at 
FROM site_visits v 
LEFT JOIN plots p ON v.plot_id = p.plot_id 
ORDER BY v.visit_id DESC 
FOR JSON PATH
"@

$reader = $cmd.ExecuteReader()
$sb = New-Object System.Text.StringBuilder
while ($reader.Read()) {
    [void]$sb.Append($reader.GetString(0))
}
$conn.Close()
$json = $sb.ToString()
if (-not $json) { $json = "[]" }
Write-Output $json
`;
            const data = await runPowershell(script);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            console.error('SQL Server error on GET /api/site-visits:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 2. POST /api/site-visits (Create new booking via base64 for perfect Unicode)
        if (req.method === 'POST' && url === '/api/site-visits') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

              const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$b64 = "${b64}"
$bytes = [System.Convert]::FromBase64String($b64)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes)
$obj = $jsonStr | ConvertFrom-Json

$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
INSERT INTO site_visits (plot_id, visitor_name, visitor_phone, visitor_email, visit_date, visit_slot, group_size, notes, status, created_at)
OUTPUT INSERTED.visit_id, INSERTED.visitor_name, INSERTED.visitor_phone, INSERTED.visitor_email, CONVERT(varchar(10), INSERTED.visit_date, 120) as visit_date, INSERTED.visit_slot, INSERTED.group_size, INSERTED.notes, INSERTED.status, CONVERT(varchar(19), INSERTED.created_at, 120) as created_at
VALUES (@plot_id, @name, @phone, @email, @date, @slot, @group, @notes, 'PENDING', GETDATE())
"@
[void]$cmd.Parameters.AddWithValue("@plot_id", $(if ($obj.plot_id) { [int]$obj.plot_id } else { [System.DBNull]::Value }))
[void]$cmd.Parameters.AddWithValue("@name", [string]$obj.visitor_name)
[void]$cmd.Parameters.AddWithValue("@phone", [string]$obj.visitor_phone)
[void]$cmd.Parameters.AddWithValue("@email", [string]$obj.visitor_email)
[void]$cmd.Parameters.AddWithValue("@date", [string]$obj.visit_date)
[void]$cmd.Parameters.AddWithValue("@slot", $(if ($obj.visit_slot) { [string]$obj.visit_slot } else { "MORNING" }))
[void]$cmd.Parameters.AddWithValue("@group", $(if ($obj.group_size) { [int]$obj.group_size } else { 1 }))
[void]$cmd.Parameters.AddWithValue("@notes", [string]$obj.notes)

$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
[void]$adapter.Fill($dt)
$conn.Close()
$json = $dt | ConvertTo-Json -Compress
Write-Output $json
`;
              const createdResultStr = await runPowershell(script);
              const createdObj = JSON.parse(createdResultStr);
              const createdRow = {
                visit_id: createdObj.visit_id,
                visitor_name: createdObj.visitor_name,
                visitor_phone: createdObj.visitor_phone,
                visitor_email: createdObj.visitor_email,
                visit_date: createdObj.visit_date,
                visit_slot: createdObj.visit_slot,
                group_size: createdObj.group_size,
                notes: createdObj.notes,
                status: createdObj.status,
                created_at: createdObj.created_at
              };

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: 'Tạo đơn đặt lịch xem đất thành công vào SQL Server (isp392_agritech)',
                data: createdRow
              }));
            } catch (err) {
              console.error('SQL Server error on POST /api/site-visits:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // 3. POST /api/site-visits/:id/confirm (Admin confirms appointment)
        if (req.method === 'POST' && url.includes('/confirm')) {
          const match = url.match(/\/api\/site-visits\/(\d+)\/confirm/);
          if (match) {
            const visitId = Number(match[1]);
            try {
              const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "UPDATE site_visits SET status = 'CONFIRMED' WHERE visit_id = ${visitId}; SELECT @@ROWCOUNT;"
$rows = $cmd.ExecuteScalar()
$conn.Close()
Write-Output $rows
`;
              await runPowershell(script);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                success: true,
                message: `Xác nhận lịch đón tiếp #${visitId} thành công vào SQL Server`
              }));
            } catch (err) {
              console.error('SQL Server error on confirm visit:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
            return;
          }
        }

        // 4. POST /api/bookings/checkout (Save payment transaction, order, and rentals to SQL Server)
        if (req.method === 'POST' && (url === '/api/bookings/checkout' || url === '/api/v1/payments/checkout')) {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const b64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');

              const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$b64 = "${b64}"
$bytes = [System.Convert]::FromBase64String($b64)
$jsonStr = [System.Text.Encoding]::UTF8.GetString($bytes)
$obj = $jsonStr | ConvertFrom-Json

$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$tran = $conn.BeginTransaction()

try {
    # 1. Resolve customer_id
    $customerId = 4
    if ($obj.customerId) {
        $customerId = [int]$obj.customerId
    } elseif ($obj.customerEmail) {
        $cmdUser = $conn.CreateCommand()
        $cmdUser.Transaction = $tran
        $cmdUser.CommandText = "SELECT TOP 1 user_id FROM users WHERE email = @email"
        [void]$cmdUser.Parameters.AddWithValue("@email", [string]$obj.customerEmail)
        $foundUid = $cmdUser.ExecuteScalar()
        if ($foundUid) { $customerId = [int]$foundUid }
    }

    $totalAmount = [decimal]$obj.totalAmount
    $paymentMethod = [string]$(if ($obj.paymentMethod) { $obj.paymentMethod } else { "VIETQR" })
    $cultivationMode = [string]$(if ($obj.cultivationMode) { $obj.cultivationMode } else { "ASSISTED_GROWING" })
    $rentalMonths = $(if ($obj.rentalMonths) { [int]$obj.rentalMonths } else { 3 })
    $gatewayRef = "TXN-FARMLY-" + (Get-Date -Format "yyyyMMdd-HHmmss")

    # 2. Insert into orders (requires expires_at)
    $cmdOrder = $conn.CreateCommand()
    $cmdOrder.Transaction = $tran
    $cmdOrder.CommandText = @"
INSERT INTO orders (customer_id, total_amount, status, expires_at, grace_until, created_at, updated_at)
OUTPUT INSERTED.order_id
VALUES (@cid, @amt, 'PAID', DATEADD(minute, 15, SYSDATETIME()), DATEADD(minute, 15, SYSDATETIME()), SYSDATETIME(), SYSDATETIME())
"@
    [void]$cmdOrder.Parameters.AddWithValue("@cid", $customerId)
    [void]$cmdOrder.Parameters.AddWithValue("@amt", $totalAmount)
    $orderId = [int]$cmdOrder.ExecuteScalar()

    # 3. Insert into payment_transactions
    $cmdPay = $conn.CreateCommand()
    $cmdPay.Transaction = $tran
    $cmdPay.CommandText = @"
INSERT INTO payment_transactions (order_id, type, amount, payment_method, gateway_ref, status, created_at)
OUTPUT INSERTED.transaction_id
VALUES (@oid, 'PAYMENT', @amt, @pm, @gw, 'SUCCESS', SYSDATETIME())
"@
    [void]$cmdPay.Parameters.AddWithValue("@oid", $orderId)
    [void]$cmdPay.Parameters.AddWithValue("@amt", $totalAmount)
    [void]$cmdPay.Parameters.AddWithValue("@pm", $paymentMethod)
    [void]$cmdPay.Parameters.AddWithValue("@gw", $gatewayRef)
    $txnId = [int]$cmdPay.ExecuteScalar()

    # 4. Insert into rentals for each plot (requires variety_id)
    $insertedRentals = @()
    $plotItems = $obj.plots
    if (-not $plotItems -or $plotItems.Count -eq 0) {
        $plotItems = @(@{ code = "L01-P01"; price = $totalAmount })
    }

    foreach ($item in $plotItems) {
        $pCode = [string]$(if ($item.code) { $item.code } else { "L01-P01" })
        
        $cmdPlot = $conn.CreateCommand()
        $cmdPlot.Transaction = $tran
        $cmdPlot.CommandText = @"
SELECT TOP 1 plot_id FROM plots 
WHERE plot_code = @pcode 
   OR plot_code = REPLACE(@pcode, 'Plot ', 'L01-')
   OR plot_code LIKE '%' + RIGHT(@pcode, 3)
"@
        [void]$cmdPlot.Parameters.AddWithValue("@pcode", $pCode)
        $foundPlotId = $cmdPlot.ExecuteScalar()
        if (-not $foundPlotId) { $foundPlotId = 1 }

        $lockedPrice = [decimal]$(if ($item.price) { $item.price } else { $totalAmount })

        $cmdRental = $conn.CreateCommand()
        $cmdRental.Transaction = $tran
        $cmdRental.CommandText = @"
INSERT INTO rentals (order_id, plot_id, variety_id, start_date, end_date, cultivation_mode, locked_price, status, created_at, updated_at)
OUTPUT INSERTED.rental_id
VALUES (@oid, @pid, 1, CAST(GETDATE() AS DATE), DATEADD(month, @months, CAST(GETDATE() AS DATE)), @cm, @lp, 'ACTIVE', SYSDATETIME(), SYSDATETIME())
"@
        [void]$cmdRental.Parameters.AddWithValue("@oid", $orderId)
        [void]$cmdRental.Parameters.AddWithValue("@pid", [int]$foundPlotId)
        [void]$cmdRental.Parameters.AddWithValue("@months", $rentalMonths)
        [void]$cmdRental.Parameters.AddWithValue("@cm", $cultivationMode)
        [void]$cmdRental.Parameters.AddWithValue("@lp", $lockedPrice)
        $rentalId = [int]$cmdRental.ExecuteScalar()
        $insertedRentals += $rentalId

        # Update plot status to RENTED
        $cmdUpd = $conn.CreateCommand()
        $cmdUpd.Transaction = $tran
        $cmdUpd.CommandText = "UPDATE plots SET status = 'RENTED' WHERE plot_id = @pid"
        [void]$cmdUpd.Parameters.AddWithValue("@pid", [int]$foundPlotId)
        [void]$cmdUpd.ExecuteNonQuery()
    }

    $tran.Commit()

    $contractCode = "MLA-2026-" + (100000 + $orderId * 137).ToString()
    $resultObj = @{
        success = $true
        order_id = $orderId
        transaction_id = $txnId
        contract_code = $contractCode
        gateway_ref = $gatewayRef
        rental_ids = $insertedRentals
        total_amount = $totalAmount
        customer_id = $customerId
        message = "Lưu giao dịch thanh toán thành công vào SQL Server (isp392_agritech)"
    }
    Write-Output ($resultObj | ConvertTo-Json -Compress)
} catch {
    $tran.Rollback()
    Write-Error $_.Exception.Message
} finally {
    $conn.Close()
}
`;
              const checkoutResultStr = await runPowershell(script);
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(checkoutResultStr);
            } catch (err) {
              console.error('SQL Server error on POST /api/bookings/checkout:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 5. GET /api/bookings/transactions (Check latest payments in SQL Server)
        if (req.method === 'GET' && url === '/api/bookings/transactions') {
          try {
            const script = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=isp392_agritech;Integrated Security=True;TrustServerCertificate=True")
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT TOP 10 
    pt.transaction_id, 
    pt.order_id, 
    o.customer_id, 
    u.full_name as customer_name, 
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
while ($reader.Read()) {
    [void]$sb.Append($reader.GetString(0))
}
$conn.Close()
$json = $sb.ToString()
if (-not $json) { $json = "[]" }
Write-Output $json
`;
            const data = await runPowershell(script);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(data || '[]');
          } catch (err) {
            console.error('SQL Server error on GET /api/bookings/transactions:', err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        next();
      });
    }
  };
}
