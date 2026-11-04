"use client";

import { useQuery } from "@tanstack/react-query";

import { inkMovementsApi } from "@/modules/inventory/ink-movements/api";

export const inkMovementKeys = {
  all: ["inventory", "ink-movements"] as const,
  report: (date: string) => [...inkMovementKeys.all, "report", date] as const,
};

export function useInkDayReport(date: string, enabled = true) {
  return useQuery({
    queryKey: inkMovementKeys.report(date),
    queryFn: () => inkMovementsApi.report(date),
    enabled: enabled && Boolean(date),
  });
}
