import { test, expect } from '@playwright/test';
import pg from 'pg';
import { createFixture, cleanup, startInTenDays } from './support/reservation-fixture';

async function db<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ host: '127.0.0.1', port: 5544, database: 'farmely_e2e', user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password' });
  try { await client.connect(); expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e'); return (await client.query(sql, params)).rows as T[]; }
  finally { await client.end(); }
}

async function reserve(request: import('@playwright/test').APIRequestContext, fixture: Awaited<ReturnType<typeof createFixture>>, mode = 'SELF') {
  const response = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [{
    plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: mode, startDate: startInTenDays(), termMonths: 3,
  }] } });
  expect(response.status()).toBe(201);
  fixture.contractId = Number((await response.json()).data.contractId);
  return fixture.contractId;
}

async function activate(request: import('@playwright/test').APIRequestContext, fixture: Awaited<ReturnType<typeof createFixture>>, mode = 'SELF') {
  await reserve(request, fixture, mode);
  const response = await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } });
  expect(response.ok()).toBe(true);
  return (await db<{ rental_id: number; staff_id: number; expert_id: number; end_date: string }>('select rental_id, staff_id, expert_id, end_date from rentals where contract_id = $1', [fixture.contractId]))[0];
}

test('F2-02 Guest books a valid site visit and Admin confirms it', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-02');
  try {
    const date = startInTenDays();
    const response = await request.post('/api/site-visits', { data: {
      plot_id: fixture.plotId, visitor_name: 'E2E Guest', visitor_phone: '0900000000', visit_date: date, visit_slot: 'MORNING',
    } });
    expect(response.ok()).toBe(true);
    const [visit] = await db<{ visit_id: number; status: string; visit_slot: string; visit_date: string }>(
      'select visit_id, status, visit_slot, visit_date::text from site_visits where plot_id = $1 order by visit_id desc limit 1', [fixture.plotId]);
    expect(visit).toMatchObject({ status: 'PENDING', visit_slot: 'MORNING', visit_date: date });
    expect((await request.post(`/api/site-visits/${visit.visit_id}/confirm`)).ok()).toBe(true);
    await expect.poll(async () => (await db<{ status: string }>('select status from site_visits where visit_id = $1', [visit.visit_id]))[0].status).toBe('CONFIRMED');
  } finally { await cleanup(fixture); }
});

test('F2-03 Invalid or cancelled site visit cannot be confirmed', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-03');
  try {
    const past = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const invalid = await request.post('/api/site-visits', { data: { plot_id: fixture.plotId, visitor_name: '', visitor_phone: '', visit_date: past, visit_slot: 'MORNING' } });
    expect([400, 422]).toContain(invalid.status());
    expect(await db('select visit_id from site_visits where plot_id = $1', [fixture.plotId])).toHaveLength(0);
    const [cancelled] = await db<{ visit_id: number }>(`insert into site_visits (plot_id, visitor_name, visitor_phone, visit_date, visit_slot, status)
      values ($1, 'E2E Guest', '0900000000', current_date + 10, 'MORNING', 'CANCELLED') returning visit_id`, [fixture.plotId]);
    const confirm = await request.post(`/api/site-visits/${cancelled.visit_id}/confirm`);
    expect([400, 409, 422]).toContain(confirm.status());
    expect((await db<{ status: string }>('select status from site_visits where visit_id = $1', [cancelled.visit_id]))[0].status).toBe('CANCELLED');
  } finally { await cleanup(fixture); }
});

test('F2-04 Pre-rental Customer and Expert see the same plot consultation', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-04');
  let conversationId: number | undefined;
  try {
    const [expert] = await db<{ user_id: number }>(`select u.user_id from users u join roles r on r.role_id = u.role_id where r.role_name = 'EXPERT' order by u.user_id limit 1`);
    expect(expert).toBeTruthy();
    const [created] = await db<{ conversation_id: number }>(`insert into conversations (participant_one, participant_two, plot_id, type, status)
      values (1, $1, $2, 'CUST_EXP', 'OPEN') returning conversation_id`, [expert.user_id, fixture.plotId]);
    conversationId = created.conversation_id;
    const text = `E2E consultation ${Date.now()}`;
    const sent = await request.post(`/api/conversations/${conversationId}/messages`, { data: { senderId: 1, content: text } });
    expect(sent.ok(), `message POST status ${sent.status()}`).toBe(true);
    for (const userId of [1, expert.user_id]) {
      const response = await request.get(`/api/conversations?userId=${userId}`);
      expect(response.ok()).toBe(true);
      const thread = (await response.json()).data.find((row: { conversationId: number }) => row.conversationId === conversationId);
      expect(thread.plotId).toBe(fixture.plotId);
      expect(thread.messages.some((message: { text: string }) => message.text === text)).toBe(true);
    }
    expect((await db<{ status: string }>('select status from plots where plot_id = $1', [fixture.plotId]))[0].status).toBe('AVAIL');
  } finally {
    if (conversationId) { await db('delete from messages where conversation_id = $1', [conversationId]); await db('delete from conversations where conversation_id = $1', [conversationId]); }
    await cleanup(fixture);
  }
});

test('F2-15 Expired reservation releases plot and cannot be activated', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-15');
  try {
    await reserve(request, fixture);
    await db("update contracts set reservation_expires_at = now() - interval '1 minute' where contract_id = $1", [fixture.contractId]);
    const activation = await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } });
    expect([400, 409, 410, 422]).toContain(activation.status());
    const [contract] = await db<{ status: string }>('select status from contracts where contract_id = $1', [fixture.contractId]);
    expect(contract.status).toBe('CANCELLED');
    expect((await db<{ status: string }>('select status from plots where plot_id = $1', [fixture.plotId]))[0].status).toBe('AVAIL');
  } finally { await cleanup(fixture); }
});

test('F2-17 Failed mock payment keeps contract pending and revenue unchanged', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-17');
  try {
    await reserve(request, fixture);
    const before = Number((await (await request.get('/api/admin/analytics')).json()).data.kpi.totalRevenue);
    const [contract] = await db<{ total_amount: string }>('select total_amount from contracts where contract_id = $1', [fixture.contractId]);
    await db(`insert into payment_transactions (contract_id, type, amount, payment_method, gateway_ref, status)
      values ($1, 'PAYMENT', $2, 'MOCK', 'E2E-F2-17-FAILED', 'FAILED')`, [fixture.contractId, contract.total_amount]);
    expect((await db<{ status: string }>('select status from contracts where contract_id = $1', [fixture.contractId]))[0].status).toBe('PENDING_PAYMENT');
    expect(Number((await (await request.get('/api/admin/analytics')).json()).data.kpi.totalRevenue)).toBe(before);
  } finally { await cleanup(fixture); }
});

test('F2-20 Paid rental service creates one request, mock payment and Staff task', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-20');
  try {
    const rental = await activate(request, fixture);
    const [service] = await db<{ service_id: number; price: string }>("select service_id, price from services where status = 'ACTIVE' and service_type = 'A_LA_CARTE' order by service_id limit 1");
    expect(service).toBeTruthy();
    const response = await request.post('/api/services/checkout', { data: {
      rentalId: rental.rental_id, plotCode: fixture.plotCode, serviceId: service.service_id,
      amount: Number(service.price), paymentMethod: 'MOCK', serviceName: 'E2E care service', scheduledDate: startInTenDays(),
    } });
    expect(response.ok()).toBe(true);
    const requests = await db<{ request_id: number; rental_id: number }>('select request_id, rental_id from service_requests where rental_id = $1', [rental.rental_id]);
    expect(requests).toHaveLength(1);
    const [task] = await db<{ rental_id: number; task_assigned_to: number }>('select rental_id, task_assigned_to from care_tasks where service_request_id = $1', [requests[0].request_id]);
    expect(task).toMatchObject({ rental_id: rental.rental_id, task_assigned_to: rental.staff_id });
    const [payment] = await db<{ amount: string; status: string }>('select amount, status from payment_transactions where service_request_id = $1', [requests[0].request_id]);
    expect(payment).toMatchObject({ status: 'SUCCESS', amount: Number(service.price).toFixed(2) });
  } finally { await cleanup(fixture); }
});

test('F2-21 Inactive service cannot be bought for a rental', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-21');
  let serviceId: number | undefined;
  try {
    const rental = await activate(request, fixture);
    const [service] = await db<{ service_id: number }>(`insert into services (service_code, service_name, service_type, price, unit, status)
      values ($1, 'E2E inactive', 'A_LA_CARTE', 125000, 'visit', 'INACTIVE') returning service_id`, [`E2E${Date.now()}`]);
    serviceId = service.service_id;
    const response = await request.post('/api/services/checkout', { data: {
      rentalId: rental.rental_id, serviceId, plotCode: fixture.plotCode, amount: 125000, paymentMethod: 'MOCK',
    } });
    expect([400, 409, 422]).toContain(response.status());
    expect(await db('select request_id from service_requests where rental_id = $1 and service_id = $2', [rental.rental_id, serviceId])).toHaveLength(0);
  } finally {
    await cleanup(fixture);
    if (serviceId) await db('delete from services where service_id = $1', [serviceId]);
  }
});

test('F2-22 Customer contract detail matches stored plot, mode, amount and dates after reload', async ({ page, request }) => {
  const fixture = await createFixture(request, 'F2-22');
  try {
    await activate(request, fixture, 'ASSISTED');
    const response = await request.get(`/api/contracts/${fixture.contractId}`);
    expect(response.ok()).toBe(true);
    const contract = (await response.json()).data;
    const [stored] = await db<{ total_amount: string; status: string }>('select total_amount, status from contracts where contract_id = $1', [fixture.contractId]);
    expect(Number(contract.totalAmount)).toBe(Number(stored.total_amount));
    expect(contract.status).toBe(stored.status);
    expect(contract.rentals).toHaveLength(1);
    expect(contract.rentals[0]).toMatchObject({ plotId: fixture.plotId, plotCode: fixture.plotCode, cultivationMode: 'ASSISTED' });
    await page.addInitScript(() => localStorage.setItem('farmely_auth', JSON.stringify({ user: { userId: 1, id: 'USR-001', role: 'CUSTOMER', fullName: 'E2E Customer' }, token: 'demo-token-e2e' })));
    await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(fixture.plotCode, { exact: false }).first()).toBeVisible();
  } finally { await cleanup(fixture); }
});

test('F2-23 Customer cancellation is unique and Admin approval refunds according to policy', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-23');
  try {
    await activate(request, fixture);
    const [contract] = await db<{ total_amount: string }>('select total_amount from contracts where contract_id = $1', [fixture.contractId]);
    const cancel = () => request.post('/api/contracts/cancellations', { data: { contractId: fixture.contractId, userId: 1, reason: 'E2E cancellation before cultivation begins' } });
    const first = await cancel();
    expect(first.ok()).toBe(true);
    const info = (await first.json()).data;
    expect(info.refundAmount).toBe(Math.round(Number(contract.total_amount) * 0.8));
    const duplicate = await cancel();
    expect([400, 409, 422]).toContain(duplicate.status());
    expect((await request.post(`/api/contracts/cancellations/${info.cancellationId}/approve`)).ok()).toBe(true);
    const [updated] = await db<{ status: string }>('select status from contracts where contract_id = $1', [fixture.contractId]);
    expect(updated.status).toBe('CANCELLED');
    const [refund] = await db<{ amount: string; type: string }>("select amount, type from payment_transactions where contract_id = $1 and type = 'REFUND'", [fixture.contractId]);
    expect(refund).toMatchObject({ type: 'REFUND', amount: Number(info.refundAmount).toFixed(2) });
  } finally { await cleanup(fixture); }
});

test('F2-24 Active rental renewal creates one linked period and rejects invalid duration', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-24');
  try {
    const rental = await activate(request, fixture);
    const start = new Date(rental.end_date);
    const newEnd = new Date(start.getTime() + 90 * 86400000).toISOString().slice(0, 10);
    const renewed = await request.post(`/api/rentals/${rental.rental_id}/renew`, { data: { newEndDate: newEnd } });
    expect(renewed.ok(), `renew POST status ${renewed.status()}: ${await renewed.text()}`).toBe(true);
    const linked = await db<{ rental_id: number; parent_rental_id: number; end_date: string }>('select rental_id, parent_rental_id, end_date::text from rentals where parent_rental_id = $1', [rental.rental_id]);
    expect(linked).toHaveLength(1);
    expect(linked[0]).toMatchObject({ parent_rental_id: rental.rental_id, end_date: newEnd });
    const invalid = await request.post(`/api/rentals/${rental.rental_id}/renew`, { data: { newEndDate: new Date(start.getTime() + 86400000).toISOString().slice(0, 10) } });
    expect([400, 409, 422]).toContain(invalid.status());
    expect(await db('select rental_id from rentals where parent_rental_id = $1', [rental.rental_id])).toHaveLength(1);
  } finally { await cleanup(fixture); }
});

\n