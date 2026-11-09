"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { inkColorsApi } from "@/modules/inventory/ink-colors/api";
import { inkColorKeys } from "@/modules/inventory/ink-colors/queries";
import type { InkColorCreateRequest, InkColorUpdateRequest } from "@/modules/inventory/ink-colors/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateInkColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InkColorCreateRequest) => inkColorsApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, inkColorKeys.allItems(true), data);
      void queryClient.invalidateQueries({ queryKey: inkColorKeys.all });
    },
  });
}

export function useUpdateInkColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: InkColorUpdateRequest }) =>
      inkColorsApi.update(id, values),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: inkColorKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: inkColorKeys.usage(id) });
      void queryClient.invalidateQueries({ queryKey: inkColorKeys.all });
    },
  });
}

export function useDeleteInkColor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inkColorsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inkColorKeys.all });
    },
  });
}
