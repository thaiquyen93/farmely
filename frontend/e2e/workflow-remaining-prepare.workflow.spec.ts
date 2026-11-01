import { test, expect } from '@playwright/test';
import pg from 'pg';
import { createFixture, cleanup, startInTenDays } from './support/reservation-fixture';
import { asRole } from './support/readonly';

async function db<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const client = new pg.Client({ host: '127.0.0.1', port: 5544, database: 'farmely_e2e', user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password' });
  try { await client.connect(); expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e'); return (await client.query(sql, params)).rows as T[]; }
  finally { await client.end(); }
}

async function createVariety(request: import('@playwright/test').APIRequestContext, id: string) {
  const name = `E2E ${id} ${Date.now()}`;
  const created = await request.post('/api/varieties', { data: { name, cropId: 1, growthDuration: 45, bufferTime: 5 } });
  expect(created.ok()).toBe(true);
  const [row] = await db<{ variety_id: number }>('select variety_id from varieties where variety_name = $1', [name]);
  expect(row).toBeTruthy();
  return { name, id: row.variety_id };
}

test('F1-03 Self-intersecting land boundary is rejected', async ({ request }) => {
  const name = `E2E F1-03 ${Date.now()}`;
  try {
    const response = await request.post('/api/lands', { data: {
      landName: name, address: 'Isolated E2E farm', boundary: [[106.5, 10.5], [106.6, 10.6], [106.5, 10.6], [106.6, 10.5]],
    } });
    expect([400, 422]).toContain(response.status());
    expect(await db('select land_id from lands where land_name = $1', [name])).toHaveLength(0);
  } finally {
    await db('delete from lands where land_name = $1 and not exists (select 1 from plots where plots.land_id = lands.land_id)', [name]);
  }
});

test('F1-05 Duplicate plot code is rejected without a second plot', async ({ request }) => {
  const fixture = await createFixture(request, 'F1-05');
  try {
    const duplicate = await request.post('/api/plots', { data: {
      landId: fixture.landId, plotCode: fixture.plotCode, area: 100, pricePerPeriod: 1200000, status: 'AVAIL', isPublished: false,
    } });
    expect([400, 409, 422]).toContain(duplicate.status());
    expect(await db('select plot_id from plots where plot_code = $1', [fixture.plotCode])).toHaveLength(1);
  } finally { await cleanup(fixture); }
});

test('F1-06 Negative plot area or price cannot be saved', async ({ request }) => {
  const fixture = await createFixture(request, 'F1-06');
  try {
    const changed = await request.put(`/api/plots/${fixture.plotId}`, { data: {
      landId: fixture.landId, plotCode: fixture.plotCode, area: -10, pricePerPeriod: -1, status: 'AVAIL', isPublished: true,
    } });
    expect([400, 422]).toContain(changed.status());
    const [stored] = await db<{ area: string; price_per_period: string }>('select area, price_per_period from plots where plot_id = $1', [fixture.plotId]);
    expect(Number(stored.area)).toBe(100);
    expect(Number(stored.price_per_period)).toBe(1200000);
  } finally { await cleanup(fixture); }
});

test('F1-08 Removed variety cannot be reserved for the plot', async ({ request }) => {
  const fixture = await createFixture(request, 'F1-08');
  try {
    const changed = await request.put(`/api/plots/${fixture.plotId}`, { data: {
      landId: fixture.landId, plotCode: fixture.plotCode, area: 100, pricePerPeriod: 1200000,
      status: 'AVAIL', isPublished: true, varietyIds: [],
    } });
    expect(changed.ok()).toBe(true);
    const compatible = await request.get(`/api/plots/${fixture.plotId}/compatibility`);
    expect(compatible.ok()).toBe(true);
    expect((await compatible.json()).data).toHaveLength(0);
    const booking = await request.post('/api/contracts/reservations', { data: { renterId: 1, items: [{
      plotId: fixture.plotCode, varietyId: fixture.varietyId, cultivationMode: 'SELF', startDate: startInTenDays(), termMonths: 3,
    }] } });
    expect([400, 409, 422]).toContain(booking.status());
    expect(await db('select rental_id from rentals where plot_id = $1', [fixture.plotId])).toHaveLength(0);
  } finally { await cleanup(fixture); }
});

test('F1-09 New variety keeps duration and buffer and can be linked to a plot', async ({ request }) => {
  const fixture = await createFixture(request, 'F1-09');
  let variety: { id: number; name: string } | undefined;
  try {
    variety = await createVariety(request, 'F1-09');
    const changed = await request.put(`/api/plots/${fixture.plotId}`, { data: {
      landId: fixture.landId, plotCode: fixture.plotCode, area: 100, pricePerPeriod: 1200000,
      status: 'AVAIL', isPublished: true, varietyIds: [variety.id],
    } });
    expect(changed.ok()).toBe(true);
    const [saved] = await db<{ expected_duration: number; buffer_time: number }>('select expected_duration, buffer_time from varieties where variety_id = $1', [variety.id]);
    expect(saved).toMatchObject({ expected_duration: 45, buffer_time: 5 });
    const compatible = await request.get(`/api/plots/${fixture.plotId}/compatibility`);
    expect((await compatible.json()).data.map((entry: { varietyId: number }) => entry.varietyId)).toContain(variety.id);
  } finally {
    await cleanup(fixture);
    if (variety) await db('delete from varieties where variety_id = $1', [variety.id]);
  }
});

test('F1-10 Expert template with ordered steps persists after reload', async ({ request }) => {
  let variety: { id: number; name: string } | undefined;
  try {
    variety = await createVariety(request, 'F1-10');
    const response = await request.post('/api/process-templates', { data: {
      varietyId: variety.id, ptCreatedBy: 5, version: 'e2e-1', steps: [
        { stepName: 'E2E soil preparation', dayOffset: 0, taskType: 'SOIL_PREP', description: 'Prepare soil' },
        { stepName: 'E2E planting', dayOffset: 5, taskType: 'PLANTING', description: 'Plant seedlings' },
      ],
    } });
    expect(response.ok()).toBe(true);
    const templateId = Number((await response.json()).data.templateId);
    const detail = await request.get(`/api/process-templates/${templateId}`);
    expect(detail.ok()).toBe(true);
    const steps = (await detail.json()).data.steps as { dayOffset: number; stepName: string }[];
    expect(steps.map((step) => step.dayOffset)).toEqual([0, 5]);
    expect(steps.map((step) => step.stepName)).toEqual(['E2E soil preparation', 'E2E planting']);
    expect(await db('select step_id from template_steps where template_id = $1', [templateId])).toHaveLength(2);
  } finally {
    if (variety) {
      await db('delete from process_templates where variety_id = $1', [variety.id]);
      await db('delete from varieties where variety_id = $1', [variety.id]);
    }
  }
});

test('F1-11 Template without a valid variety cannot be created', async ({ request }) => {
  const response = await request.post('/api/process-templates', { data: { varietyId: 9999999, ptCreatedBy: 5, steps: [
    { stepName: 'E2E invalid', dayOffset: 0, taskType: 'SOIL_PREP' },
  ] } });
  expect([400, 422]).toContain(response.status());
});

test('F1-12 Admin can create a service and see it in catalogue', async ({ request }) => {
  const code = `E2E${Date.now()}`;
  try {
    const created = await request.post('/api/services', { data: {
      serviceCode: code, name: 'E2E care service', serviceType: 'A_LA_CARTE', price: 125000, unit: 'visit', status: 'ACTIVE',
    } });
    expect([200, 201]).toContain(created.status());
    const catalogue = await request.get('/api/services');
    expect(catalogue.ok()).toBe(true);
    expect((await catalogue.json()).data.some((service: { serviceCode: string }) => service.serviceCode === code)).toBe(true);
  } finally { await db('delete from services where service_code = $1', [code]); }
});

test('F1-15 Customer cannot open Admin land page or create land through API', async ({ page, request }) => {
  await asRole(page, 'CUSTOMER');
  await page.goto('/admin/master-data/lands/create', { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/admin\/master-data\/lands\/create$/);
  const name = `E2E F1-15 ${Date.now()}`;
  try {
    const result = await request.post('/api/lands', { data: { landName: name, address: 'E2E private authorization check', boundary: [] } });
    expect([401, 403]).toContain(result.status());
    expect(await db('select land_id from lands where land_name = $1', [name])).toHaveLength(0);
  } finally { await db('delete from lands where land_name = $1 and not exists (select 1 from plots where plots.land_id = lands.land_id)', [name]); }
});

\n