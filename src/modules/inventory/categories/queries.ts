"use client";

import { useQuery } from "@tanstack/react-query";

import { categoriesApi } from "@/modules/inventory/categories/api";

export const categoryKeys = {
  all: ["inventory", "categories"] as const,
  allItems: () => [...categoryKeys.all, "all"] as const,
};

export function useAllCategories(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.allItems(),
    queryFn: categoriesApi.listAll,
    enabled,
  });
}
