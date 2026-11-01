import { test, expect, asRole } from './support/readonly';

test('smoke: expert dashboard loads', async ({ readonlyPage: page }) => {
  await asRole(page, 'EXPERT');
  await page.goto('/expert/dashboard');
  await expect(page.locator('main')).toBeVisible();
  await expect(page).toHaveURL(/\/expert\/dashboard$/);
});
