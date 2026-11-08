import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../../stores/authStore';
import PublicNavbar from './PublicNavbar';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

const findButton = (text) => Array.from(document.querySelectorAll('button'))
  .find((button) => button.textContent.includes(text));

const click = async (element) => {
  expect(element).not.toBeUndefined();
  await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

beforeEach(async () => {
  localStorage.clear();
  useAuthStore.setState({
    isAuthenticated: true,
    user: {
      userId: 'USR-EXPERT-01',
      id: 'USR-EXPERT-01',
      fullName: 'Chuyên gia kiểm thử',
      email: 'expert@farmely.vn',
      role: 'EXPERT',
      roleTitle: 'Chuyên gia nông nghiệp'
    }
  });

  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/expert/dashboard']}>
        <PublicNavbar dashboardRailCollapsed={false} />
      </MemoryRouter>
    );
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.overflow = '';
  localStorage.clear();
});

describe('PublicNavbar account dialogs', () => {
  it('opens both profile and settings as complete body-level dialogs', async () => {
    await click(findButton('Chuyên gia kiểm thử'));
    await click(findButton('Hồ sơ cá nhân'));

    let dialog = document.querySelector('[role="dialog"]');
    expect(dialog.parentElement.parentElement).toBe(document.body);
    expect(dialog.textContent).toContain('Thông tin tài khoản');
    expect(dialog.querySelector('form')).not.toBeNull();

    await click(dialog.querySelector('button[aria-label="Đóng hộp thoại"]'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await click(findButton('Chuyên gia kiểm thử'));
    await click(findButton('Cài đặt tài khoản'));

    dialog = document.querySelector('[role="dialog"]');
    expect(dialog.parentElement.parentElement).toBe(document.body);
    expect(dialog.textContent).toContain('Bảo Mật & Mật Khẩu');
    expect(dialog.textContent).toContain('Lưu Cài Đặt');
  });
});
