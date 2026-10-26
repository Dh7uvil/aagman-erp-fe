"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory/categories/api";
import { categoryKeys } from "@/modules/inventory/categories/queries";
import type { CategoryCreateRequest } from "@/modules/inventory/categories/schemas";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CategoryCreateRequest) => categoriesApi.create(values),
    onSuccess: (data) => {
      upsertQueryListItem(queryClient, categoryKeys.allItems(), data);
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
