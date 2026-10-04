export function parseInterests(text) {
  return [
    ...new Set(
      text
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

export function formatInterests(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}
