import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { getDemoTime, recordHarvestOnce, simulateDemoTime } from './harvestDemoApi.js';

test('harvest demo: concurrent retry, distinct same-day tasks, day replay and persisted state', {
  skip: !process.env.HARVEST_TEST_DATABASE_URL
}, async () => {
  const admin = new pg.Pool({ connectionString: process.env.HARVEST_TEST_DATABASE_URL });
  const schema = `harvest_flow_test_${process.pid}`;
  let pool;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new pg.Pool({ connectionString: process.env.HARVEST_TEST_DATABASE_URL, options: `-c search_path=${schema}`, max: 4 });
    await pool.query(`
      CREATE TYPE task_status_enum AS ENUM ('PENDING', 'IN_PROG', 'DONE');
      CREATE TABLE varieties(variety_id integer PRIMARY KEY, expected_duration integer);
      CREATE TABLE rentals(rental_id integer PRIMARY KEY, variety_id integer, start_date date);
      CREATE TABLE template_steps(step_id integer PRIMARY KEY, task_type text, step_name text, day_offset integer);
      CREATE TABLE care_tasks(task_id integer PRIMARY KEY, rental_id integer, step_id integer,
        title text, due_date date, status task_status_enum, evidence_image_url text, updated_at timestamptz);
      CREATE TABLE harvest_results(harvest_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        rental_id integer, entered_by integer, harvest_date date, yield_amount numeric,
        evidence_image_url text, delivery_type text, customer_confirmed boolean, created_at timestamptz);
      CREATE TABLE farm_diaries(diary_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        rental_id integer, task_id integer, title text, content text, image_url text, created_at timestamptz);
      INSERT INTO varieties VALUES (1, 80);
      INSERT INTO rentals VALUES (1, 1, CURRENT_DATE);
      INSERT INTO template_steps VALUES
        (1, 'CARE', 'Ngày đầu', 0), (2, 'CARE', 'Trước thu hoạch', 78),
        (3, 'HARVEST', 'Thu hoạch đợt A', 79), (4, 'HARVEST', 'Thu hoạch đợt B', 79);
      INSERT INTO care_tasks(task_id, rental_id, step_id, title, due_date, status) VALUES
        (101, 1, 1, 'Ngày đầu', CURRENT_DATE, 'PENDING'),
        (102, 1, 2, 'Trước thu hoạch', CURRENT_DATE + 78, 'PENDING'),
        (103, 1, 3, 'Thu hoạch đợt A', CURRENT_DATE + 79, 'PENDING'),
        (104, 1, 4, 'Thu hoạch đợt B', CURRENT_DATE + 79, 'PENDING');
    `);

    const dayOne = await simulateDemoTime(pool, 1, { action: 'START_NOW', seasonKey: 'SEASON-1' });
    assert.equal(dayOne.currentDay, 1);
    const harvestDay = await simulateDemoTime(pool, 1, { action: 'HARVEST', seasonKey: 'SEASON-1' });
    assert.equal(harvestDay.currentDay, 80);
    const flags = (await pool.query('SELECT task_id, demo_completed FROM care_tasks ORDER BY task_id')).rows;
    assert.deepEqual(flags.map((row) => row.demo_completed), [true, true, false, false]);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM harvest_results')).rows[0].n, 0);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM farm_diaries')).rows[0].n, 0);

    await assert.rejects(recordHarvestOnce(pool, { rentalId: 1, seasonKey: 'SEASON-1',
      taskId: 102, enteredBy: 8, yieldAmount: 12.5, evidenceImageUrl: 'photo' }),
    /Task thu hoạch không thuộc lượt thuê này/);

    const firstPayload = { rentalId: 1, seasonKey: 'SEASON-1', taskId: 103, enteredBy: 8,
      yieldAmount: 12.5, evidenceImageUrl: 'data:image/png;base64,real-photo' };
    const [first, retry] = await Promise.all([recordHarvestOnce(pool, firstPayload), recordHarvestOnce(pool, firstPayload)]);
    assert.equal(first.harvestId, retry.harvestId);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM harvest_results')).rows[0].n, 1);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM farm_diaries')).rows[0].n, 1);

    const second = await recordHarvestOnce(pool, { ...firstPayload, taskId: 104, yieldAmount: 7 });
    assert.notEqual(second.harvestId, first.harvestId);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM harvest_results')).rows[0].n, 2);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM farm_diaries')).rows[0].n, 2);

    const newConnection = new pg.Pool({ connectionString: process.env.HARVEST_TEST_DATABASE_URL, options: `-c search_path=${schema}` });
    try {
      assert.equal((await getDemoTime(newConnection, 1)).currentDay, 80);
      await simulateDemoTime(newConnection, 1, { action: 'START_NOW', seasonKey: 'SEASON-1' });
      assert.equal((await getDemoTime(pool, 1)).currentDay, 1);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM harvest_results')).rows[0].n, 2);
    } finally {
      await newConnection.end();
    }
  } finally {
    if (pool) await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
