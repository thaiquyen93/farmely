// Kiểm chứng luồng Admin duyệt thanh lý hợp đồng (POST /api/contracts/cancellations/:id/approve)
// trên PostgreSQL thật. Chạy trong transaction + ROLLBACK -> không làm bẩn dữ liệu demo.
// Chạy: node server/checks/contractCancellation.check.mjs   (từ thư mục frontend/)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const PLUGIN_PATH = path.resolve(__dirname, '../siteVisitsApiPlugin.js');

const env = {};
for (const p of [path.join(REPO, '.env'), path.join(REPO, 'frontend/.env')]) {
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
}

const pool = new pg.Pool({
  host: process.env.DB_HOST || env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || env.DB_PORT || '5433', 10),
  database: process.env.DB_NAME || env.DB_NAME || 'farmely',
  user: process.env.DB_USER || env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || env.DB_PASSWORD || env.DB_PASS || 'postgres'
});

// Trích ĐÚNG khối SQL đang chạy production từ plugin -> test cái thật, không phải bản copy
const plugin = fs.readFileSync(PLUGIN_PATH, 'utf8');
const APPROVE_TPL = (() => {
  const start = plugin.indexOf('            const approveSql = `');
  const open = plugin.indexOf('`', start + 30) + 1;
  const close = plugin.indexOf('\n`;', open);
  return plugin.slice(open, close);
})();
if (!APPROVE_TPL.includes('contract_cancellations')) {
  console.log('FAIL không trích được approveSql từ plugin');
  process.exit(1);
}
const approveSqlFor = (id) => APPROVE_TPL.replace(/\$\{cancellationId\}/g, String(id));

let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${detail}`); }
};

const c = await pool.connect();
try {
  await c.query('BEGIN');

  // ---- Dựng hợp đồng + 2 thửa đất + yêu cầu hủy PENDING, khách gửi khi còn 10 ngày tới vụ ----
  const land = (await c.query('SELECT land_id FROM lands ORDER BY land_id LIMIT 1')).rows[0].land_id;
  const vid = (await c.query('SELECT variety_id FROM varieties ORDER BY variety_id LIMIT 1')).rows[0].variety_id;
  const uid = (await c.query('SELECT user_id FROM users ORDER BY user_id LIMIT 1')).rows[0].user_id;

  const cid = (await c.query(
    `INSERT INTO contracts (renter_id, contract_number, total_amount, status, created_at, updated_at)
     VALUES ($1, 'ZZ-CHK-' || floor(random()*1000000)::text, 10000000, 'ACTIVE', NOW(), NOW())
     RETURNING contract_id`, [uid]
  )).rows[0].contract_id;

  const plotIds = [];
  for (const code of ['ZZ-C1', 'ZZ-C2']) {
    const p = (await c.query(
      `INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published)
       VALUES ($1, $2, 100, 5000000, 'RENT', true) RETURNING plot_id`, [land, code]
    )).rows[0].plot_id;
    plotIds.push(p);
    await c.query(
      `INSERT INTO rentals (contract_id, plot_id, variety_id, cultivation_mode, term_months,
                            start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, 'ASSISTED', 2, CURRENT_DATE + INTERVAL '10 days',
               CURRENT_DATE + INTERVAL '70 days', 5000000, 'ACTIVE')`, [cid, p, vid]
    );
  }

  const rentalIds = (await c.query('SELECT rental_id FROM rentals WHERE contract_id = $1', [cid])).rows.map(r => r.rental_id);
  // task chưa làm + task đã làm -> kiểm tra chỉ xoá cái chưa làm
  await c.query(
    `INSERT INTO care_tasks (rental_id, due_date, status, title, created_at, updated_at)
     VALUES ($1, CURRENT_DATE, 'PENDING'::task_status_enum, 'Làm đất & Bón lót', NOW(), NOW()),
            ($1, CURRENT_DATE, 'DONE'::task_status_enum, 'Khảo sát thổ nhưỡng', NOW(), NOW())`,
    [rentalIds[0]]
  );

  const cancelId = (await c.query(
    `INSERT INTO contract_cancellations (contract_id, cancelled_by, reason, status, created_at)
     VALUES ($1, $2, 'Test duyệt thanh lý', 'PENDING', NOW()) RETURNING cancellation_id`, [cid, uid]
  )).rows[0].cancellation_id;

  // Số tiền hoàn mà Admin THẤY ở danh sách chờ duyệt (GET /api/contracts/cancellations)
  const shown = (await c.query(`
SELECT ROUND(COALESCE(c.total_amount,0) * (
  CASE WHEN d.start_date - cn.created_at::date >= 3 THEN 0.8
       WHEN d.start_date > cn.created_at::date THEN 0.5 ELSE 0 END), 2) amt
FROM contract_cancellations cn
JOIN contracts c ON c.contract_id = cn.contract_id
LEFT JOIN LATERAL (SELECT MIN(start_date) start_date FROM rentals WHERE contract_id = cn.contract_id) d ON true
WHERE cn.cancellation_id = $1`, [cancelId])).rows[0].amt;

  // ---- Chạy ĐÚNG block duyệt của production ----
  console.log('\n[Admin duyệt thanh lý hợp đồng]');
  try {
    await c.query(approveSqlFor(cancelId));
    check('block DO $$ duyệt thanh lý chạy không lỗi', true);
  } catch (e) {
    check('block DO $$ duyệt thanh lý chạy không lỗi', false, e.message);
    throw e;
  }

  const cn = (await c.query('SELECT status, processed_at FROM contract_cancellations WHERE cancellation_id = $1', [cancelId])).rows[0];
  check('yêu cầu hủy -> APPROVED', cn.status === 'APPROVED', JSON.stringify(cn));
  check('ghi mốc processed_at', !!cn.processed_at, String(cn.processed_at));

  const ct = (await c.query('SELECT status FROM contracts WHERE contract_id = $1', [cid])).rows[0];
  check('hợp đồng -> CANCELLED', ct.status === 'CANCELLED', JSON.stringify(ct));

  const rs = (await c.query('SELECT DISTINCT status FROM rentals WHERE contract_id = $1', [cid])).rows.map(r => r.status);
  check('mọi lượt thuê -> CANCELLED', rs.length === 1 && rs[0] === 'CANCELLED', JSON.stringify(rs));

  const ps = (await c.query('SELECT status, is_published FROM plots WHERE plot_id = ANY($1)', [plotIds])).rows;
  check('mọi thửa -> MAINT (phơi ải 4 ngày BR23)', ps.every(p => p.status === 'MAINT'), JSON.stringify(ps));
  check('thửa MAINT bị ẩn khỏi marketplace', ps.every(p => p.is_published === false), JSON.stringify(ps));

  const tasks = (await c.query('SELECT status FROM care_tasks WHERE rental_id = ANY($1)', [rentalIds])).rows.map(r => r.status);
  check('xoá task chưa làm, GIỮ lịch sử task đã DONE', tasks.length === 1 && tasks[0] === 'DONE', JSON.stringify(tasks));

  // ---- Bút toán hoàn tiền ----
  const tx = (await c.query(
    `SELECT type, amount, status, contract_id FROM payment_transactions
     WHERE cancellation_request_id = $1`, [cancelId]
  )).rows;
  check('ghi 1 bút toán REFUND vào payment_transactions', tx.length === 1 && tx[0].type === 'REFUND', JSON.stringify(tx));
  check('số tiền hoàn khớp con số Admin đã thấy khi duyệt',
    tx.length === 1 && Number(tx[0].amount) === Number(shown), `ghi ${tx[0]?.amount} vs hiển thị ${shown}`);
  check('bút toán gắn đúng hợp đồng', tx.length === 1 && tx[0].contract_id === cid, JSON.stringify(tx));
  check('hoàn 80% khi hủy trước vụ >= 3 ngày', Number(shown) === 8000000, `shown=${shown}`);

  // ---- Idempotent: Admin bấm duyệt 2 lần ----
  console.log('\n[Bấm duyệt lần 2 trên cùng yêu cầu]');
  let secondErr = '';
  // RAISE EXCEPTION abort cả transaction -> phải bọc SAVEPOINT để tiếp tục kiểm tra
  await c.query('SAVEPOINT sp_second');
  try { await c.query(approveSqlFor(cancelId)); await c.query('RELEASE SAVEPOINT sp_second'); }
  catch (e) { secondErr = e.message; await c.query('ROLLBACK TO SAVEPOINT sp_second'); }
  check('lần 2 bị từ chối (đã xử lý)', /đã xử lý|không tồn tại/.test(secondErr), secondErr || '-> không báo lỗi');
  const tx2 = (await c.query('SELECT count(*)::int n FROM payment_transactions WHERE cancellation_request_id = $1', [cancelId])).rows[0].n;
  check('không hoàn tiền 2 lần', tx2 === 1, `có ${tx2} bút toán REFUND`);

  // ---- Hủy sát ngày: 0% hoàn tiền, không sinh bút toán rác ----
  console.log('\n[Khách hủy khi đã qua ngày xuống giống -> 0%]');
  const cid0 = (await c.query(
    `INSERT INTO contracts (renter_id, contract_number, total_amount, status, created_at, updated_at)
     VALUES ($1, 'ZZ-CHK0-' || floor(random()*1000000)::text, 9000000, 'ACTIVE', NOW(), NOW())
     RETURNING contract_id`, [uid]
  )).rows[0].contract_id;
  const p0 = (await c.query(
    `INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published)
     VALUES ($1,'ZZ-C3',100,9000000,'RENT',true) RETURNING plot_id`, [land]
  )).rows[0].plot_id;
  await c.query(
    `INSERT INTO rentals (contract_id, plot_id, variety_id, cultivation_mode, term_months,
                          start_date, end_date, total_price, status)
     VALUES ($1,$2,$3,'ASSISTED',2, CURRENT_DATE - INTERVAL '5 days',
             CURRENT_DATE + INTERVAL '55 days', 9000000,'ACTIVE')`, [cid0, p0, vid]
  );
  const cancel0 = (await c.query(
    `INSERT INTO contract_cancellations (contract_id, cancelled_by, reason, status, created_at)
     VALUES ($1,$2,'Hủy muộn','PENDING', NOW()) RETURNING cancellation_id`, [cid0, uid]
  )).rows[0].cancellation_id;

  await c.query(approveSqlFor(cancel0));
  const st0 = (await c.query('SELECT status FROM contract_cancellations WHERE cancellation_id=$1', [cancel0])).rows[0].status;
  check('vẫn duyệt được dù không hoàn tiền', st0 === 'APPROVED', st0);
  const tx0 = (await c.query('SELECT count(*)::int n FROM payment_transactions WHERE cancellation_request_id=$1', [cancel0])).rows[0].n;
  check('không sinh bút toán REFUND 0 đồng', tx0 === 0, `có ${tx0} bút toán`);
  const ps0 = (await c.query('SELECT status FROM plots WHERE plot_id=$1', [p0])).rows[0].status;
  check('thửa vẫn chuyển MAINT', ps0 === 'MAINT', ps0);

  // ---- Yêu cầu không tồn tại ----
  console.log('\n[Duyệt yêu cầu không tồn tại]');
  let e404 = '';
  await c.query('SAVEPOINT sp_404');
  try { await c.query(approveSqlFor(999999)); await c.query('RELEASE SAVEPOINT sp_404'); }
  catch (e) { e404 = e.message; await c.query('ROLLBACK TO SAVEPOINT sp_404'); }
  check('báo lỗi rõ ràng thay vì âm thầm bỏ qua', /không tồn tại|đã xử lý/.test(e404), e404 || '-> không báo lỗi');

  await c.query('ROLLBACK');
  console.log(`\nROLLBACK xong - dữ liệu demo nguyên vẹn.\nKẾT QUẢ: ${pass} pass / ${fail} fail`);
} catch (e) {
  try { await c.query('ROLLBACK'); } catch {}
  console.log('\nERR', e.message);
  console.log(`KẾT QUẢ: ${pass} pass / ${fail + 1} fail`);
  fail++;
} finally {
  c.release();
  await pool.end();
}
process.exit(fail > 0 ? 1 : 0);
