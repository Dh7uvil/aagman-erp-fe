"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory/categories/api";
import { categoryKeys } from "@/modules/inventory/categories/queries";
import type { CategoryCreateRequest, CategoryUpdateRequest } from "@/modules/inventory/categories/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryCreateRequest) => categoriesApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, categoryKeys.allItems(data.company_id ?? undefined), data);
      upsertQueryListItem(queryClient, categoryKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryUpdateRequest }) =>
      categoriesApi.update(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
