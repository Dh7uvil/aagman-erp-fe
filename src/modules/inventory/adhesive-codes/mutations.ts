"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adhesiveCodesApi } from "@/modules/inventory/adhesive-codes/api";
import { adhesiveCodeKeys } from "@/modules/inventory/adhesive-codes/queries";
import type {
  AdhesiveCodeCreateRequest,
  AdhesiveCodeUpdateRequest,
} from "@/modules/inventory/adhesive-codes/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateAdhesiveCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AdhesiveCodeCreateRequest) => adhesiveCodesApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, adhesiveCodeKeys.allItems(true), data);
      void queryClient.invalidateQueries({ queryKey: adhesiveCodeKeys.all });
    },
  });
}

export function useUpdateAdhesiveCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AdhesiveCodeUpdateRequest }) =>
      adhesiveCodesApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: adhesiveCodeKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: adhesiveCodeKeys.usage(id) });
      void queryClient.invalidateQueries({ queryKey: adhesiveCodeKeys.all });
    },
  });
}

export function useDeleteAdhesiveCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adhesiveCodesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adhesiveCodeKeys.all });
    },
  });
}
