"use client";

import { useQuery } from "@tanstack/react-query";

import { adhesiveMovementsApi } from "@/modules/inventory/adhesive-movements/api";
import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

export const adhesiveMovementKeys = {
  all: ["inventory", "adhesive-movements"] as const,
  report: (startDate: string, endDate: string) =>
    [...adhesiveMovementKeys.all, "report", startDate, endDate] as const,
};

export function useAdhesiveDayReport(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: adhesiveMovementKeys.report(startDate, endDate),
    queryFn: () => adhesiveMovementsApi.report(startDate, endDate, LIST_COLUMN_TOTALS_PARAM),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
  });
}
