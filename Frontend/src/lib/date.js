export function toLocalDateInputValue(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}
