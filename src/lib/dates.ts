/** Parse YYYY-MM-DD or ISO datetime strings from HTML date inputs and APIs. */
export function parseFormDate(value: string): Date {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`);
  }
  return new Date(trimmed);
}

export function isValidFormDate(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
  return !Number.isNaN(Date.parse(trimmed));
}
