import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Login from './Login';
import { useAuthStore } from '../../stores/authStore';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}{location.search}</output>;
}

let root;
let host;

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = null;
  host = null;
  act(() => useAuthStore.getState().logout());
});

async function renderLogin() {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/login?redirect=%2Fcustomer%2Fdashboard']}>
        <Login />
        <CurrentPath />
      </MemoryRouter>
    );
  });
  return host;
}

describe('login destination follows the authenticated role', () => {
  it.each([
    ['customer', '/customer/dashboard'],
    ['expert', '/expert/dashboard'],
    ['worker', '/staff/dashboard'],
    ['admin', '/admin/dashboard']
  ])('quick login for %s does not inherit another role redirect', async (account, expectedPath) => {
    const page = await renderLogin();
    const button = page.querySelector(`#quick-login-${account}`);

    await act(async () => {
      button.click();
    });

    expect(page.querySelector('[data-testid="current-path"]').textContent).toBe(expectedPath);
  });

  it('the role demo shortcut also routes a field worker to staff', async () => {
    const page = await renderLogin();
    const button = [...page.querySelectorAll('button')]
      .find((candidate) => candidate.textContent.includes('STAFF') && candidate.textContent.includes('Vào ngay'));

    await act(async () => {
      button.click();
    });

    expect(page.querySelector('[data-testid="current-path"]').textContent).toBe('/staff/dashboard');
    expect(useAuthStore.getState().user.userId).toBe(8);
  });
});
