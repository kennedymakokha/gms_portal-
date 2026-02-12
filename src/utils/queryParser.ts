export const parseQueryParam = (value?: string) => {
  if (!value || value === 'undefined' || value === 'null') {
    return undefined;
  }
  return value.trim();
};
