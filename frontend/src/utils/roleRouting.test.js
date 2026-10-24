import { describe, expect, it } from 'vitest';
import { dashboardRouteForRole, normalizeRole, postLoginRouteForRole } from './roleRouting';

describe('role-based login routing', () => {
  it.each([
    ['CUSTOMER', '/customer/dashboard'],
    ['ADMIN', '/admin/dashboard'],
    ['EXPERT', '/expert/dashboard'],
    ['STAFF', '/staff/dashboard'],
    ['FIELD_WORKER', '/staff/dashboard'],
    ['worker', '/staff/dashboard']
  ])('routes %s to its own dashboard', (role, expected) => {
    expect(dashboardRouteForRole(role)).toBe(expected);
  });

  it('does not let a customer redirect send staff to the customer dashboard', () => {
    expect(postLoginRouteForRole('FIELD_WORKER', '/customer/dashboard')).toBe('/staff/dashboard');
  });

  it('keeps a same-role redirect, such as a customer booking flow', () => {
    expect(postLoginRouteForRole('CUSTOMER', '/marketplace/plot/P-01/book?mode=self')).toBe('/marketplace/plot/P-01/book?mode=self');
  });

  it('rejects cross-role and external redirects', () => {
    expect(postLoginRouteForRole('STAFF', '/expert/dashboard')).toBe('/staff/dashboard');
    expect(postLoginRouteForRole('STAFF', 'https://example.com')).toBe('/staff/dashboard');
  });

  it('normalizes legacy role spellings consistently', () => {
    expect(normalizeRole(' field_worker ')).toBe('STAFF');
    expect(normalizeRole('FIELDWORKER')).toBe('STAFF');
  });
});
