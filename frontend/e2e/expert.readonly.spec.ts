import { test, expect, asRole } from './support/readonly';

test('smoke: expert dashboard loads', async ({ readonlyPage: page }) => {
  await asRole(page, 'EXPERT');
  await page.goto('/expert/dashboard');
  await expect(page.locator('main')).toBeVisible();
  await expect(page).toHaveURL(/\/expert\/dashboard$/);
});

test('demo: Nam inbox contains only Admin, Quyen and Luc for assigned plot', async ({ readonlyPage: page }) => {
  await page.addInitScript(() => {
    const user = { userId: 5, id: 'USR-5', fullName: 'ThS. Nguyễn Hoàng Nam', role: 'EXPERT' };
    localStorage.setItem('farmely_auth', JSON.stringify({ user, token: 'demo-token-e2e' }));
    localStorage.setItem('farmely_user', JSON.stringify(user));
    localStorage.setItem('farmely_token', 'demo-token-e2e');
  });
  await page.goto('/expert/dashboard?tab=chat');
  await expect(page.getByRole('button', { name: /Tất cả \(3\)/ })).toBeVisible();
  await expect(page.getByText('Ban Quản Trị Farmely').first()).toBeVisible();
  await expect(page.getByText('Lô Thái Quyền').first()).toBeVisible();
  await expect(page.getByText('Trần Văn Lực').first()).toBeVisible();
  await expect(page.getByText('Phạm Thu Hương')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: /Tất cả \(3\)/ })).toBeVisible();
});
