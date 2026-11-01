import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  shouldShowExpertNote,
  splitLeadingTag,
  formatAgendaDate,
  groupTasksByDueDate
} from './staffTaskDisplay';

describe('staffTaskDisplay', () => {
  it('normalizeText trims, collapses whitespace and lowercases', () => {
    expect(normalizeText('  Tưới   NƯỚC \n sáng ')).toBe('tưới nước sáng');
    expect(normalizeText(null)).toBe('');
  });

  it('shouldShowExpertNote hides empty, identical and contained notes', () => {
    expect(shouldShowExpertNote('', 'Tưới nước')).toBe(false);
    expect(shouldShowExpertNote('Tưới nước  sáng', 'tưới nước sáng')).toBe(false);
    expect(shouldShowExpertNote('tưới nước', 'Tưới nước sáng sớm trước 7h')).toBe(false);
    expect(shouldShowExpertNote('Không bón phân khi trời mưa', 'Tưới nước sáng sớm')).toBe(true);
    expect(shouldShowExpertNote('Kiểm tra lá', '')).toBe(true);
  });

  it('splitLeadingTag separates a leading [..] tag', () => {
    expect(splitLeadingTag('[DỊCH VỤ KHÁCH YÊU CẦU] Tưới nước bổ sung')).toEqual({ tag: 'DỊCH VỤ KHÁCH YÊU CẦU', text: 'Tưới nước bổ sung' });
    expect(splitLeadingTag('Làm cỏ luống')).toEqual({ tag: null, text: 'Làm cỏ luống' });
  });

  it('formatAgendaDate renders the Vietnamese weekday without UTC shift', () => {
    expect(formatAgendaDate('2026-11-04')).toBe('Thứ 4, 04/11');
    expect(formatAgendaDate('2026-11-08')).toBe('Chủ nhật, 08/11');
    expect(formatAgendaDate('08:30 AM')).toBe('08:30 AM');
  });

  it('groupTasksByDueDate orders dates ascending with undated last', () => {
    const tasks = [
      { id: 'a', dueDate: '2026-11-06' },
      { id: 'b', dueDate: null },
      { id: 'c', dueDate: '2026-11-04' },
      { id: 'd', dueDate: '2026-11-06' }
    ];
    const groups = groupTasksByDueDate(tasks);
    expect(groups.map((g) => g.date)).toEqual(['2026-11-04', '2026-11-06', null]);
    expect(groups[1].tasks.map((t) => t.id)).toEqual(['a', 'd']);
  });
});
