"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory/categories/api";

export const categoryKeys = {
  all: ["inventory", "categories"] as const,
  allItems: (companyId?: string) => [...categoryKeys.all, "all", companyId ?? "all"] as const,
};

export function useAllCategories(companyId?: string, enabled = true) {
  return useQuery({
    queryKey: categoryKeys.allItems(companyId),
    queryFn: () => categoriesApi.listAll(companyId),
    enabled,
  });
}
