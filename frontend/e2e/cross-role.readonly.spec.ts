import { test, expect, asRole } from './support/readonly';

test('authorization: staff cannot enter customer checkout', async ({ readonlyPage: page }) => {
  await asRole(page, 'STAFF');
  await page.goto('/marketplace');
  await expect(page).toHaveURL(/\/staff\/dashboard$/);
});

test('authorization: expert cannot enter admin master data', async ({ readonlyPage: page }) => {
  await asRole(page, 'EXPERT');
  await page.goto('/admin/master-data/lands');
  await expect(page).toHaveURL(/\/expert\/dashboard$/);
});
