"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { solventBrandsApi, solventsApi } from "@/modules/inventory/solvents/api";
import { solventBrandKeys, solventKeys } from "@/modules/inventory/solvents/queries";
import type {
  SolventBrandCreateRequest,
  SolventBrandUpdateRequest,
  SolventSheetCreateRequest,
  SolventSheetUpdateRequest,
  SolventStockOutRequest,
} from "@/modules/inventory/solvents/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateSolventBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SolventBrandCreateRequest) => solventBrandsApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, solventBrandKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: solventBrandKeys.all });
    },
  });
}

export function useUpdateSolventBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SolventBrandUpdateRequest }) =>
      solventBrandsApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: solventBrandKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: solventBrandKeys.all });
    },
  });
}

export function useDeleteSolventBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => solventBrandsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solventBrandKeys.all });
    },
  });
}

export function useCreateSolventSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: SolventSheetCreateRequest) => solventsApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solventKeys.all });
    },
  });
}

export function useUpdateSolventSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: SolventSheetUpdateRequest }) =>
      solventsApi.update(id, values),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(solventKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: solventKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: solventKeys.all });
    },
  });
}

export function useDeleteSolventSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => solventsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: solventKeys.all });
    },
  });
}

export function useSolventStockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sheetId, values }: { sheetId: string; values: SolventStockOutRequest }) =>
      solventsApi.stockOut(sheetId, values),
    onSuccess: (_, { sheetId }) => {
      void queryClient.invalidateQueries({ queryKey: solventKeys.detail(sheetId) });
      void queryClient.invalidateQueries({ queryKey: solventKeys.all });
    },
  });
}
