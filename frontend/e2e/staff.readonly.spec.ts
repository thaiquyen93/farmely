import { test, expect, asRole } from './support/readonly';

test('smoke: staff task dashboard loads', async ({ readonlyPage: page }) => {
  await asRole(page, 'STAFF');
  await page.goto('/staff/dashboard');
  await expect(page.getByRole('heading', { name: 'Việc hôm nay' })).toBeVisible();
});

test('negative: staff cannot complete harvest without required evidence', async ({ readonlyPage: page }) => {
  await asRole(page, 'STAFF');
  await page.goto('/staff/dashboard');
  await page.getByRole('button', { name: /Thu hoạch & đóng gói/ }).first().click();
  await expect(page.getByRole('button', { name: 'Hoàn tất thu hoạch' })).toBeDisabled();
});
