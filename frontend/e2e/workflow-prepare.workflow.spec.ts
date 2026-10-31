import { test, expect } from '@playwright/test';
import { asRole } from './support/readonly';
import pg from 'pg';

function nameFor(testId: string) {
  return `E2E ${testId} ${Date.now()} ${Math.floor(Math.random() * 100000)}`;
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort('blockedbyclient');
    return route.continue();
  });
  await asRole(page, 'ADMIN');
});

test('F1-01 Admin creates a land and it persists after reload', async ({ page, request }) => {
  let landId: number | undefined;
  const landName = nameFor('F1-01');
  try {
    await page.goto('/admin/master-data/lands/create', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form input[maxlength="150"]')).toBeVisible();
    await page.locator('form input[maxlength="150"]').fill(landName);
    await page.locator('form input').nth(1).fill('E2E test address');
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/admin\/master-data\/lands\/\d+$/);
    landId = Number(new URL(page.url()).pathname.split('/').pop());
    const response = await request.get(`/api/lands/${landId}`);
    expect(response.ok()).toBe(true);
    const payload = await response.json();
    expect(payload.data.landName).toBe(landName);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: landName, exact: true })).toBeVisible();
  } finally {
    if (landId) await request.delete(`/api/lands/${landId}`);
  }
});

test('F1-02 Duplicate land name is rejected without a second record', async ({ page, request }) => {
  const landName = nameFor('F1-02');
  const created = await request.post('/api/lands', {
    data: { landName, address: 'E2E test address', boundary: [] },
  });
  expect(created.ok()).toBe(true);
  try {
    await page.goto('/admin/master-data/lands/create', { waitUntil: 'domcontentloaded' });
    await page.locator('form input[maxlength="150"]').fill(landName);
    await page.locator('form input').nth(1).fill('Another E2E address');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/lands\/create$/);
    const response = await request.get(`/api/lands?search=${encodeURIComponent(landName)}`);
    expect(response.ok()).toBe(true);
    const rows = (await response.json()).data;
    expect(rows.filter((item: { landName: string }) => item.landName === landName)).toHaveLength(1);
  } finally {
    const response = await request.get(`/api/lands?search=${encodeURIComponent(landName)}`);
    if (response.ok()) {
      const rows = (await response.json()).data as { landId: number; landName: string }[];
      for (const item of rows.filter((row) => row.landName === landName)) {
        await request.delete(`/api/lands/${item.landId}`);
      }
    }
  }
});

test('F1-04 New plot defaults to unpublished with correct area and price', async ({ page, request }) => {
  const landName = nameFor('F1-04');
  const plotCode = `E2E-F1-04-${Date.now()}`;
  let landId: number | undefined;
  let plotId: number | undefined;
  try {
    const landResponse = await request.post('/api/lands', {
      data: { landName, address: 'E2E test address', boundary: [] },
    });
    expect(landResponse.ok()).toBe(true);
    landId = (await landResponse.json()).data.landId;
    await page.goto(`/admin/master-data/plots/create?landId=${landId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form input[maxlength="50"]')).toBeVisible();
    await page.locator('form input[maxlength="50"]').fill(plotCode);
    await page.locator('form input[type="number"]').first().fill('1200000');
    await page.locator('form input[type="number"]').last().fill('100');
    await expect(page.locator('form input[type="checkbox"]').first()).not.toBeChecked();
    await expect(page.locator('form section input[type="checkbox"]').first()).toBeChecked();
    await page.locator('form button[type="submit"]').click();
    await expect(page).toHaveURL(new RegExp(`/admin/master-data/lands/${landId}$`));

    const plotsResponse = await request.get('/api/plots');
    expect(plotsResponse.ok()).toBe(true);
    const plots = (await plotsResponse.json()).data as {
      plotId: number; plotCode: string; status: string; isPublished: boolean; area: number; pricePerPeriod: number;
    }[];
    const matching = plots.filter((plot) => plot.plotCode === plotCode);
    expect(matching).toHaveLength(1);
    plotId = matching[0].plotId;
    expect(matching[0]).toMatchObject({ status: 'AVAIL', isPublished: false, area: 100, pricePerPeriod: 1200000 });

  } finally {
    if (!plotId) {
      const response = await request.get('/api/plots');
      if (response.ok()) {
        const plots = (await response.json()).data as { plotId: number; plotCode: string }[];
        plotId = plots.find((plot) => plot.plotCode === plotCode)?.plotId;
      }
    }
    if (plotId) await request.delete(`/api/plots/${plotId}`);
    if (landId) await request.delete(`/api/lands/${landId}`);
  }
});

test('F1-14 Unpublished plot is inaccessible from public plot detail', async ({ page, request }) => {
  const landName = nameFor('F1-14');
  const plotCode = `P-${String(100000 + (Date.now() % 900000))}`;
  let landId: number | undefined;
  let plotId: number | undefined;
  try {
    const land = await request.post('/api/lands', {
      data: { landName, address: 'Isolated E2E farm', boundary: [] },
    });
    expect(land.ok()).toBe(true);
    landId = Number((await land.json()).data.landId);
    const plot = await request.post('/api/plots', {
      data: { landId, plotCode, area: 100, pricePerPeriod: 1200000, status: 'AVAIL', isPublished: false },
    });
    expect(plot.ok()).toBe(true);
    plotId = Number((await plot.json()).data.plotId);
    const plotsLoaded = page.waitForResponse((response) => response.url().includes('/api/plots') && response.request().method() === 'GET');
    await page.goto(`/marketplace/plot/${plotCode}`, { waitUntil: 'domcontentloaded' });
    expect((await plotsLoaded).ok()).toBe(true);
    await expect(page.getByRole('heading', { name: `Thửa đất ${plotCode}` })).toHaveCount(0);
  } finally {
    if (plotId && landId) {
      const client = new pg.Client({
        host: '127.0.0.1', port: 5544, database: 'farmely_e2e',
        user: 'postgres', password: process.env.FARMELY_E2E_DB_PASSWORD || 'password',
      });
      try {
        await client.connect();
        expect((await client.query('select current_database() as name')).rows[0].name).toBe('farmely_e2e');
        await client.query('begin');
        await client.query('select plot_id from plots where plot_id = $1 for update', [plotId]);
        await client.query('delete from sensor_readings where plot_id = $1', [plotId]);
        await client.query('delete from plot_variety_compatibility where plot_id = $1', [plotId]);
        await client.query('delete from plots where plot_id = $1', [plotId]);
        await client.query('delete from lands where land_id = $1', [landId]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback').catch(() => {});
        throw error;
      } finally {
        await client.end();
      }
    }
  }
});
