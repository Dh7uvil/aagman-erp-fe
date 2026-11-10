export function syncCountToRows<T>(count: number, rows: T[], emptyRow: () => T): T[] {
  const next = rows.slice(0, count);
  while (next.length < count) {
    next.push(emptyRow());
  }
  return next;
}
