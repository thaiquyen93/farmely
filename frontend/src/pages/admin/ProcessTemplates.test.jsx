import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProcessTemplates from './ProcessTemplates';

vi.mock('../../stores/authStore', () => ({ useAuthStore: () => ({ user: { role: 'EXPERT', userId: 5 } }) }));
vi.mock('../../components/common/DataTable', () => ({ default: ({ data }) => <div data-testid="template-list">{data.map((item) => item.name).join('|')}</div> }));
vi.mock('../../components/common/Modal', () => ({ default: ({ isOpen, children }) => isOpen ? <div>{children}</div> : null }));

const templates = Array.from({ length: 10 }, (_, index) => ({
  templateId: index + 1,
  varietyId: index + 1,
  name: `Quy trình ${index + 1}`
}));
const varieties = Array.from({ length: 14 }, (_, index) => ({
  varietyId: index + 1,
  varietyName: `Giống ${index + 1}`
}));

describe('ProcessTemplates route state', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: url === '/api/varieties' ? varieties : templates })
    })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function renderAt(url) {
    await act(async () => {
      root.render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/expert/dashboard" element={<ProcessTemplates detailBasePath="/expert/process-templates" />} /></Routes></MemoryRouter>);
    });
  }

  it('shows all ten processes and preselects variety 14 for creation', async () => {
    await renderAt('/expert/dashboard?tab=templates&varietyId=14&mode=create');
    expect(container.querySelector('[data-testid="template-list"]').textContent.split('|')).toHaveLength(10);
    expect(container.textContent).toContain('10 Quy trình');
    const createButton = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Soạn Quy Trình Mới'));
    await act(async () => createButton.click());
    expect(container.querySelector('select[id="áp-dụng-cho-giống-cây-trồng"]').value).toBe('14');
  });

  it('shows only the selected process and clears the filter', async () => {
    await renderAt('/expert/dashboard?tab=templates&varietyId=10');
    expect(container.querySelector('[data-testid="template-list"]').textContent).toBe('Quy trình 10');
    expect(container.textContent).toContain('1 kết quả cho giống Giống 10');
    const clearButton = [...container.querySelectorAll('button')].find((button) => button.textContent.includes('Xem tất cả quy trình'));
    await act(async () => clearButton.click());
    expect(container.querySelector('[data-testid="template-list"]').textContent.split('|')).toHaveLength(10);
    expect(container.textContent).toContain('10 Quy trình');
  });
});
