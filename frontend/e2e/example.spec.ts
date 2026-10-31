import { test, expect } from "@playwright/test";

test("Customer Dashboard", async ({ page }) => {
  // 1. Mở Farmely
  await page.goto("http://localhost:3000/");

  // 2. Mở đăng nhập
  await page
    .getByRole("button", {
      name: "Đăng nhập",
    })
    .click();

  // 3. Đăng nhập bằng tài khoản demo
  await page
    .getByRole("button", {
      name: /CUSTOMER Vào ngay/,
    })
    .click();

  // 4. Kiểm tra URL
  await expect(page).toHaveURL(/\/customer\/dashboard/);

  // 5. Kiểm tra Dashboard
  await expect(
    page.getByRole("heading", {
      name: "Vườn của tôi",
    }),
  ).toBeVisible();
});
