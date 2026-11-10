"use client";

import { useQuery } from "@tanstack/react-query";

import { solventMovementsApi } from "@/modules/inventory/solvent-movements/api";
import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

export const solventMovementKeys = {
  all: ["inventory", "solvent-movements"] as const,
  report: (startDate: string, endDate: string) =>
    [...solventMovementKeys.all, "report", startDate, endDate] as const,
};

export function useSolventDayReport(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: solventMovementKeys.report(startDate, endDate),
    queryFn: () => solventMovementsApi.report(startDate, endDate, LIST_COLUMN_TOTALS_PARAM),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
  });
}
