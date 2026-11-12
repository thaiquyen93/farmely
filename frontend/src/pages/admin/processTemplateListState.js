export function getProcessTemplateListState(templates, requestedVarietyId, mode) {
  const matching = requestedVarietyId
    ? templates.filter((template) => String(template.varietyId) === String(requestedVarietyId))
    : [];
  const isFiltered = Boolean(requestedVarietyId && mode !== 'create' && matching.length > 0);
  return {
    isFiltered,
    visibleTemplates: isFiltered ? matching : templates,
    matchingCount: matching.length
  };
}
