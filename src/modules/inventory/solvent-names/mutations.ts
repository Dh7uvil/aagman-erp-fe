"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { solventNamesApi } from "@/modules/inventory/solvent-names/api";
import { solventNameKeys } from "@/modules/inventory/solvent-names/queries";
import type {
  SolventNameCreateRequest,
  SolventNameUpdateRequest,
} from "@/modules/inventory/solvent-names/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateSolventName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SolventNameCreateRequest) => solventNamesApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, solventNameKeys.allItems(true), data);
      void queryClient.invalidateQueries({ queryKey: solventNameKeys.all });
    },
  });
}

export function useUpdateSolventName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SolventNameUpdateRequest }) =>
      solventNamesApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: solventNameKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: solventNameKeys.usage(id) });
      void queryClient.invalidateQueries({ queryKey: solventNameKeys.all });
    },
  });
}

export function useDeleteSolventName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => solventNamesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solventNameKeys.all });
    },
  });
}
