import { test, expect, asRole } from './support/readonly';

test('smoke: anonymous user is sent to login from each protected dashboard', async ({ readonlyPage: page }) => {
  for (const role of ['customer', 'staff', 'expert', 'admin']) {
    await page.goto(`/${role}/dashboard`);
    await expect(page).toHaveURL(/\/login$/);
  }
});

test('negative: empty login form does not authenticate', async ({ readonlyPage: page }) => {
  await page.goto('/login');
  await expect(page.locator('form input[type="email"]')).toBeVisible();
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('.bg-rose-50').first()).toContainText('Email');
});

test('authorization: customer cannot open admin dashboard', async ({ readonlyPage: page }) => {
  await asRole(page, 'CUSTOMER');
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Vườn của tôi' })).toBeVisible();
});

test('negative: registration rejects invalid contact and password before API call', async ({ readonlyPage: page }) => {
  await page.goto('/register');
  await page.locator('form input').nth(0).fill('A');
  await page.locator('form input[type="email"]').fill('invalid@example.com');
  await page.locator('form input[type="tel"]').fill('123');
  await page.locator('form input[type="password"]').nth(0).fill('weak');
  await page.locator('form input[type="password"]').nth(1).fill('different');
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText('Password must contain at least 8 characters with uppercase, lowercase, and numbers.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});
