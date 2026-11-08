import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;

beforeEach(() => {
  host = document.createElement('nav');
  host.style.overflow = 'hidden';
  host.style.height = '72px';
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.overflow = '';
});

describe('Modal', () => {
  it('portals the whole dialog outside clipping navbar ancestors', () => {
    act(() => {
      root.render(
        <Modal isOpen onClose={vi.fn()} title="Hồ Sơ Cá Nhân">
          <form data-testid="profile-form">Nội dung hồ sơ</form>
        </Modal>
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.parentElement.parentElement).toBe(document.body);
    expect(dialog.querySelector('[data-testid="profile-form"]')).not.toBeNull();
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('keeps the modal closed when isOpen is false', () => {
    act(() => {
      root.render(
        <Modal isOpen={false} onClose={vi.fn()} title="Cài Đặt Tài Khoản">
          Nội dung cài đặt
        </Modal>
      );
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
