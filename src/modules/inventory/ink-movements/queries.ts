"use client";

import { useQuery } from "@tanstack/react-query";

import { inkMovementsApi } from "@/modules/inventory/ink-movements/api";

export const inkMovementKeys = {
  all: ["inventory", "ink-movements"] as const,
  report: (startDate: string, endDate: string) =>
    [...inkMovementKeys.all, "report", startDate, endDate] as const,
};

export function useInkDayReport(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: inkMovementKeys.report(startDate, endDate),
    queryFn: () => inkMovementsApi.report(startDate, endDate),
    enabled: enabled && Boolean(startDate) && Boolean(endDate),
  });
}
