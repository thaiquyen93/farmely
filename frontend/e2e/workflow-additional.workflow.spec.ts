import { test, expect } from '@playwright/test';
import pg from 'pg';
import { createFixture, cleanup, startInTenDays } from './support/reservation-fixture';

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ host: '127.0.0.1', port: 5544, database: 'farmely_e2e', user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password' });
  try {
    await client.connect();
    expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e');
    return (await client.query(sql, params)).rows as T[];
  } finally {
    await client.end();
  }
}

function item(plotId: string, varietyId: number, cultivationMode = 'SELF', termMonths = 3) {
  return { plotId, varietyId, cultivationMode, termMonths, startDate: startInTenDays() };
}

test('F1-07 Compatible variety remains attached to plot in API and database', async ({ request }) => {
  const fixture = await createFixture(request, 'F1-07');
  try {
    const response = await request.get(`/api/plots/${fixture.plotId}/compatibility`);
    expect(response.ok()).toBe(true);
    const compatible = (await response.json()).data as { varietyId: number }[];
    expect(compatible.map((entry) => Number(entry.varietyId))).toContain(fixture.varietyId);
    const relations = await rows<{ variety_id: number }>('select variety_id from plot_variety_compatibility where plot_id = $1', [fixture.plotId]);
    expect(relations.map((entry) => entry.variety_id)).toContain(fixture.varietyId);
  } finally {
    await cleanup(fixture);
  }
});

test('F1-13 Published plot appears on marketplace detail with source price and area', async ({ page, request }) => {
  const fixture = await createFixture(request, 'F1-13');
  try {
    const source = await request.get(`/api/plots/${fixture.plotId}`);
    expect(source.ok()).toBe(true);
    const plot = (await source.json()).data;
    expect(plot.isPublished).toBe(true);
    const loaded = page.waitForResponse((response) => response.url().includes('/api/plots') && response.request().method() === 'GET');
    await page.goto(`/marketplace/plot/${fixture.plotCode}`, { waitUntil: 'domcontentloaded' });
    expect((await loaded).ok()).toBe(true);
    await expect(page.getByRole('heading', { name: `Thửa đất ${fixture.plotCode}` })).toBeVisible();
    await expect(page.getByText(`${Number(plot.pricePerPeriod).toLocaleString('vi-VN')} đ/tháng`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${Number(plot.area)} m²`, { exact: true }).first()).toBeVisible();
  } finally {
    await cleanup(fixture);
  }
});

test('F1-16 Published plot price update reaches a fresh marketplace session', async ({ browser, request }) => {
  const fixture = await createFixture(request, 'F1-16');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
  try {
    const newPrice = 1456000;
    const updated = await request.put(`/api/plots/${fixture.plotId}`, { data: {
      landId: fixture.landId, plotCode: fixture.plotCode, area: 100,
      pricePerPeriod: newPrice, status: 'AVAIL', isPublished: true, varietyIds: [fixture.varietyId],
    } });
    expect(updated.ok()).toBe(true);
    const stored = await rows<{ price_per_period: string }>('select price_per_period from plots where plot_id = $1', [fixture.plotId]);
    expect(Number(stored[0].price_per_period)).toBe(newPrice);
    const page = await context.newPage();
    await page.route('**/*', (route) => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort('blockedbyclient'));
    await page.goto(`/marketplace/plot/${fixture.plotCode}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`${newPrice.toLocaleString('vi-VN')} đ/tháng`, { exact: true }).first()).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText(`${newPrice.toLocaleString('vi-VN')} đ/tháng`, { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
    await cleanup(fixture);
  }
});

test('F2-08 One contract contains two independent rentals and the sum of their prices', async ({ request }) => {
  const first = await createFixture(request, 'F2-08-A');
  const second = await createFixture(request, 'F2-08-B');
  try {
    const response = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [
      item(first.plotCode, first.varietyId, 'SELF', 3),
      item(second.plotCode, second.varietyId, 'ASSISTED', 6),
    ] } });
    expect(response.status(), await response.text()).toBe(201);
    const contract = (await response.json()).data;
    first.contractId = second.contractId = Number(contract.contractId);
    const rentals = await rows<{ plot_id: number; total_price: string; cultivation_mode: string; term_months: number }>(
      'select plot_id, total_price, cultivation_mode, term_months from rentals where contract_id = $1 order by plot_id', [contract.contractId]);
    expect(rentals).toHaveLength(2);
    expect(rentals.map((r) => r.plot_id).sort()).toEqual([first.plotId, second.plotId].sort());
    expect(rentals.find((r) => r.plot_id === first.plotId)).toMatchObject({ cultivation_mode: 'SELF', term_months: 3 });
    expect(rentals.find((r) => r.plot_id === second.plotId)).toMatchObject({ cultivation_mode: 'ASSISTED', term_months: 6 });
    expect(Number(contract.totalAmount)).toBe(rentals.reduce((sum, r) => sum + Number(r.total_price), 0));
  } finally {
    await cleanup(first);
    await cleanup(second);
  }
});

test('F2-13 Concurrent customers cannot reserve the same plot and period twice', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-13');
  try {
    const results = await Promise.all([1, 2].map((renterId) => request.post('/api/contracts/reservations', {
      data: { renterId, items: [item(fixture.plotCode, fixture.varietyId)] },
    })));
    const body = await Promise.all(results.map((result) => result.json()));
    const created = body.map((value) => Number(value.data?.contractId)).filter(Number.isSafeInteger);
    if (created.length) fixture.contractId = created[0];
    const statuses = results.map((result) => result.status());
    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => [400, 409, 422].includes(status))).toHaveLength(1);
    const rentals = await rows<{ rental_id: number }>('select rental_id from rentals where plot_id = $1', [fixture.plotId]);
    expect(rentals).toHaveLength(1);
  } finally {
    await cleanup(fixture);
  }
});

test('F2-14 Reservation gets one ten minute grace period only', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-14');
  try {
    const response = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [item(fixture.plotCode, fixture.varietyId)] } });
    expect(response.status()).toBe(201);
    fixture.contractId = Number((await response.json()).data.contractId);
    const expiry = async () => (await rows<{ reservation_expires_at: Date }>('select reservation_expires_at from contracts where contract_id = $1', [fixture.contractId]))[0].reservation_expires_at.getTime();
    const before = await expiry();
    expect(before - Date.now()).toBeGreaterThan(14 * 60_000);
    const first = await request.post(`/api/contracts/${fixture.contractId}/grace-period`);
    expect(first.ok()).toBe(true);
    const afterFirst = await expiry();
    expect(afterFirst - before).toBe(10 * 60_000);
    const second = await request.post(`/api/contracts/${fixture.contractId}/grace-period`);
    expect([400, 409, 422]).toContain(second.status());
    expect(await expiry()).toBe(afterFirst);
  } finally {
    await cleanup(fixture);
  }
});

test('F2-18 Repeated mock payment activation creates one success transaction', async ({ request }) => {
  const fixture = await createFixture(request, 'F2-18');
  try {
    const response = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [item(fixture.plotCode, fixture.varietyId)] } });
    expect(response.status()).toBe(201);
    fixture.contractId = Number((await response.json()).data.contractId);
    const activate = () => request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } });
    expect((await activate()).ok()).toBe(true);
    const repeated = await activate();
    expect([200, 201, 204, 409]).toContain(repeated.status());
    const payments = await rows<{ transaction_id: number }>('select transaction_id from payment_transactions where contract_id = $1 and status = $2', [fixture.contractId, 'SUCCESS']);
    expect(payments).toHaveLength(1);
    const rentals = await rows<{ rental_id: number }>('select rental_id from rentals where contract_id = $1', [fixture.contractId]);
    expect(rentals).toHaveLength(1);
  } finally {
    await cleanup(fixture);
  }
});

test('F3-18 Invalid harvest without proof or positive quantity creates no record', async ({ request }) => {
  const fixture = await createFixture(request, 'F3-18');
  try {
    const reserved = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [item(fixture.plotCode, fixture.varietyId, 'ASSISTED')] } });
    expect(reserved.status()).toBe(201);
    fixture.contractId = Number((await reserved.json()).data.contractId);
    expect((await request.post(`/api/contracts/${fixture.contractId}/activate`, { data: { paymentMethod: 'MOCK' } })).ok()).toBe(true);
    const rental = (await rows<{ rental_id: number; staff_id: number }>('select rental_id, staff_id from rentals where contract_id = $1', [fixture.contractId]))[0];
    const invalid = await request.post('/api/harvest', { data: {
      rentalId: rental.rental_id, enteredBy: rental.staff_id, harvestDate: new Date().toISOString().slice(0, 10),
      yieldAmount: 0, evidenceImageUrl: '', deliveryType: 'PICKUP',
    } });
    expect([400, 422]).toContain(invalid.status());
    expect(await rows('select harvest_id from harvest_results where rental_id = $1', [rental.rental_id])).toHaveLength(0);
  } finally {
    await cleanup(fixture);
  }
});


\n