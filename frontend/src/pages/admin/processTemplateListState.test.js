import { describe, expect, it } from 'vitest';
import { getProcessTemplateListState } from './processTemplateListState';

const templates = [{ varietyId: 10, id: 1 }, { varietyId: 11, id: 2 }];

describe('process template list state', () => {
  it('shows every template while preparing an unconfigured variety', () => {
    expect(getProcessTemplateListState(templates, '14', 'create')).toMatchObject({
      isFiltered: false, visibleTemplates: templates, matchingCount: 0
    });
  });

  it('filters a configured variety and reports its result count', () => {
    expect(getProcessTemplateListState(templates, '10', null)).toMatchObject({
      isFiltered: true, visibleTemplates: [templates[0]], matchingCount: 1
    });
  });

  it('falls back to all templates for a variety with no process', () => {
    expect(getProcessTemplateListState(templates, '14', null)).toMatchObject({
      isFiltered: false, visibleTemplates: templates, matchingCount: 0
    });
  });
});
