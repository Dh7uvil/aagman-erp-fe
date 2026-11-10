"use client";

import { useQuery } from "@tanstack/react-query";

import { inkMovementsApi } from "@/modules/inventory/ink-movements/api";
import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

export const inkMovementKeys = {
  all: ["inventory", "ink-movements"] as const,
  report: (startDate: string, endDate: string) =>
    [...inkMovementKeys.all, "report", startDate, endDate] as const,
};

export function useInkDayReport(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: inkMovementKeys.report(startDate, endDate),
    queryFn: () => inkMovementsApi.report(startDate, endDate, LIST_COLUMN_TOTALS_PARAM),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
  });
}
