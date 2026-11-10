"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { materialsApi } from "@/modules/inventory/materials/api";
import { materialKeys } from "@/modules/inventory/materials/queries";
import type { MaterialCreateRequest, MaterialUpdateRequest } from "@/modules/inventory/materials/schemas";

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MaterialCreateRequest) => materialsApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MaterialUpdateRequest }) =>
      materialsApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all });
    },
  });
}
