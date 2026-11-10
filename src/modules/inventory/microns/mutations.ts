"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { micronsApi } from "@/modules/inventory/microns/api";
import { micronKeys } from "@/modules/inventory/microns/queries";
import { materialKeys } from "@/modules/inventory/materials/queries";
import type { MicronCreateRequest, MicronUpdateRequest } from "@/modules/inventory/microns/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateMicron() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MicronCreateRequest) => micronsApi.create(values),
    onSuccess: (data, variables) => {
      upsertQueryListItem(
        queryClient,
        micronKeys.listItems(variables.product_id, true),
        data,
      );
      upsertQueryListItem(
        queryClient,
        micronKeys.listItems(variables.product_id, false),
        data,
      );
      void queryClient.invalidateQueries({ queryKey: micronKeys.all });
    },
  });
}

export function useUpdateMicron() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MicronUpdateRequest }) =>
      micronsApi.update(id, values),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: micronKeys.all });
      void queryClient.invalidateQueries({ queryKey: micronKeys.allItems(data.product_id) });
      void queryClient.invalidateQueries({ queryKey: micronKeys.listItems(data.product_id, true) });
      void queryClient.invalidateQueries({ queryKey: micronKeys.listItems(data.product_id, false) });
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}
