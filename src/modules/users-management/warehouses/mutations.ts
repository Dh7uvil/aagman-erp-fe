"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { warehousesApi } from "@/modules/users-management/warehouses/api";
import { warehouseKeys } from "@/modules/users-management/warehouses/queries";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

async function invalidateWarehouses(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: warehousesApi.create,
    onSuccess: async (data) => {
      upsertQueryListItem(queryClient, warehouseKeys.allItems(), data);
      await invalidateWarehouses(queryClient);
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof warehousesApi.update>[1];
    }) => warehousesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateWarehouses(queryClient);
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(id) });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: warehousesApi.delete,
    onSuccess: async () => {
      await invalidateWarehouses(queryClient);
    },
  });
}
