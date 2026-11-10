"use client";

import { useQuery } from "@tanstack/react-query";

import { tablePreferencesApi } from "@/shared/table-preferences/api";

export const tablePreferenceKeys = {
  all: ["table-preferences"] as const,
  detail: (tableKey: string) => [...tablePreferenceKeys.all, tableKey] as const,
};

export function useTableColumnPreferences(tableKey: string) {
  return useQuery({
    queryKey: tablePreferenceKeys.detail(tableKey),
    queryFn: () => tablePreferencesApi.get(tableKey),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
