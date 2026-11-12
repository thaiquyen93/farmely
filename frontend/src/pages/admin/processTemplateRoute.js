export function processTemplateRoute(basePath, varietyId, hasTemplate = true) {
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}varietyId=${encodeURIComponent(varietyId)}${hasTemplate ? '' : '&mode=create'}`;
}
