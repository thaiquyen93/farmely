// Kiểm chứng 4 bản sửa nghiệp vụ thu hoạch trên PostgreSQL thật.
// Chạy trong transaction + ROLLBACK -> không làm bẩn dữ liệu demo.
// Chạy: node server/checks/harvestLifecycle.check.mjs   (từ thư mục frontend/)
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

// Trích đúng khối SQL từ plugin để test chính xác cái đang chạy production
const plugin = fs.readFileSync(PLUGIN_PATH, 'utf8');

const BR23_SQL = plugin
  .slice(plugin.indexOf('-- BR23: Hết hạn thuê'), plugin.indexOf('-- Dọn dẹp các tác vụ rác'));

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${detail}`); }
};

const c = await pool.connect();
try {
  await c.query('BEGIN');

  // ---------- LỖ HỔNG #4: enum task_status_enum không có 'CANCELLED' ----------
  console.log('\n[#4] care_tasks không thể nhận status CANCELLED');
  try {
    await c.query("SAVEPOINT s4");
    await c.query("UPDATE care_tasks SET status = 'CANCELLED' WHERE task_id = (SELECT MIN(task_id) FROM care_tasks)");
    check('enum CANCELLED bị DB từ chối', false, '-> UPDATE lại thành công, enum đã đổi?');
    await c.query("ROLLBACK TO SAVEPOINT s4");
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT s4");
    check('enum CANCELLED bị DB từ chối (xác nhận lỗi cũ là thật)', /invalid input value for enum/.test(e.message), e.message);
  }
  // bản sửa: DELETE thay vì UPDATE 'CANCELLED'
  const delRes = await c.query("DELETE FROM care_tasks WHERE rental_id = -999 AND status <> 'DONE'::task_status_enum");
  check('DELETE ... status <> DONE chạy được', delRes.rowCount >= 0);

  // ---------- LỖ HỔNG #1: thu hoạch phải đóng task trong DB ----------
  console.log('\n[#1] POST /api/harvest đóng luôn nhiệm vụ thu hoạch');
  const r = (await c.query(
    "SELECT rental_id, plot_id, variety_id FROM rentals WHERE cultivation_mode <> 'SELF' ORDER BY rental_id DESC LIMIT 1"
  )).rows[0];
  check('tìm được rental ASSISTED để test', !!r, JSON.stringify(r));

  // dựng 1 task thu hoạch PENDING giả để quan sát
  const t = (await c.query(
    `INSERT INTO care_tasks (rental_id, due_date, status, title, notes, created_at, updated_at)
     VALUES ($1, CURRENT_DATE, 'PENDING'::task_status_enum, 'Thu hoạch & Cân thực tế', 'test', NOW(), NOW())
     RETURNING task_id`, [r.rental_id]
  )).rows[0];

  // đúng CTE trong bản sửa
  await c.query(`
WITH ins AS (
  INSERT INTO harvest_results (rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type, customer_confirmed, created_at)
  VALUES (${r.rental_id}, 8, CURRENT_DATE, 12.5, '/images/x.jpg', 'PICKUP', false, NOW())
  RETURNING harvest_id
), closed_tasks AS (
  UPDATE care_tasks ct
  SET status = 'DONE'::task_status_enum,
      evidence_image_url = COALESCE(NULLIF('/images/x.jpg', ''), ct.evidence_image_url),
      updated_at = NOW()
  WHERE ct.rental_id = ${r.rental_id}
    AND ct.status <> 'DONE'::task_status_enum
    AND (
      LOWER(COALESCE(ct.title, '')) LIKE '%thu hoạch%'
      OR ct.step_id IN (SELECT step_id FROM template_steps WHERE LOWER(step_name) LIKE '%thu hoạch%')
    )
  RETURNING ct.task_id
)
SELECT (SELECT count(*) FROM ins) ins_n, (SELECT count(*) FROM closed_tasks) closed_n;`);

  const after = (await c.query('SELECT status, evidence_image_url FROM care_tasks WHERE task_id = $1', [t.task_id])).rows[0];
  check('task thu hoạch chuyển DONE trong DB (F5 không hiện lại PENDING)', after.status === 'DONE', JSON.stringify(after));
  check('ảnh đối chứng được lưu vào care_tasks', after.evidence_image_url === '/images/x.jpg', String(after.evidence_image_url));

  // ---------- LỖ HỔNG #2: gia hạn sinh task vụ mới ----------
  console.log('\n[#2] POST /api/rentals/:id/renew sinh bộ nhiệm vụ vụ mới (BR11b)');
  const tmpl = (await c.query(
    'SELECT template_id FROM process_templates WHERE variety_id = $1 ORDER BY template_id DESC LIMIT 1', [r.variety_id]
  )).rows[0];

  if (!tmpl) {
    console.log(`  SKIP giống ${r.variety_id} chưa có process_template -> đổi sang rental có template`);
  }
  // Dựng rental SẠCH (chưa có care_tasks) để đo đúng số task vụ mới được sinh.
  // Dùng rental đang chạy sẵn sẽ trùng mốc ngày với vụ hiện tại -> guard chặn đúng nhưng test đọc sai.
  const vid2 = (await c.query(
    'SELECT pt.variety_id FROM process_templates pt JOIN template_steps ts ON ts.template_id = pt.template_id GROUP BY pt.variety_id ORDER BY pt.variety_id LIMIT 1'
  )).rows[0].variety_id;
  const cid2 = (await c.query('SELECT contract_id FROM contracts ORDER BY contract_id LIMIT 1')).rows[0].contract_id;
  const land2 = (await c.query('SELECT land_id FROM lands ORDER BY land_id LIMIT 1')).rows[0].land_id;
  const plot2 = (await c.query(
    `INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published)
     VALUES ($1,'ZZ-R1',100,1000000,'RENT',true) RETURNING plot_id`, [land2]
  )).rows[0].plot_id;
  const r2 = (await c.query(
    `INSERT INTO rentals (contract_id, plot_id, variety_id, cultivation_mode, term_months, start_date, end_date, total_price, status, staff_id)
     VALUES ($1,$2,$3,'ASSISTED',2, CURRENT_DATE, (CURRENT_DATE + INTERVAL '60 days')::date, 1000000,'ACTIVE', 8)
     RETURNING rental_id, variety_id`, [cid2, plot2, vid2]
  )).rows[0];
  check('dựng được rental sạch có quy trình VietGAP', !!r2, JSON.stringify(r2));

  const stepCount = (await c.query(`
SELECT count(*)::int n FROM template_steps
WHERE template_id = (SELECT pt.template_id FROM process_templates pt WHERE pt.variety_id = $1 ORDER BY pt.template_id DESC LIMIT 1)`,
    [r2.variety_id])).rows[0].n;

  const before2 = (await c.query('SELECT count(*)::int n FROM care_tasks WHERE rental_id = $1', [r2.rental_id])).rows[0].n;

  const renewSql = `
DO $$
DECLARE
  v_contract_id INT;
  v_new_end DATE := (CURRENT_DATE + INTERVAL '60 days')::date;
  v_variety_id INT;
  v_mode VARCHAR(20);
  v_staff_id INT;
  v_season_start DATE;
BEGIN
  SELECT contract_id INTO v_contract_id FROM rentals WHERE rental_id = ${r2.rental_id};
  IF v_contract_id IS NOT NULL THEN
    UPDATE rentals
    SET end_date = COALESCE(GREATEST(end_date, v_new_end), end_date + INTERVAL '40 days'),
        updated_at = NOW()
    WHERE rental_id = ${r2.rental_id};

    SELECT variety_id, cultivation_mode, staff_id
      INTO v_variety_id, v_mode, v_staff_id
      FROM rentals WHERE rental_id = ${r2.rental_id};

    IF COALESCE(v_mode, 'ASSISTED') <> 'SELF' THEN
      v_season_start := CURRENT_DATE + INTERVAL '4 days';

      INSERT INTO care_tasks (rental_id, step_id, task_assigned_to, due_date, status, title, notes, step_order, created_at, updated_at)
      SELECT
        ${r2.rental_id},
        ts.step_id,
        COALESCE(v_staff_id, fn_resolve_staff_for_plot((SELECT plot_id FROM rentals WHERE rental_id = ${r2.rental_id}))),
        (v_season_start + (ts.day_offset || ' days')::INTERVAL)::date,
        'PENDING'::task_status_enum,
        ts.step_name,
        COALESCE(ts.description, 'Theo quy chuẩn VietGAP'),
        ts.step_order,
        NOW(), NOW()
      FROM template_steps ts
      WHERE ts.template_id = (
        SELECT pt.template_id FROM process_templates pt
        WHERE pt.variety_id = v_variety_id ORDER BY pt.template_id DESC LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM care_tasks ct
        WHERE ct.rental_id = ${r2.rental_id} AND ct.step_id = ts.step_id
          AND ct.due_date = (v_season_start + (ts.day_offset || ' days')::INTERVAL)::date
      );
    END IF;
  END IF;
END $$;`;

  await c.query(renewSql);
  const after2 = (await c.query('SELECT count(*)::int n FROM care_tasks WHERE rental_id = $1', [r2.rental_id])).rows[0].n;
  check(`gia hạn sinh ${stepCount} nhiệm vụ vụ mới`, after2 - before2 === stepCount, `+${after2 - before2} (kỳ vọng +${stepCount})`);

  // chống sinh trùng: gọi lần 2 không được thêm nữa
  await c.query(renewSql);
  const after3 = (await c.query('SELECT count(*)::int n FROM care_tasks WHERE rental_id = $1', [r2.rental_id])).rows[0].n;
  check('gia hạn 2 lần không sinh task trùng', after3 === after2, `${before2} -> ${after2} -> ${after3}`);

  // chỉ xét các task VỪA sinh ra ở lần gia hạn này (created_at trong transaction), không lẫn task vụ cũ
  const firstDue = (await c.query(
    `SELECT MIN(due_date)::text d FROM care_tasks
     WHERE rental_id = $1 AND created_at >= NOW() - INTERVAL '5 minutes'`, [r2.rental_id]
  )).rows[0].d;
  const expect = (await c.query("SELECT (CURRENT_DATE + INTERVAL '4 days')::date::text d")).rows[0].d;
  check('vụ mới bắt đầu sau 4 ngày phơi ải (BR23)', firstDue === expect, `${firstDue} vs ${expect}`);

  // ---------- LỖ HỔNG #3: BR23 chuyển MAINT khi hết hạn tự nhiên ----------
  console.log('\n[#3] BR23 tự động MAINT 4 ngày rồi mở lại AVAIL');
  const vid = (await c.query('SELECT variety_id FROM varieties ORDER BY variety_id LIMIT 1')).rows[0].variety_id;
  const cid = (await c.query('SELECT contract_id FROM contracts ORDER BY contract_id LIMIT 1')).rows[0].contract_id;
  const land = (await c.query('SELECT land_id FROM lands ORDER BY land_id LIMIT 1')).rows[0].land_id;

  const mk = async (code, endOffset) => {
    const p = (await c.query(
      `INSERT INTO plots (land_id, plot_code, area, price_per_period, status, is_published)
       VALUES ($1,$2,100,1000000,'RENT',true) RETURNING plot_id`, [land, code]
    )).rows[0].plot_id;
    await c.query(
      `INSERT INTO rentals (contract_id, plot_id, variety_id, cultivation_mode, term_months, start_date, end_date, total_price, status)
       VALUES ($1,$2,$3,'ASSISTED',2, CURRENT_DATE - INTERVAL '90 days', (CURRENT_DATE + ($4 || ' days')::INTERVAL)::date, 1000000,'ACTIVE')`,
      [cid, p, vid, String(endOffset)]
    );
    return p;
  };

  const pFresh = await mk('ZZ-T1', -1);   // vừa hết hạn hôm qua -> phải MAINT
  const pOld = await mk('ZZ-T2', -10);    // hết hạn 10 ngày trước -> đã qua phơi ải -> AVAIL
  const pLive = await mk('ZZ-T3', 30);    // còn hiệu lực -> giữ RENT

  await c.query(BR23_SQL);

  const st = async (id) => (await c.query('SELECT status, is_published FROM plots WHERE plot_id = $1', [id])).rows[0];
  const sFresh = await st(pFresh), sOld = await st(pOld), sLive = await st(pLive);

  check('thửa vừa hết hạn -> MAINT (phơi ải 4 ngày)', sFresh.status === 'MAINT', JSON.stringify(sFresh));
  check('thửa MAINT bị ẩn khỏi marketplace', sFresh.is_published === false, JSON.stringify(sFresh));
  check('thửa hết hạn >4 ngày -> mở lại AVAIL', sOld.status === 'AVAIL', JSON.stringify(sOld));
  check('thửa còn hợp đồng -> giữ RENT', sLive.status === 'RENT', JSON.stringify(sLive));

  const rFresh = (await c.query(
    'SELECT status FROM rentals WHERE plot_id = $1', [pFresh]
  )).rows[0].status;
  check('rental quá hạn chuyển DONE (không còn ACTIVE vĩnh viễn)', rFresh === 'DONE', rFresh);

  await c.query('ROLLBACK');
  console.log(`\nROLLBACK xong - dữ liệu demo nguyên vẹn.\nKẾT QUẢ: ${pass} pass / ${fail} fail`);
} catch (e) {
  await c.query('ROLLBACK');
  console.log('\nERR', e.message);
  fail++;
} finally {
  c.release();
  await pool.end();
}
process.exit(fail > 0 ? 1 : 0);
