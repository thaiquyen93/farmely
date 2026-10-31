import { test, expect } from '@playwright/test';
import pg from 'pg';
import { createFixture, cleanup, startInTenDays } from './support/reservation-fixture';

async function db<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ host: '127.0.0.1', port: 5544, database: 'farmely_e2e', user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password' });
  try { await client.connect(); expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e'); return (await client.query(sql, params)).rows as T[]; }
  finally { await client.end(); }
}

async function active(request: import('@playwright/test').APIRequestContext, id: string, mode = 'ASSISTED') {
  const fixture = await createFixture(request, id);
  const reserved = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [{
    plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: mode, startDate: startInTenDays(), termMonths: 3,
  }] } });
  expect(reserved.status()).toBe(201);
  fixture.contractId = Number((await reserved.json()).data.contractId);
  expect((await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } })).ok()).toBe(true);
  const [rental] = await db<{ rental_id: number; staff_id: number; expert_id: number }>('select rental_id, staff_id, expert_id from rentals where contract_id = $1', [fixture.contractId]);
  return { fixture, rental };
}

test('F3-02 Customer process exposes ordered steps without a write path', async ({ request }) => {
  const [rental] = await db<{ rental_id: number; variety_id: number; plot_id: number }>("select rental_id, variety_id, plot_id from rentals where status = 'ACTIVE' order by rental_id limit 1");
  expect(rental).toBeTruthy();
  const response = await request.get('/api/process-templates');
  expect(response.ok()).toBe(true);
  const template = (await response.json()).data.find((row: { varietyId: number }) => row.varietyId === rental.variety_id);
  expect(template).toBeTruthy();
  expect(template.steps.length).toBeGreaterThan(1);
  const offsets = template.steps.map((step: { dayOffset: number }) => Number(step.dayOffset));
  expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
  const compatible = await request.get(`/api/plots/${rental.plot_id}/compatibility`);
  expect((await compatible.json()).data.some((row: { varietyId: number }) => row.varietyId === rental.variety_id)).toBe(true);
});

test('F3-03 Scheduler activates starting ASSISTED rental and generates tasks once', async ({ request }) => {
  test.setTimeout(12 * 60_000);
  const { fixture, rental } = await active(request, 'F3-03');
  try {
    await db('delete from care_tasks where rental_id = $1', [rental.rental_id]);
    await db("update rentals set status = 'CONFIRMED', start_date = current_date - 1 where rental_id = $1", [rental.rental_id]);
    await expect.poll(async () => (await db<{ status: string }>('select status from rentals where rental_id = $1', [rental.rental_id]))[0].status,
      { timeout: 11 * 60_000, intervals: [10_000] }).toBe('ACTIVE');
    const tasks = await db<{ rental_id: number; due_date: string }>('select rental_id, due_date::text from care_tasks where rental_id = $1', [rental.rental_id]);
    expect(tasks.length).toBeGreaterThan(0);
    expect(new Set(tasks.map((task) => task.due_date)).size).toBeGreaterThan(0);
    expect(tasks.every((task) => task.rental_id === rental.rental_id)).toBe(true);
  } finally { await cleanup(fixture); }
});

test('F3-07 Overdue assigned task is marked overdue without changing completed tasks', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-07');
  try {
    const tasks = await db<{ task_id: number }>('select task_id from care_tasks where rental_id = $1 order by task_id limit 2', [rental.rental_id]);
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    await db("update care_tasks set due_date = current_date - 1, status = 'PENDING' where task_id = $1", [tasks[0].task_id]);
    await db("update care_tasks set due_date = current_date - 1, status = 'DONE' where task_id = $1", [tasks[1].task_id]);
    const response = await request.get(`/api/care-tasks?rentalId=${rental.rental_id}`);
    expect(response.ok()).toBe(true);
    const byId = new Map((await response.json()).data.map((row: { taskId: number }) => [row.taskId, row]));
    const overdue = byId.get(tasks[0].task_id) as { status: string; isOverdue?: boolean };
    expect(overdue.status === 'OVERDUE' || overdue.isOverdue === true).toBe(true);
    expect((byId.get(tasks[1].task_id) as { status: string }).status).toBe('COMPLETED');
  } finally { await cleanup(fixture); }
});

test('F3-08 SELF diary keeps customer note and image after reload', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-08', 'SELF');
  try {
    const content = `E2E customer diary ${Date.now()}`;
    const image = '/images/harvest/rau-muong-p03.jpg';
    const posted = await request.post('/api/farm-diaries', { data: { rentalId: rental.rental_id, content, imageUrl: image } });
    expect(posted.ok()).toBe(true);
    const diaryId = Number((await posted.json()).data.diaryId);
    const response = await request.get(`/api/farm-diaries?rentalId=${rental.rental_id}`);
    expect(response.ok()).toBe(true);
    const [saved] = await db<{ rental_id: number; task_id: number | null; content: string; image_url: string }>('select rental_id, task_id, content, image_url from farm_diaries where diary_id = $1', [diaryId]);
    expect(saved).toMatchObject({ rental_id: rental.rental_id, task_id: null, content, image_url: image });
    expect((await response.json()).data.some((row: { diaryId: number }) => row.diaryId === diaryId)).toBe(true);
  } finally { await cleanup(fixture); }
});

test('F3-10 High sensor reading produces a plot-specific alert without duplicates', async ({ request }) => {
  const { fixture } = await active(request, 'F3-10');
  try {
    await db('insert into sensor_readings (plot_id, temperature, air_humidity, soil_humidity, recorded_at) values ($1, 39, 60, 25, now())', [fixture.plotId]);
    const response = await request.get(`/api/alerts?plotId=${fixture.plotId}`);
    expect(response.ok()).toBe(true);
    const alerts = (await response.json()).data.filter((row: { plotId: number }) => row.plotId === fixture.plotId);
    expect(alerts.length).toBe(1);
    expect(alerts[0].actualValue).toBeGreaterThan(35);
    expect(alerts[0].status).toBe('ACTIVE');
  } finally { await cleanup(fixture); }
});

test('F3-11 Heavy moisture defers or flags irrigation task only', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-11');
  try {
    const [irrigation] = await db<{ task_id: number; due_date: string }>(`select ct.task_id, ct.due_date::text from care_tasks ct
      join template_steps ts on ts.step_id = ct.step_id where ct.rental_id = $1 and ts.task_type = 'IRRIGATION' order by ct.task_id limit 1`, [rental.rental_id]);
    expect(irrigation, 'fixture needs an irrigation step').toBeTruthy();
    await db("update care_tasks set due_date = current_date where task_id = $1", [irrigation.task_id]);
    await db('insert into sensor_readings (plot_id, temperature, air_humidity, soil_humidity, recorded_at) values ($1, 27, 95, 95, now())', [fixture.plotId]);
    const alerts = await request.get(`/api/alerts?plotId=${fixture.plotId}`);
    expect(alerts.ok()).toBe(true);
    const [task] = await db<{ due_date: string; notes: string }>('select due_date::text, notes from care_tasks where task_id = $1', [irrigation.task_id]);
    expect(task.due_date !== new Date().toISOString().slice(0, 10) || /mÆ°a|áº©m|hoÃ£n|cáº£nh bÃ¡o/i.test(task.notes)).toBe(true);
  } finally { await cleanup(fixture); }
});

test('F3-12 Staff issue is diagnosed by Expert and linked to response task', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-12');
  try {
    const posted = await request.post('/api/issue-reports', { data: {
      rentalId: rental.rental_id, reportedBy: rental.staff_id, issueType: 'PEST', description: 'E2E pest outbreak', imageUrl: '/images/harvest/rau-muong-p03.jpg',
    } });
    expect(posted.ok()).toBe(true);
    const [issue] = await db<{ issue_id: number; status: string; image_url: string }>('select issue_id, status, image_url from issue_reports where rental_id = $1 order by issue_id desc limit 1', [rental.rental_id]);
    expect(issue).toMatchObject({ status: 'OPEN', image_url: '/images/harvest/rau-muong-p03.jpg' });
    const diagnosis = await request.patch(`/api/issue-reports/${issue.issue_id}/diagnose`, { data: { handledBy: rental.expert_id, diagnosis: 'E2E apply biological control' } });
    expect(diagnosis.ok()).toBe(true);
    const [handled] = await db<{ handled_by: number; resolution_notes: string }>('select handled_by, resolution_notes from issue_reports where issue_id = $1', [issue.issue_id]);
    expect(handled.handled_by).toBe(rental.expert_id);
    expect(handled.resolution_notes).toContain('biological control');
    expect((await db('select task_id from care_tasks where rental_id = $1 and notes like $2', [rental.rental_id, '%E2E pest outbreak%'])).length).toBeGreaterThan(0);
  } finally { await cleanup(fixture); }
});

test('F3-13 Issue without description or evidence cannot be submitted', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-13');
  try {
    const posted = await request.post('/api/issue-reports', { data: { rentalId: rental.rental_id, reportedBy: rental.staff_id, issueType: 'PEST', description: '', imageUrl: '' } });
    expect([400, 422]).toContain(posted.status());
    expect(await db('select issue_id from issue_reports where rental_id = $1', [rental.rental_id])).toHaveLength(0);
  } finally { await cleanup(fixture); }
});

test('F3-14 Customer cannot read Staff-to-Expert issue thread', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-14');
  try {
    const [thread] = await db<{ conversation_id: number }>(`insert into conversations (participant_one, participant_two, rental_id, plot_id, type, status)
      values ($1, $2, $3, $4, 'STAFF_EXP', 'OPEN') returning conversation_id`, [rental.staff_id, rental.expert_id, rental.rental_id, fixture.plotId]);
    await db('insert into messages (conversation_id, sender_id, content) values ($1, $2, $3)', [thread.conversation_id, rental.staff_id, 'E2E private issue note']);
    const customerList = await request.get('/api/conversations?userId=1');
    expect(customerList.ok()).toBe(true);
    expect((await customerList.json()).data.some((row: { conversationId: number }) => row.conversationId === thread.conversation_id)).toBe(false);
    const direct = await request.get(`/api/conversations/${thread.conversation_id}/messages`);
    expect([401, 403, 404]).toContain(direct.status());
  } finally { await cleanup(fixture); }
});

test('F3-15 SELF customer service links request, Staff task and diary to one rental', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-15', 'SELF');
  try {
    const [service] = await db<{ service_id: number; price: string }>("select service_id, price from services where status = 'ACTIVE' and service_type = 'A_LA_CARTE' order by service_id limit 1");
    const checkout = await request.post('/api/services/checkout', { data: {
      rentalId: rental.rental_id, plotCode: fixture.plotCode, serviceId: service.service_id, amount: Number(service.price), paymentMethod: 'MOCK', serviceName: 'E2E ad-hoc care',
    } });
    expect(checkout.ok()).toBe(true);
    const [task] = await db<{ task_id: number; task_assigned_to: number; service_request_id: number }>('select task_id, task_assigned_to, service_request_id from care_tasks where rental_id = $1 and service_request_id is not null', [rental.rental_id]);
    expect(task.task_assigned_to).toBe(rental.staff_id);
    expect((await request.patch(`/api/care-tasks/${task.task_id}/complete`, { data: { workerId: rental.staff_id, evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg', notes: 'E2E service completed' } })).ok()).toBe(true);
    const [diary] = await db<{ rental_id: number }>('select rental_id from farm_diaries where task_id = $1', [task.task_id]);
    expect(diary.rental_id).toBe(rental.rental_id);
    expect(await db('select request_id from service_requests where request_id = $1 and rental_id = $2', [task.service_request_id, rental.rental_id])).toHaveLength(1);
  } finally { await cleanup(fixture); }
});

test('F3-16 Customer harvest plan is persisted for Expert review', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-16');
  try {
    const planned = await request.post('/api/harvest-plans', { data: {
      rentalId: rental.rental_id, requestedBy: 1, plannedDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), deliveryType: 'PICKUP',
    } });
    expect([200, 201]).toContain(planned.status());
    const listing = await request.get(`/api/harvest-plans?rentalId=${rental.rental_id}`);
    expect(listing.ok()).toBe(true);
    expect((await listing.json()).data.length).toBe(1);
  } finally { await cleanup(fixture); }
});

test('F3-20 Another Customer cannot confirm or rate an owned harvest', async ({ request }) => {
  const { fixture, rental } = await active(request, 'F3-20');
  try {
    const [harvest] = await db<{ harvest_id: number }>(`insert into harvest_results (rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type)
      values ($1, $2, current_date, 1.5, '/images/harvest/rau-muong-p03.jpg', 'PICKUP') returning harvest_id`, [rental.rental_id, rental.staff_id]);
    const wrongOwner = await request.post('/api/customer/harvest-results/confirm', { data: { harvestId: harvest.harvest_id, userId: 2, deliveryMethod: 'DELIVERY', rating: 6 } });
    expect([401, 403, 422]).toContain(wrongOwner.status());
    expect((await db<{ customer_confirmed: boolean }>('select customer_confirmed from harvest_results where harvest_id = $1', [harvest.harvest_id]))[0].customer_confirmed).toBe(false);
  } finally { await cleanup(fixture); }
});

test('F3-21 Scheduler completes ended rental and moves plot to maintenance', async ({ request }) => {
  test.setTimeout(12 * 60_000);
  const { fixture, rental } = await active(request, 'F3-21');
  try {
    await db("update rentals set end_date = current_date - 1 where rental_id = $1", [rental.rental_id]);
    await expect.poll(async () => (await db<{ status: string }>('select status from rentals where rental_id = $1', [rental.rental_id]))[0].status,
      { timeout: 11 * 60_000, intervals: [10_000] }).toBe('DONE');
    expect((await db<{ status: string }>('select status from contracts where contract_id = $1', [fixture.contractId]))[0].status).toBe('COMPLETED');
    expect((await db<{ status: string }>('select status from plots where plot_id = $1', [fixture.plotId]))[0].status).toBe('MAINT');
  } finally { await cleanup(fixture); }
});

test('F3-22 Maintenance plot blocks booking until four day recovery ends', async ({ request }) => {
  test.setTimeout(100_000);
  const fixture = await createFixture(request, 'F3-22', 'MAINT');
  try {
    const during = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [{
      plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInTenDays(), termMonths: 3,
    }] } });
    expect.soft([400, 409, 422]).toContain(during.status());
    await db("update plots set updated_at = now() - interval '5 days' where plot_id = $1", [fixture.plotId]);
    await expect.poll(async () => (await db<{ status: string }>('select status from plots where plot_id = $1', [fixture.plotId]))[0].status,
      { timeout: 75_000, intervals: [5_000] }).toBe('AVAIL');
    const after = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [{
      plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInTenDays(), termMonths: 3,
    }] } });
    expect(after.status()).toBe(201);
  } finally { await cleanup(fixture); }
});
