"use client";

import { useQuery } from "@tanstack/react-query";

import { adhesiveMovementsApi } from "@/modules/inventory/adhesive-movements/api";

export const adhesiveMovementKeys = {
  all: ["inventory", "adhesive-movements"] as const,
  report: (date: string) => [...adhesiveMovementKeys.all, "report", date] as const,
};

export function useAdhesiveDayReport(date: string, enabled = true) {
  return useQuery({
    queryKey: adhesiveMovementKeys.report(date),
    queryFn: () => adhesiveMovementsApi.report(date),
    enabled: enabled && Boolean(date),
  });
}
