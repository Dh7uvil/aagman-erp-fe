"use client";

import { useQuery } from "@tanstack/react-query";

import { movementsApi } from "@/modules/inventory/movements/api";
import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

export const movementKeys = {
  all: ["inventory", "materials-report"] as const,
  report: (startDate: string, endDate: string) =>
    [...movementKeys.all, startDate, endDate] as const,
};

export function useDayReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: movementKeys.report(startDate, endDate),
    queryFn: () => movementsApi.report(startDate, endDate, LIST_COLUMN_TOTALS_PARAM),
    enabled: Boolean(startDate) && Boolean(endDate),
  });
}
