import { test, expect, asRole } from './support/readonly';

test('smoke: admin dashboard and master data load', async ({ readonlyPage: page }) => {
  await asRole(page, 'ADMIN');
  await page.goto('/admin/dashboard');
  await expect(page.locator('main')).toBeVisible();
  await page.goto('/admin/master-data');
  await expect(page.locator('aside a[href="/admin/master-data/lands"]')).toBeVisible();
});

for (const section of ['lands', 'plots', 'iot-stations', 'crops', 'varieties', 'compatibility', 'knowledge-documents', 'services', 'process-templates']) {
  test(`regression: admin can open ${section} catalogue`, async ({ readonlyPage: page }) => {
    await asRole(page, 'ADMIN');
    await page.goto(`/admin/master-data/${section}`);
    await expect(page).toHaveURL(new RegExp(`/admin/master-data/${section}$`));
    await expect(page.locator('main h2').first()).toBeVisible();
    await expect(page.locator(`aside a[href="/admin/master-data/${section}"]`)).toHaveClass(/active/);
  });
}
