/** Short axis label (e.g. "29 Oct") so time buckets stay readable on narrow screens. */
export function formatBucketLabel(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
