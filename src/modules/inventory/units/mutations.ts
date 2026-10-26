"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { unitsApi } from "@/modules/inventory/units/api";
import { unitKeys } from "@/modules/inventory/units/queries";
import type { UnitCreateRequest, UnitUpdateRequest } from "@/modules/inventory/units/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UnitCreateRequest) => unitsApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, unitKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: UnitUpdateRequest }) =>
      unitsApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unitsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}
