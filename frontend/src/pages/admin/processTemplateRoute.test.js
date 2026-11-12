import { describe, expect, it } from 'vitest';
import { processTemplateRoute } from './processTemplateRoute';

describe('variety process navigation', () => {
  it('preserves the admin route and selected variety', () => {
    expect(processTemplateRoute('/admin/master-data/process-templates', 12))
      .toBe('/admin/master-data/process-templates?varietyId=12');
  });

  it('opens the expert templates tab with the selected variety', () => {
    expect(processTemplateRoute('/expert/dashboard?tab=templates', 12))
      .toBe('/expert/dashboard?tab=templates&varietyId=12');
  });

  it('marks the create path so the full list remains visible', () => {
    expect(processTemplateRoute('/expert/dashboard?tab=templates', 14, false))
      .toBe('/expert/dashboard?tab=templates&varietyId=14&mode=create');
  });
});
