import { test, expect } from '@playwright/test';

// Assert HTTP status only. These tests never print response bodies from private endpoints.
test('F2-19 Anonymous caller cannot read an existing contract', async ({ request }) => {
  const response = await request.get('/api/contracts/1');
  expect([401, 403, 404]).toContain(response.status());
});

test('F3-23 Anonymous caller cannot enumerate tasks, issues or conversations', async ({ request }) => {
  for (const endpoint of ['/api/care-tasks', '/api/issue-reports', '/api/conversations']) {
    const response = await request.get(endpoint);
    expect([401, 403], `${endpoint} should require authentication`).toContain(response.status());
  }
});

test('F4-11 Anonymous caller cannot read Admin analytics', async ({ request }) => {
  const response = await request.get('/api/admin/analytics');
  expect([401, 403]).toContain(response.status());
});
