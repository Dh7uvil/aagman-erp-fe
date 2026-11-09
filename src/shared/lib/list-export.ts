/** Request full filtered numeric totals alongside paginated list data. */
export const LIST_COLUMN_TOTALS_PARAM = {
  include_column_totals: true,
} as const;

export type ExportRowScope = "filtered" | "all";
