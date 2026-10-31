import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ['localhost', '127.0.0.1'].includes(host) ? route.continue() : route.abort('blockedbyclient');
  });
});

test('F2-01 Published available plot detail matches catalogue data', async ({ page, request }) => {
  const response = await request.get('/api/plots');
  expect(response.ok()).toBe(true);
  const plots = (await response.json()).data as {
    plotId: number; plotCode: string; status: string; isPublished: boolean; area: number; pricePerPeriod: number;
  }[];
  const plot = plots.find((item) => item.status === 'AVAIL' && item.isPublished && Number(item.area) > 0);
  expect(plot, 'DB test needs one published available plot').toBeTruthy();

  await page.goto(`/marketplace/plot/${plot!.plotCode}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(plot!.plotCode, { exact: false }).first()).toBeVisible();
  await expect(page.getByText(new RegExp(`${Number(plot!.area)}\\s*m²`)).first()).toBeVisible();
  await expect(page.getByText(new RegExp(Number(plot!.pricePerPeriod).toLocaleString('vi-VN'))).first()).toBeVisible();
});

test('F2-05 Guest booking prompts login and preserves selected plot', async ({ page, request }) => {
  const response = await request.get('/api/plots');
  expect(response.ok()).toBe(true);
  const plots = (await response.json()).data as { plotCode: string; status: string; isPublished: boolean }[];
  const plot = plots.find((item) => item.status === 'AVAIL' && item.isPublished);
  expect(plot, 'DB test needs one published available plot').toBeTruthy();

  await page.goto(`/marketplace/plot/${plot!.plotCode}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /BẮT ĐẦU ĐẶT THUÊ THỬA ĐẤT/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(plot!.plotCode);
});
