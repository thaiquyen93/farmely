const DASHBOARD_BY_ROLE = {
  CUSTOMER: '/customer/dashboard',
  ADMIN: '/admin/dashboard',
  EXPERT: '/expert/dashboard',
  STAFF: '/staff/dashboard'
};

const ROLE_REDIRECT_PREFIXES = {
  CUSTOMER: ['/customer/', '/marketplace', '/site-visit/', '/visit', '/payment/vnpay-return'],
  ADMIN: ['/admin/'],
  EXPERT: ['/expert/'],
  STAFF: ['/staff/', '/worker/']
};

export function normalizeRole(role) {
  const normalized = String(role || '').trim().toUpperCase();
  return ['FIELD_WORKER', 'FIELDWORKER', 'WORKER'].includes(normalized) ? 'STAFF' : normalized;
}

export function dashboardRouteForRole(role) {
  return DASHBOARD_BY_ROLE[normalizeRole(role)] || '/';
}

export function postLoginRouteForRole(role, redirectParam, origin = 'http://localhost') {
  const normalizedRole = normalizeRole(role);
  const dashboardRoute = DASHBOARD_BY_ROLE[normalizedRole];
  if (!dashboardRoute || !redirectParam) return dashboardRoute || '/';

  try {
    const target = new URL(redirectParam, origin);
    if (target.origin !== origin || !target.pathname.startsWith('/') || target.pathname.startsWith('//')) {
      return dashboardRoute;
    }
    const allowedPrefixes = ROLE_REDIRECT_PREFIXES[normalizedRole] || [];
    if (allowedPrefixes.some((prefix) => target.pathname.startsWith(prefix))) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    return dashboardRoute;
  }

  return dashboardRoute;
}
