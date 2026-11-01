import { test, expect } from '@playwright/test';
import pg from 'pg';
import { asRole } from './support/readonly';

async function db<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ host: '127.0.0.1', port: 5544, database: 'farmely_e2e', user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password' });
  try {
    await client.connect();
    expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e');
    return (await client.query(sql, params)).rows as T[];
  } finally { await client.end(); }
}

test('F4-04 A successful positive REFUND reduces net collected revenue', async ({ request }) => {
  const before = await request.get('/api/admin/analytics');
  expect(before.ok()).toBe(true);
  const oldRevenue = Number((await before.json()).data.kpi.totalRevenue);
  const inserted = await db<{ transaction_id: number }>(`insert into payment_transactions
    (type, amount, payment_method, gateway_ref, status) values ('REFUND', 12345, 'MOCK', 'E2E-F4-04', 'SUCCESS') returning transaction_id`);
  try {
    const response = await request.get('/api/admin/analytics');
    expect(response.ok()).toBe(true);
    const current = (await response.json()).data;
    expect(Number(current.kpi.totalRevenue)).toBe(oldRevenue - 12345);
    expect(current.recentTransactions.some((tx: { id: number; type: string }) => tx.id === inserted[0].transaction_id && tx.type === 'REFUND')).toBe(true);
  } finally {
    await db('delete from payment_transactions where transaction_id = $1', [inserted[0].transaction_id]);
  }
});

test('F4-05 Monthly chart reconciles transactions near the Bangkok month boundary', async ({ request }) => {
  const inserted = await db<{ transaction_id: number }>(`insert into payment_transactions
    (type, amount, payment_method, gateway_ref, status, created_at) values
    ('PAYMENT', 12341, 'MOCK', 'E2E-F4-05-BEFORE', 'SUCCESS', date_trunc('month', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok' - interval '1 minute'),
    ('PAYMENT', 56789, 'MOCK', 'E2E-F4-05-AFTER', 'SUCCESS', date_trunc('month', now() at time zone 'Asia/Bangkok') at time zone 'Asia/Bangkok' + interval '1 minute')
    returning transaction_id`);
  try {
    const response = await request.get('/api/admin/analytics');
    expect(response.ok()).toBe(true);
    const chart = (await response.json()).data.monthlyRevenue as { month: string; totalRevenue: number }[];
    const ledger = await db<{ month: string; total: string }>(`select to_char(created_at at time zone 'Asia/Bangkok', 'MM/YYYY') as month,
      sum(case when type = 'REFUND' then -amount else amount end) as total
      from payment_transactions where status = 'SUCCESS'
      group by 1 order by 1`);
    for (const month of ledger) {
      expect(Number(chart.find((entry) => entry.month === month.month)?.totalRevenue), `month ${month.month}`).toBe(Number(month.total));
    }
    const stamps = await db<{ month: string }>(`select to_char(created_at at time zone 'Asia/Bangkok', 'MM/YYYY') as month
      from payment_transactions where transaction_id = any($1::int[]) order by created_at`, [inserted.map((entry) => entry.transaction_id)]);
    expect(new Set(stamps.map((entry) => entry.month)).size).toBe(2);
  } finally {
    await db('delete from payment_transactions where transaction_id = any($1::int[])', [inserted.map((entry) => entry.transaction_id)]);
  }
});

test('F4-07 Empty analytics response shows zero state without sample numbers', async ({ page }) => {
  await asRole(page, 'ADMIN');
  await page.route('**/api/admin/analytics', (route) => route.fulfill({ json: {
    success: true, data: {
      kpi: { totalRevenue: 0, monthlyRevenue: 0, leaseRevenue: 0, serviceRevenue: 0, pendingRevenue: 0,
        totalPlots: 0, rentedPlots: 0, availablePlots: 0, maintenancePlots: 0, occupancyRate: 0,
        totalRentals: 0, selfGrowingCount: 0, assistedGrowingCount: 0, selfGrowingPct: 0, assistedGrowingPct: 0,
        totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0, taskCompletionRate: 0 },
      monthlyRevenue: [], recentTransactions: [], cultivationBreakdown: [],
    },
  } }));
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Tổng Thực Thu')).toBeVisible();
  await expect(page.getByText('19.595.000 đ', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0);
});

test('F4-13 Admin can inspect live KPIs for next season without implying a saved plan', async ({ page, request }) => {
  await asRole(page, 'ADMIN');
  const response = await request.get('/api/admin/analytics');
  expect(response.ok()).toBe(true);
  const kpi = (await response.json()).data.kpi;
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Tổng Quan Doanh Thu & Chỉ Số Vận Hành')).toBeVisible();
  await expect(page.getByText(`${Number(kpi.totalRevenue).toLocaleString('vi-VN')} đ`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`${kpi.occupancyRate}%`, { exact: true }).first()).toBeVisible();
});
