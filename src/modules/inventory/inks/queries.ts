"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { inkBrandsApi, inksApi } from "@/modules/inventory/inks/api";
import type { InkBrandListParams, InkListParams } from "@/modules/inventory/inks/schemas";

export const inkBrandKeys = {
  all: ["inventory", "ink-brands"] as const,
  allItems: () => [...inkBrandKeys.all, "all"] as const,
};

export const inkKeys = {
  all: ["inventory", "inks"] as const,
  list: (params: InkListParams) => [...inkKeys.all, "list", params] as const,
  detail: (id: string) => [...inkKeys.all, "detail", id] as const,
  history: (id: string) => [...inkKeys.all, "history", id] as const,
};

export function useAllInkBrands(enabled = true) {
  return useQuery({
    queryKey: inkBrandKeys.allItems(),
    queryFn: () => inkBrandsApi.listAll({ is_active: true }),
    enabled,
  });
}

export function useInks(params: InkListParams) {
  return useQuery({
    queryKey: inkKeys.list(params),
    queryFn: () => inksApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useInk(id: string | null) {
  return useQuery({
    queryKey: inkKeys.detail(id ?? ""),
    queryFn: () => inksApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useInkHistory(id: string | null) {
  return useQuery({
    queryKey: inkKeys.history(id ?? ""),
    queryFn: () => inksApi.history(id!),
    enabled: Boolean(id),
  });
}

export function useInkBrandsList(params: InkBrandListParams, enabled = true) {
  return useQuery({
    queryKey: [...inkBrandKeys.all, "list", params],
    queryFn: () => inkBrandsApi.list(params),
    enabled,
  });
}
