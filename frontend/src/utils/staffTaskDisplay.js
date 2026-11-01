// Pure display helpers for the field-staff (CVLĐ) task agenda.
// They only shape how task data is shown; they never change task data or status.

export const normalizeText = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

// Show the CGNN note only when it adds information beyond the task description.
export const shouldShowExpertNote = (notes, instructions) => {
  const n = normalizeText(notes);
  if (!n) return false;
  const i = normalizeText(instructions);
  if (!i) return true;
  return !(n === i || i.includes(n));
};

// "[DỊCH VỤ KHÁCH YÊU CẦU] Tưới nước" -> { tag: 'DỊCH VỤ KHÁCH YÊU CẦU', text: 'Tưới nước' }
export const splitLeadingTag = (text) => {
  const value = String(text ?? '');
  const match = value.match(/^\s*\[([^\]]+)\]\s*(.*)$/s);
  if (!match) return { tag: null, text: value };
  return { tag: match[1].trim(), text: match[2].trim() };
};

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// "2026-11-04" -> "Thứ 4, 04/11". Parsed manually to avoid UTC shifts.
export const formatAgendaDate = (yyyyMmDd) => {
  const match = String(yyyyMmDd ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return yyyyMmDd;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime()) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return yyyyMmDd;
  return `${WEEKDAYS[date.getDay()]}, ${d}/${m}`;
};

// Ordered [{ date, tasks }] with ascending dates; undated tasks (date: null) last.
export const groupTasksByDueDate = (tasks) => {
  const groups = new Map();
  (tasks || []).forEach((task) => {
    const key = task?.dueDate || null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a < b ? -1 : 1;
    })
    .map(([date, groupTasks]) => ({ date, tasks: groupTasks }));
};
