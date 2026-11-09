"use client";

import { useQuery } from "@tanstack/react-query";

import { movementsApi } from "@/modules/inventory/movements/api";

export const movementKeys = {
  all: ["inventory", "materials-report"] as const,
  report: (startDate: string, endDate: string) =>
    [...movementKeys.all, startDate, endDate] as const,
};

export function useDayReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: movementKeys.report(startDate, endDate),
    queryFn: () => movementsApi.report(startDate, endDate),
    enabled: Boolean(startDate) && Boolean(endDate),
  });
}
