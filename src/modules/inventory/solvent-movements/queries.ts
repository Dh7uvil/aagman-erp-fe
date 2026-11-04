"use client";

import { useQuery } from "@tanstack/react-query";

import { solventMovementsApi } from "@/modules/inventory/solvent-movements/api";

export const solventMovementKeys = {
  all: ["inventory", "solvent-movements"] as const,
  report: (date: string) => [...solventMovementKeys.all, "report", date] as const,
};

export function useSolventDayReport(date: string, enabled = true) {
  return useQuery({
    queryKey: solventMovementKeys.report(date),
    queryFn: () => solventMovementsApi.report(date),
    enabled: enabled && Boolean(date),
  });
}
