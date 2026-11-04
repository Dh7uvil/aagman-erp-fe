"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { inkBrandsApi, inksApi } from "@/modules/inventory/inks/api";
import { inkBrandKeys, inkKeys } from "@/modules/inventory/inks/queries";
import type {
  InkBrandCreateRequest,
  InkSheetCreateRequest,
  InkSheetUpdateRequest,
  InkStockOutRequest,
} from "@/modules/inventory/inks/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateInkBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InkBrandCreateRequest) => inkBrandsApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, inkBrandKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: inkBrandKeys.all });
    },
  });
}

export function useCreateInkSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InkSheetCreateRequest) => inksApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.all });
    },
  });
}

export function useUpdateInkSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: InkSheetUpdateRequest }) =>
      inksApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: inkKeys.all });
    },
  });
}

export function useDeleteInkSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inksApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.all });
    },
  });
}

export function useInkStockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sheetId, values }: { sheetId: string; values: InkStockOutRequest }) =>
      inksApi.stockOut(sheetId, values),
    onSuccess: (_, { sheetId }) => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.detail(sheetId) });
      void queryClient.invalidateQueries({ queryKey: inkKeys.all });
    },
  });
}

export function useUploadInkFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      slot,
      file,
    }: {
      id: string;
      slot: "product_image" | "ink_image";
      file: File;
    }) => inksApi.uploadFile(id, slot, file),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.detail(id) });
    },
  });
}

export function useDeleteInkFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, slot }: { id: string; slot: "product_image" | "ink_image" }) =>
      inksApi.deleteFile(id, slot),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: inkKeys.detail(id) });
    },
  });
}
