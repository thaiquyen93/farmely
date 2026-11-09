import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthRequiredBookingModal from './AuthRequiredBookingModal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.overflow = '';
});

describe('AuthRequiredBookingModal', () => {
  const samplePlot = {
    code: 'P-04',
    name: 'Thửa P-04',
    area: '160 m²',
    formattedPrice: '1.300.000 đ'
  };

  it('renders correctly with plot info and action buttons matching the design', () => {
    const onLogin = vi.fn();
    const onQuickDemo = vi.fn();
    const onRegister = vi.fn();
    const onViewMap = vi.fn();
    const onClose = vi.fn();

    act(() => {
      root.render(
        <AuthRequiredBookingModal
          isOpen={true}
          onClose={onClose}
          plot={samplePlot}
          onLogin={onLogin}
          onQuickDemoLogin={onQuickDemo}
          onRegister={onRegister}
          onViewMap={onViewMap}
        />
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Đăng Nhập Để Tiếp Tục');
    expect(dialog.textContent).toContain('P-04 • Thửa P-04');
    expect(dialog.textContent).toContain('160 m²');
    expect(dialog.textContent).toContain('1.300.000 đ');
    expect(dialog.textContent).toContain('ĐĂNG NHẬP NGAY');
    expect(dialog.textContent).toContain('Đăng nhập nhanh (Tài khoản mẫu Khách Hàng)');
    expect(dialog.textContent).toContain('Chưa có tài khoản?');
    expect(dialog.textContent).toContain('Xem trên bản đồ trước');
  });

  it('triggers login callbacks on button clicks', () => {
    const onLogin = vi.fn();
    const onQuickDemo = vi.fn();

    act(() => {
      root.render(
        <AuthRequiredBookingModal
          isOpen={true}
          onClose={vi.fn()}
          plot={samplePlot}
          onLogin={onLogin}
          onQuickDemoLogin={onQuickDemo}
        />
      );
    });

    const loginBtn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('ĐĂNG NHẬP NGAY')
    );
    expect(loginBtn).toBeTruthy();
    act(() => {
      loginBtn.click();
    });
    expect(onLogin).toHaveBeenCalledTimes(1);

    const quickDemoBtn = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.includes('Đăng nhập nhanh')
    );
    expect(quickDemoBtn).toBeTruthy();
    act(() => {
      quickDemoBtn.click();
    });
    expect(onQuickDemo).toHaveBeenCalledTimes(1);
  });
});

