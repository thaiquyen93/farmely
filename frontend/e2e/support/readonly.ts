import { test as base, expect, type Page } from '@playwright/test';

type Role = 'CUSTOMER' | 'STAFF' | 'EXPERT' | 'ADMIN';

// These specs may run against the developer's current database. Never forward writes.
export const test = base.extend<{ readonlyPage: Page }>({
  readonlyPage: async ({ page }, use) => {
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
        await route.abort('blockedbyclient');
      } else if (url.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        await route.abort('blockedbyclient');
      } else if (/\/api\/v1\/payments\/vnpay\/(return|ipn)$/.test(url.pathname)) {
        await route.abort('blockedbyclient');
      } else {
        await route.continue();
      }
    });
    await use(page);
  },
});

export { expect };

export async function asRole(page: Page, role: Role) {
  const user = {
    id: `e2e-${role.toLowerCase()}`,
    userId: 999999,
    fullName: `E2E ${role}`,
    email: `e2e-${role.toLowerCase()}@example.invalid`,
    role,
  };
  await page.addInitScript((value) => {
    localStorage.setItem('farmely_auth', JSON.stringify({ user: value, token: 'demo-token-e2e' }));
    localStorage.setItem('farmely_user', JSON.stringify(value));
    localStorage.setItem('farmely_token', 'demo-token-e2e');
  }, user);
}
