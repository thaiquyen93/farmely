import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import IssueAssignmentPanel, { PRIORITY_OPTIONS } from './IssueAssignmentPanel';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const workers = [
  { id: 8, name: 'Trần Văn Lực', role: 'Tổ trưởng CVLĐ (Khu A & B)' },
  { id: 9, name: 'Nguyễn Văn Đạt', role: 'Kỹ thuật viên tưới & thổ nhưỡng' },
];

let host;
let root;

const renderPanel = (overrides = {}) => {
  const props = {
    workers,
    workerId: 8,
    onWorkerChange: vi.fn(),
    dueDate: '2026-06-01',
    onDueDateChange: vi.fn(),
    priority: 'HIGH',
    onPriorityChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    hasDiagnosis: true,
    ...overrides,
  };
  act(() => {
    root.render(<IssueAssignmentPanel {...props} />);
  });
  return props;
};

const getSubmitButton = () =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent.includes('CVLĐ') || b.textContent.includes('Đang giao'));

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = ReactDOM.createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('IssueAssignmentPanel', () => {
  it('marks the selected priority and reports clicks with the option id', () => {
    const props = renderPanel();
    const radios = host.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(PRIORITY_OPTIONS.length);
    const high = Array.from(radios).find((r) => r.textContent.includes('Ưu tiên cao'));
    expect(high.getAttribute('aria-checked')).toBe('true');

    const emergency = Array.from(radios).find((r) => r.textContent.includes('Làm ngay'));
    expect(emergency.getAttribute('aria-checked')).toBe('false');
    act(() => emergency.click());
    expect(props.onPriorityChange).toHaveBeenCalledWith('EMERGENCY');
  });

  it('enables the submit button when a due date is set', () => {
    const props = renderPanel();
    const button = getSubmitButton();
    expect(button.textContent).toContain('Giao việc cho CVLĐ');
    expect(button.disabled).toBe(false);
    act(() => button.click());
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the submit button and shows a hint without a due date', () => {
    renderPanel({ dueDate: '' });
    const button = getSubmitButton();
    expect(button.disabled).toBe(true);
    expect(host.textContent).toContain('Chọn hạn hoàn thành để giao việc.');
  });

  it('shows the loading label and disables the button while submitting', () => {
    renderPanel({ isSubmitting: true });
    const button = getSubmitButton();
    expect(button.textContent).toContain('Đang giao việc...');
    expect(button.disabled).toBe(true);
  });

  it('shows the assigned-task card and the follow-up label once assigned', () => {
    renderPanel({ assignedTaskCode: 'TSK-001', assignedWorkerName: 'Trần Văn Lực', assignedDueDate: '2026-06-02' });
    expect(host.textContent).toContain('Đã phát lệnh: TSK-001');
    expect(getSubmitButton().textContent).toContain('Giao thêm việc cho CVLĐ');
  });

  it('reports the selected worker id as a number', () => {
    const props = renderPanel();
    const select = host.querySelector('select');
    expect(host.querySelector(`label[for="${select.id}"]`)).not.toBeNull();
    act(() => {
      select.value = '9';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(props.onWorkerChange).toHaveBeenCalledWith(9);
  });
});
