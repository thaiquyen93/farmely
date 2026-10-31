import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import pg from 'pg';

async function isolatedQuery<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({
    host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
    user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
  });
  try {
    await client.connect();
    expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e');
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort('blockedbyclient');
  });
});

async function asCustomer(page: Page, userId: number) {
  const user = { userId, id: `USR-${userId}`, fullName: `E2E Customer ${userId}`, email: `e2e-${userId}@example.invalid`, role: 'CUSTOMER' };
  await page.addInitScript((value) => {
    localStorage.setItem('farmely_auth', JSON.stringify({ user: value, token: 'demo-token-e2e' }));
    localStorage.setItem('farmely_user', JSON.stringify(value));
    localStorage.setItem('farmely_token', 'demo-token-e2e');
  }, user);
}

test('F3-01 Customer garden shows the correct mode for owned SELF and ASSISTED rentals', async ({ page, browser, request }) => {
  const response = await request.get('/api/rentals');
  expect(response.ok()).toBe(true);
  const rentals = (await response.json()).data as { rentalId: number; renterId: number; plotCode: string; cultivationMode: string; status: string }[];
  const self = rentals.find((item) => item.cultivationMode === 'SELF' && item.status === 'ACTIVE');
  const assisted = rentals.find((item) => item.cultivationMode === 'ASSISTED' && item.status === 'ACTIVE');
  expect(self, 'DB test needs an active SELF rental').toBeTruthy();
  expect(assisted, 'DB test needs an active ASSISTED rental').toBeTruthy();

  await asCustomer(page, self!.renterId);
  await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(`Thửa ${self!.plotCode}`, { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Tự canh tác', { exact: true }).first()).toBeVisible();

  const secondContext = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
  try {
    const assistedPage = await secondContext.newPage();
    await assistedPage.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort('blockedbyclient');
    });
    await asCustomer(assistedPage, assisted!.renterId);
    await assistedPage.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(assistedPage.getByText(`Thửa ${assisted!.plotCode}`, { exact: false }).first()).toBeVisible();
    await expect(assistedPage.getByText('Farmely chăm sóc', { exact: true }).first()).toBeVisible();
  } finally {
    await secondContext.close();
  }
});

test('F3-09 Customer IoT panel loads live sensor data for owned plot', async ({ page, request }) => {
  const [rental] = await isolatedQuery<{ rental_id: number; plot_id: number; renter_id: number; plot_code: string }>(
    `select r.rental_id, r.plot_id, c.renter_id, p.plot_code from rentals r
     join contracts c on c.contract_id = r.contract_id
     join plots p on p.plot_id = r.plot_id
     where r.status = 'ACTIVE' order by r.rental_id limit 1`,
  );
  expect(rental).toBeTruthy();
  const response = await request.get(`/api/sensors/plots/${rental.plot_id}/latest`);
  expect(response.ok()).toBe(true);
  const reading = await response.json();
  expect(reading.plotId).toBe(rental.plot_id);
  expect(Number.isFinite(Number(reading.temperature))).toBe(true);
  expect(Number.isFinite(Number(reading.soilHumidity))).toBe(true);

  await asCustomer(page, rental.renter_id);
  await page.route(`**/api/sensors/plots/${rental.plot_id}/latest`, (route) => route.fulfill({ json: reading }));
  await page.route(`**/api/sensors/plots/${rental.plot_id}/stream`, (route) => route.abort('blockedbyclient'));
  await page.goto(`/customer/dashboard?plot=PLOT-${rental.plot_code}&tab=iot`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('tab', { name: /IoT & vi khí hậu/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(`${Number(reading.temperature).toFixed(1)}°C`, { exact: true }).first()).toBeVisible();
});

async function createHarvest(request: import('@playwright/test').APIRequestContext) {
  const [rental] = await isolatedQuery<{ rental_id: number; staff_id: number; renter_id: number }>(
    `select r.rental_id, r.staff_id, c.renter_id from rentals r
     join contracts c on c.contract_id = r.contract_id
     where r.status = 'ACTIVE' and r.staff_id is not null order by r.rental_id limit 1`,
  );
  expect(rental, 'DB test needs an active assigned rental').toBeTruthy();
  const [diaryBefore] = await isolatedQuery<{ total: string }>('select count(*) as total from farm_diaries where rental_id = $1', [rental.rental_id]);
  const response = await request.post('/api/harvest', {
    data: {
      rentalId: rental.rental_id, enteredBy: rental.staff_id,
      harvestDate: new Date().toISOString().slice(0, 10),
      yieldAmount: 1.5, evidenceImageUrl: '/images/harvest/rau-muong-p03.jpg', deliveryType: 'PICKUP',
    },
  });
  expect(response.ok()).toBe(true);
  const harvestId = Number((await response.json()).data.harvestId);
  expect(harvestId).toBeGreaterThan(0);
  return { ...rental, harvestId, diaryBefore: Number(diaryBefore.total) };
}

test('F3-17 Staff harvest record persists and creates a customer diary entry', async ({ request }) => {
  const fixture = await createHarvest(request);
  try {
    const rows = await isolatedQuery<{ yield_amount: string; evidence_image_url: string; entered_by: number }>(
      'select yield_amount, evidence_image_url, entered_by from harvest_results where harvest_id = $1', [fixture.harvestId],
    );
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].yield_amount)).toBe(1.5);
    expect(rows[0].evidence_image_url).toBe('/images/harvest/rau-muong-p03.jpg');
    expect(rows[0].entered_by).toBe(fixture.staff_id);
    const [after] = await isolatedQuery<{ total: string }>('select count(*) as total from farm_diaries where rental_id = $1', [fixture.rental_id]);
    expect(Number(after.total)).toBeGreaterThan(fixture.diaryBefore);
  } finally {
    await isolatedQuery('delete from harvest_results where harvest_id = $1', [fixture.harvestId]);
  }
});

test('F3-19 Customer confirms pickup of an owned harvest', async ({ request }) => {
  const fixture = await createHarvest(request);
  try {
    const response = await request.post('/api/customer/harvest-results/confirm', {
      data: { harvestId: fixture.harvestId, deliveryMethod: 'PICKUP', userId: fixture.renter_id },
    });
    expect(response.ok()).toBe(true);
    const rows = await isolatedQuery<{ customer_confirmed: boolean; delivery_type: string }>(
      'select customer_confirmed, delivery_type from harvest_results where harvest_id = $1', [fixture.harvestId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customer_confirmed: true, delivery_type: 'PICKUP' });
  } finally {
    await isolatedQuery('delete from harvest_results where harvest_id = $1', [fixture.harvestId]);
  }
});
