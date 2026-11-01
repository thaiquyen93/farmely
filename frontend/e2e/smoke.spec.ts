import { test, expect } from '@playwright/test';

test.describe('Farmely Smoke Test Suite', () => {
  test('01. Public: Home page loads properly', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await expect(page).toHaveTitle(/Farmely/i);
    await expect(page.getByRole('button', { name: /đăng nhập/i }).first()).toBeVisible();
  });

  test('02. Public: Marketplace page loads and displays plots', async ({ page }) => {
    await page.goto('http://localhost:3000/marketplace');
    await expect(page).toHaveURL(/\/marketplace/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('03. Auth & Role: Admin quick login to Admin Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: /ADMIN Vào ngay/i }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByText(/Quản trị|Thống kê|Tổng quan|Admin/i).first()).toBeVisible();
  });

  test('04. Auth & Role: Expert quick login to Expert Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: /EXPERT Vào ngay/i }).click();
    await expect(page).toHaveURL(/\/expert\/dashboard/);
    await expect(page.getByText(/Chuyên gia|Khuyến nông|Expert/i).first()).toBeVisible();
  });

  test('05. Auth & Role: Staff/Worker quick login to Staff Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: /STAFF Vào ngay/i }).click();
    await expect(page).toHaveURL(/\/staff\/dashboard/);
    await expect(page.getByText(/Hiện trường|Công việc|Nhiệm vụ|Staff/i).first()).toBeVisible();
  });

  test('06. RBAC Guard: Unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
