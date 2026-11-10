"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tablePreferencesApi } from "@/shared/table-preferences/api";
import { tablePreferenceKeys } from "@/shared/table-preferences/queries";
import type { TablePreference, TablePreferenceUpdate } from "@/shared/table-preferences/schemas";

export function useSaveTableColumnPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = tablePreferenceKeys.detail(tableKey);
  return useMutation({
    mutationFn: (values: TablePreferenceUpdate) => tablePreferencesApi.put(tableKey, values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TablePreference>(queryKey);
      queryClient.setQueryData<TablePreference>(queryKey, {
        table_key: tableKey,
        visible_columns: values.visible_columns,
        column_order: values.column_order,
        is_default: false,
        export_visible_columns: previous?.export_visible_columns ?? values.visible_columns,
        export_column_order: previous?.export_column_order ?? values.column_order,
        export_format: previous?.export_format ?? null,
        export_is_default: previous?.export_is_default ?? true,
      });
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}

export function useResetTableColumnPreferences(tableKey: string) {
  const queryClient = useQueryClient();
  const queryKey = tablePreferenceKeys.detail(tableKey);
  return useMutation({
    mutationFn: () => tablePreferencesApi.reset(tableKey),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TablePreference>(queryKey);
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
