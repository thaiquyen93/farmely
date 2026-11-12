const seasonPattern = /^[a-zA-Z0-9:_-]{1,100}$/;

export function normalizeSeasonKey(value, rentalId) {
  const key = String(value || `rental-${rentalId}`);
  if (!seasonPattern.test(key)) throw new Error('Mã vụ không hợp lệ');
  return key;
}

let schemaPromise;
export async function ensureHarvestDemoSchema(pool) {
  if (schemaPromise) return schemaPromise;
  schemaPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS demo_cultivation_state (
      rental_id integer NOT NULL REFERENCES rentals(rental_id),
      season_key varchar(100) NOT NULL,
      current_day integer NOT NULL DEFAULT 1,
      total_days integer NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (rental_id, season_key)
    );
    ALTER TABLE care_tasks ADD COLUMN IF NOT EXISTS demo_completed boolean NOT NULL DEFAULT false;
    ALTER TABLE harvest_results ADD COLUMN IF NOT EXISTS season_key varchar(100);
    ALTER TABLE harvest_results ADD COLUMN IF NOT EXISTS harvest_task_id integer;
    ALTER TABLE farm_diaries ADD COLUMN IF NOT EXISTS harvest_id integer;
    CREATE UNIQUE INDEX IF NOT EXISTS harvest_results_one_per_task
      ON harvest_results(rental_id, season_key, harvest_task_id)
      WHERE harvest_task_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS farm_diaries_one_per_harvest
      ON farm_diaries(harvest_id) WHERE harvest_id IS NOT NULL;
  `).catch((error) => { schemaPromise = undefined; throw error; });
  return schemaPromise;
}

let lastSyncAt = 0;
export async function syncPlotMaintenanceStatuses(pool, { force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastSyncAt < 15000) return;
  lastSyncAt = now;
  await ensureHarvestDemoSchema(pool);
  await pool.query(`
    UPDATE rentals
    SET status = 'DONE', updated_at = NOW()
    WHERE status = 'ACTIVE' AND end_date < CURRENT_DATE;

    UPDATE plots p
    SET status = 'MAINT', is_published = false, updated_at = NOW()
    WHERE p.status = 'RENT'
      AND (
        (
          NOT EXISTS (SELECT 1 FROM rentals r WHERE r.plot_id = p.plot_id AND r.status = 'ACTIVE')
          AND EXISTS (
            SELECT 1 FROM rentals r
            WHERE r.plot_id = p.plot_id AND r.end_date >= CURRENT_DATE - INTERVAL '4 days'
          )
        )
        OR EXISTS (
          SELECT 1
          FROM rentals r
          JOIN harvest_results hr ON hr.rental_id = r.rental_id
          WHERE r.plot_id = p.plot_id
            AND r.status = 'ACTIVE'
            AND hr.harvest_date >= CURRENT_DATE - INTERVAL '4 days'
            AND hr.harvest_date <= CURRENT_DATE + INTERVAL '1 day'
            AND NOT EXISTS (
              SELECT 1 FROM demo_cultivation_state ds
              WHERE ds.rental_id = r.rental_id
                AND ds.is_active
                AND ds.current_day = 1
                AND ds.updated_at > hr.created_at
            )
        )
      );

    UPDATE plots p
    SET status = 'AVAIL', updated_at = NOW()
    WHERE p.status IN ('RENT', 'MAINT')
      AND NOT EXISTS (SELECT 1 FROM rentals r WHERE r.plot_id = p.plot_id AND r.status = 'ACTIVE')
      AND EXISTS (
        SELECT 1 FROM rentals r
        WHERE r.plot_id = p.plot_id
          AND r.end_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '4 days'
      );
  `);
}

export async function getDemoTime(pool, rentalId) {
  await ensureHarvestDemoSchema(pool);
  const { rows } = await pool.query(`
    SELECT ds.season_key AS "seasonKey", ds.current_day AS "currentDay",
      ds.total_days AS "totalDays", ds.updated_at AS "updatedAt"
    FROM demo_cultivation_state ds
    WHERE ds.rental_id = $1 AND ds.is_active
    ORDER BY ds.updated_at DESC LIMIT 1
  `, [rentalId]);
  return rows[0] || null;
}

export async function simulateDemoTime(pool, rentalId, payload) {
  await ensureHarvestDemoSchema(pool);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rental = (await client.query(`
      SELECT r.rental_id, r.start_date, COALESCE(v.expected_duration, 45) AS total_days
      FROM rentals r LEFT JOIN varieties v ON v.variety_id = r.variety_id
      WHERE r.rental_id = $1 FOR UPDATE OF r
    `, [rentalId])).rows[0];
    if (!rental) throw new Error('Không tìm thấy lượt thuê');
    const prior = (await client.query(`
      SELECT season_key, current_day FROM demo_cultivation_state
      WHERE rental_id = $1 AND is_active ORDER BY updated_at DESC LIMIT 1
    `, [rentalId])).rows[0];
    const seasonKey = normalizeSeasonKey(payload.seasonKey || prior?.season_key, rentalId);
    const totalDays = Number(rental.total_days);
    const action = String(payload.action || 'START_NOW').toUpperCase();
    const day = action === 'HARVEST' ? totalDays
      : action === 'START_NOW' || action === 'RESET' ? 1
        : action === 'SET_DAY' ? Number(payload.day)
          : action === 'ADD_DAYS' ? Math.min(totalDays, Number(prior?.current_day || 1) + Number(payload.days || 0)) : NaN;
    if (!Number.isInteger(day) || day < 1 || day > totalDays) throw new Error('Ngày demo không hợp lệ');

    await client.query(`
      UPDATE rentals
      SET start_date = (CURRENT_DATE - ($2::int - 1))::date
      WHERE rental_id = $1
    `, [rentalId, day]);

    if (action === 'START_NOW' || action === 'RESET') {
      await client.query(`
        UPDATE plots p
        SET status = 'RENT', updated_at = now()
        FROM rentals r
        WHERE r.rental_id = $1 AND p.plot_id = r.plot_id AND p.status = 'MAINT'
      `, [rentalId]);
    }

    await client.query('UPDATE demo_cultivation_state SET is_active = false WHERE rental_id = $1', [rentalId]);
    await client.query(`
      INSERT INTO demo_cultivation_state(rental_id, season_key, current_day, total_days, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (rental_id, season_key) DO UPDATE
      SET current_day = EXCLUDED.current_day, total_days = EXCLUDED.total_days,
          is_active = true, updated_at = now()
    `, [rentalId, seasonKey, day, totalDays]);

    await client.query(`
      UPDATE care_tasks ct
      SET due_date = CASE
            WHEN (
              COALESCE(ts.task_type, '') = 'HARVEST'
              OR (
                COALESCE(ts.step_name, ct.title, '') ~* 'thu hoạch|nghiệm thu'
                AND COALESCE(ts.step_name, ct.title, '') !~* 'trước thu hoạch|chuẩn bị'
              )
            ) THEN CASE
              WHEN $2::int >= $3::int THEN CURRENT_DATE
              ELSE ((CURRENT_DATE - ($2::int - 1)) + COALESCE(ts.day_offset, GREATEST(0, $3::int - 1)))::date
            END
            WHEN ts.day_offset IS NOT NULL
              THEN ((CURRENT_DATE - ($2::int - 1)) + ts.day_offset)::date
            WHEN $4::text IN ('START_NOW', 'RESET') AND ct.due_date > CURRENT_DATE
              THEN CURRENT_DATE
            ELSE ct.due_date
          END,
          status = CASE
            WHEN (
              COALESCE(ts.task_type, '') = 'HARVEST'
              OR (
                COALESCE(ts.step_name, ct.title, '') ~* 'thu hoạch|nghiệm thu'
                AND COALESCE(ts.step_name, ct.title, '') !~* 'trước thu hoạch|chuẩn bị'
              )
            ) AND ct.status <> 'DONE'::task_status_enum THEN CASE
              WHEN $2::int >= $3::int THEN 'IN_PROG'::task_status_enum
              ELSE 'PENDING'::task_status_enum
            END
            ELSE ct.status
          END,
          demo_completed = false,
          updated_at = now()
      FROM (
        SELECT ct_in.task_id, ts_in.task_type, ts_in.step_name, ts_in.day_offset
        FROM care_tasks ct_in
        LEFT JOIN template_steps ts_in ON ts_in.step_id = ct_in.step_id
        WHERE ct_in.rental_id = $1
      ) ts
      WHERE ct.task_id = ts.task_id
    `, [rentalId, day, totalDays, action]);

    const startRow = (await client.query(
      `SELECT to_char((CURRENT_DATE - ($1::int - 1))::date, 'YYYY-MM-DD') AS "startDate"`,
      [day]
    )).rows[0];

    await client.query('COMMIT');
    return { rentalId, seasonKey, currentDay: day, totalDays, startDate: startRow?.startDate || null };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function recordHarvestOnce(pool, payload) {
  await ensureHarvestDemoSchema(pool);
  const rentalId = Number(payload.rentalId);
  const taskId = Number(payload.taskId);
  const enteredBy = Number(payload.enteredBy);
  const yieldAmount = Number(payload.yieldAmount);
  if (![rentalId, taskId, enteredBy].every((value) => Number.isInteger(value) && value > 0)
    || !Number.isFinite(yieldAmount) || yieldAmount <= 0 || !payload.evidenceImageUrl) {
    throw new Error('Thiếu lượt thuê, task thu hoạch, nhân viên, ảnh hoặc số cân hợp lệ');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const task = (await client.query(`
      SELECT ct.task_id, ct.rental_id FROM care_tasks ct
      LEFT JOIN template_steps ts ON ts.step_id = ct.step_id
      WHERE ct.task_id = $1 AND ct.rental_id = $2
        AND (ts.task_type = 'HARVEST' OR (ct.step_id IS NULL AND COALESCE(ct.title, '') ILIKE '%thu hoạch%'))
    `, [taskId, rentalId])).rows[0];
    if (!task) throw new Error('Task thu hoạch không thuộc lượt thuê này');
    const active = (await client.query(`
      SELECT season_key FROM demo_cultivation_state
      WHERE rental_id = $1 AND is_active ORDER BY updated_at DESC LIMIT 1
    `, [rentalId])).rows[0];
    const seasonKey = active?.season_key || normalizeSeasonKey(null, rentalId);
    if (payload.seasonKey && payload.seasonKey !== seasonKey) throw new Error('Vụ thu hoạch đã thay đổi, vui lòng tải lại task');
    const result = await client.query(`
      INSERT INTO harvest_results
        (rental_id, entered_by, harvest_date, yield_amount, evidence_image_url,
         delivery_type, customer_confirmed, season_key, harvest_task_id, created_at)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, 'PICKUP', false, $5, $6, now())
      ON CONFLICT (rental_id, season_key, harvest_task_id) WHERE harvest_task_id IS NOT NULL
      DO UPDATE SET yield_amount = harvest_results.yield_amount
      RETURNING harvest_id AS "harvestId", rental_id AS "rentalId", season_key AS "seasonKey",
        harvest_task_id AS "taskId", yield_amount AS "yieldAmount",
        evidence_image_url AS "evidenceImageUrl", created_at AS "createdAt",
        (xmax = 0) AS "created"
    `, [rentalId, enteredBy, yieldAmount, payload.evidenceImageUrl, seasonKey, taskId]);
    const saved = result.rows[0];
    if (saved.created) {
      await client.query(`
        UPDATE care_tasks SET status = 'DONE'::task_status_enum, demo_completed = false,
          evidence_image_url = $2, updated_at = now()
        WHERE task_id = $1
      `, [taskId, payload.evidenceImageUrl]);
      await client.query(`
        INSERT INTO farm_diaries(rental_id, task_id, harvest_id, title, content, image_url, created_at)
        VALUES ($1, $2, $3, 'Thu hoạch', $4, $5, now())
        ON CONFLICT (harvest_id) WHERE harvest_id IS NOT NULL DO NOTHING
      `, [rentalId, taskId, saved.harvestId, `Sản lượng cân điện tử: ${saved.yieldAmount} kg.`, payload.evidenceImageUrl]);
    }
    await client.query(`
      UPDATE plots p
      SET status = 'MAINT', is_published = false, updated_at = now()
      FROM rentals r
      WHERE r.rental_id = $1 AND p.plot_id = r.plot_id
    `, [rentalId]);
    await client.query('COMMIT');
    return { ...saved, harvestCode: `HRV-${saved.harvestId}`, alreadyRecorded: !saved.created };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
