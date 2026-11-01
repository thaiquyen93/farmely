import { test, expect } from '@playwright/test';
import { asRole } from './support/readonly';
import pg from 'pg';

async function dbRows<T>(sql: string): Promise<T[]> {
  const client = new pg.Client({
    host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
    user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
  });
  try {
    await client.connect();
    const identity = await client.query('select current_database() as name');
    expect(identity.rows[0]?.name).toBe('farmely_e2e');
    return (await client.query(sql)).rows as T[];
  } finally {
    await client.end();
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort('blockedbyclient');
    return route.continue();
  });
  await asRole(page, 'ADMIN');
});

test('F4-01 Admin dashboard revenue KPI matches live analytics', async ({ page, request }) => {
  const response = await request.get('/api/admin/analytics');
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.success).toBe(true);
  const revenue = Number(body.data.kpi.totalRevenue);
  expect(Number.isFinite(revenue)).toBe(true);

  const analyticsResponse = page.waitForResponse((res) => res.url().includes('/api/admin/analytics'));
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  expect((await analyticsResponse).ok()).toBe(true);
  const formatted = `${new Intl.NumberFormat('vi-VN').format(revenue)} đ`;
  await expect(page.getByText(formatted, { exact: true }).first()).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(formatted, { exact: true }).first()).toBeVisible();
});

test('F4-06 Occupancy KPI matches current plot statuses', async ({ page, request }) => {
  const [analyticsResponse, plotsResponse] = await Promise.all([
    request.get('/api/admin/analytics'),
    request.get('/api/plots'),
  ]);
  expect(analyticsResponse.ok()).toBe(true);
  expect(plotsResponse.ok()).toBe(true);
  const kpi = (await analyticsResponse.json()).data.kpi;
  const plots = (await plotsResponse.json()).data as { status: string }[];
  const rented = plots.filter((plot) => plot.status === 'RENT').length;
  const available = plots.filter((plot) => plot.status === 'AVAIL').length;
  const maintenance = plots.filter((plot) => plot.status === 'MAINT').length;
  expect(kpi.totalPlots).toBe(plots.length);
  expect(kpi.rentedPlots).toBe(rented);
  expect(kpi.availablePlots).toBe(available);
  expect(kpi.maintenancePlots).toBe(maintenance);
  expect(Number(kpi.occupancyRate ?? 0)).toBe(plots.length ? Math.round((rented / plots.length) * 1000) / 10 : 0);

  const analyticsLoaded = page.waitForResponse((res) => res.url().includes('/api/admin/analytics'));
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  expect((await analyticsLoaded).ok()).toBe(true);
  await expect(page.getByText(`${kpi.occupancyRate}%`, { exact: true }).first()).toBeVisible();
});

test('F4-12 Analytics outage never presents sample revenue as live data', async ({ page }) => {
  await page.route('**/api/admin/analytics', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ success: false, message: 'E2E simulated outage' }),
  }));
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('19.595.000 đ', { exact: true })).toHaveCount(0);
  await expect(page.getByText('PostgreSQL Live Sync', { exact: true })).toHaveCount(0);
});

test('F4-02 Only SUCCESS payments contribute to collected revenue', async ({ request }) => {
  const fixture = await dbRows<{ transaction_id: number }>(`insert into payment_transactions
    (type, amount, payment_method, gateway_ref, status) values
    ('PAYMENT', 111111, 'MOCK', 'E2E-F4-02-PENDING', 'PENDING'),
    ('PAYMENT', 222222, 'MOCK', 'E2E-F4-02-FAILED', 'FAILED')
    returning transaction_id`);
  try {
    const response = await request.get('/api/admin/analytics');
    expect(response.ok()).toBe(true);
    const kpi = (await response.json()).data.kpi;
    const [ledger] = await dbRows<{
      collected: string; pending: string; failed: string;
    }>(`select
        coalesce(sum(case when type = 'REFUND' then -amount else amount end) filter (where status = 'SUCCESS'), 0) as collected,
        coalesce(sum(amount) filter (where status = 'PENDING'), 0) as pending,
        coalesce(sum(amount) filter (where status = 'FAILED'), 0) as failed
      from payment_transactions`);
    expect(Number(kpi.totalRevenue)).toBe(Number(ledger.collected));
    expect(Number(kpi.pendingRevenue)).toBe(Number(ledger.pending));
    expect(Number(ledger.pending)).toBeGreaterThanOrEqual(111111);
    expect(Number(ledger.failed)).toBeGreaterThanOrEqual(222222);
  } finally {
    const ids = fixture.map((row) => Number(row.transaction_id)).filter(Number.isSafeInteger);
    if (ids.length) await dbRows(`delete from payment_transactions where transaction_id in (${ids.join(',')}) returning transaction_id`);
  }
});

test('F4-03 Lease and service revenue reconcile with ledger', async ({ request }) => {
  const response = await request.get('/api/admin/analytics');
  expect(response.ok()).toBe(true);
  const kpi = (await response.json()).data.kpi;
  const [ledger] = await dbRows<{ lease: string; service: string; total: string }>(`select
      coalesce(sum(case when type = 'REFUND' then -amount else amount end) filter (where status = 'SUCCESS' and contract_id is not null and service_request_id is null), 0) as lease,
      coalesce(sum(case when type = 'REFUND' then -amount else amount end) filter (where status = 'SUCCESS' and service_request_id is not null), 0) as service,
      coalesce(sum(case when type = 'REFUND' then -amount else amount end) filter (where status = 'SUCCESS'), 0) as total
    from payment_transactions`);
  expect(Number(kpi.leaseRevenue)).toBe(Number(ledger.lease));
  expect(Number(kpi.serviceRevenue)).toBe(Number(ledger.service));
  expect(Number(kpi.totalRevenue)).toBe(Number(ledger.total));
  expect(Number(kpi.leaseRevenue) + Number(kpi.serviceRevenue)).toBe(Number(kpi.totalRevenue));
});

test('F4-08 Task counts and completion rate reconcile with care_tasks', async ({ page, request }) => {
  const response = await request.get('/api/admin/analytics');
  expect(response.ok()).toBe(true);
  const kpi = (await response.json()).data.kpi;
  const [tasks] = await dbRows<{ total: string; done: string; in_progress: string; pending: string }>(`select
      count(*) as total,
      count(*) filter (where status = 'DONE') as done,
      count(*) filter (where status = 'IN_PROG') as in_progress,
      count(*) filter (where status = 'PENDING') as pending
    from care_tasks`);
  expect(kpi.totalTasks).toBe(Number(tasks.total));
  expect(kpi.completedTasks).toBe(Number(tasks.done));
  expect(kpi.inProgressTasks).toBe(Number(tasks.in_progress));
  expect(kpi.pendingTasks).toBe(Number(tasks.pending));
  const rate = Number(tasks.total) ? Math.round(Number(tasks.done) / Number(tasks.total) * 1000) / 10 : 0;
  expect(Number(kpi.taskCompletionRate ?? 0)).toBe(rate);
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(`${kpi.taskCompletionRate}%`, { exact: true }).first()).toBeVisible();
});

test('F4-09 Recent transactions match ledger IDs, amounts and status', async ({ page, request }) => {
  const response = await request.get('/api/admin/analytics');
  expect(response.ok()).toBe(true);
  const transactions = (await response.json()).data.recentTransactions as {
    id: number; code: string; amount: number; status: string;
  }[];
  const ledger = await dbRows<{ transaction_id: number; amount: string; status: string }>(
    'select transaction_id, amount, status from payment_transactions order by created_at desc limit 8',
  );
  expect(transactions).toHaveLength(ledger.length);
  for (let index = 0; index < ledger.length; index++) {
    expect(transactions[index].id).toBe(ledger[index].transaction_id);
    expect(Number(transactions[index].amount)).toBe(Number(ledger[index].amount));
    expect(transactions[index].status).toBe(ledger[index].status);
  }
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  for (const tx of transactions) {
    const row = page.getByRole('row', { name: new RegExp(tx.code) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(`${Number(tx.amount).toLocaleString('vi-VN')} đ`);
  }
});
