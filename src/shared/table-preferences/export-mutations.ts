"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tablePreferencesApi } from "@/shared/table-preferences/api";
import { tablePreferenceKeys } from "@/shared/table-preferences/queries";
import type { TableExportPreferenceUpdate, TablePreference } from "@/shared/table-preferences/schemas";

export function useSaveTableExportPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = tablePreferenceKeys.detail(tableKey);
  return useMutation({
    mutationFn: (values: TableExportPreferenceUpdate) =>
      tablePreferencesApi.putExport(tableKey, values),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

export function useResetTableExportPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = tablePreferenceKeys.detail(tableKey);
  return useMutation({
    mutationFn: () => tablePreferencesApi.resetExport(tableKey),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
