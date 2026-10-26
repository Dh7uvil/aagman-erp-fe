"use client";

import { useQuery } from "@tanstack/react-query";

import { movementsApi } from "@/modules/inventory/movements/api";

export const movementKeys = {
  all: ["inventory", "materials-report"] as const,
  report: (date: string) => [...movementKeys.all, date] as const,
};

export function useDayReport(date: string) {
  return useQuery({
    queryKey: movementKeys.report(date),
    queryFn: () => movementsApi.report(date),
    enabled: Boolean(date),
  });
}
