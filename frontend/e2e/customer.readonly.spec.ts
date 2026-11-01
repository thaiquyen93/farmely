import { test, expect, asRole } from './support/readonly';

test('smoke: customer sees own garden', async ({ readonlyPage: page }) => {
  await asRole(page, 'CUSTOMER');
  await page.goto('/customer/dashboard');
  await expect(page.getByRole('heading', { name: 'Vườn của tôi' })).toBeVisible();
});

test('smoke: marketplace is available for browsing', async ({ readonlyPage: page }) => {
  await page.goto('/marketplace');
  await expect(page).toHaveURL(/\/marketplace$/);
  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Marketplace' })).toBeVisible();
});
