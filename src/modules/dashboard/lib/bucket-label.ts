import { formatDate } from "@/shared/lib/format";

/** Axis label in dd/mm/yyyy. Tick gap on the chart keeps crowded ranges readable. */
export function formatBucketLabel(value: string | null | undefined): string {
  return formatDate(value);
}
