"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cylinderReturnsApi } from "@/modules/inventory/cylinder-returns/api";
import { cylinderReturnKeys } from "@/modules/inventory/cylinder-returns/queries";
import type { CylinderReturnFormValues } from "@/modules/inventory/cylinder-returns/schemas";
import { jobKeys } from "@/modules/inventory/jobs/queries";

export function useCreateCylinderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CylinderReturnFormValues) => cylinderReturnsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cylinderReturnKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useUpdateCylinderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CylinderReturnFormValues> }) =>
      cylinderReturnsApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderReturnKeys.all }),
  });
}

export function useDeleteCylinderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cylinderReturnsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cylinderReturnKeys.all });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
