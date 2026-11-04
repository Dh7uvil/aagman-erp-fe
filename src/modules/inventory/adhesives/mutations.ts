"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adhesiveBrandsApi, adhesivesApi } from "@/modules/inventory/adhesives/api";
import { adhesiveBrandKeys, adhesiveKeys } from "@/modules/inventory/adhesives/queries";
import type {
  AdhesiveBrandCreateRequest,
  AdhesiveBrandUpdateRequest,
  AdhesiveSheetCreateRequest,
  AdhesiveSheetUpdateRequest,
  AdhesiveStockOutRequest,
} from "@/modules/inventory/adhesives/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateAdhesiveBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AdhesiveBrandCreateRequest) => adhesiveBrandsApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, adhesiveBrandKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: adhesiveBrandKeys.all });
    },
  });
}

export function useUpdateAdhesiveBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AdhesiveBrandUpdateRequest }) =>
      adhesiveBrandsApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: adhesiveBrandKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: adhesiveBrandKeys.all });
    },
  });
}

export function useDeleteAdhesiveBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adhesiveBrandsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adhesiveBrandKeys.all });
    },
  });
}

export function useCreateAdhesiveSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AdhesiveSheetCreateRequest) => adhesivesApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.all });
    },
  });
}

export function useUpdateAdhesiveSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AdhesiveSheetUpdateRequest }) =>
      adhesivesApi.update(id, values),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(adhesiveKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.all });
    },
  });
}

export function useDeleteAdhesiveSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adhesivesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.all });
    },
  });
}

export function useAdhesiveStockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sheetId, values }: { sheetId: string; values: AdhesiveStockOutRequest }) =>
      adhesivesApi.stockOut(sheetId, values),
    onSuccess: (_, { sheetId }) => {
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.detail(sheetId) });
      void queryClient.invalidateQueries({ queryKey: adhesiveKeys.all });
    },
  });
}
