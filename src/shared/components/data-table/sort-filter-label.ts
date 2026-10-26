import type { SortFieldOption } from "@/shared/components/data-table/sort";
import type { SortOrder } from "@/shared/hooks/use-table-params";

export function sortFilterPillLabel(
  sortBy: string | undefined,
  sortOrder: SortOrder | undefined,
  fields: readonly SortFieldOption[],
): string | null {
  if (!sortBy) {
    return null;
  }
  const fieldLabel = fields.find((field) => field.value === sortBy)?.label ?? sortBy;
  const orderLabel = sortOrder === "desc" ? "descending" : "ascending";
  return `Sort: ${fieldLabel} (${orderLabel})`;
}
