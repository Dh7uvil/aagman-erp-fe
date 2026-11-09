"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

import { inkBrandsApi, inksApi } from "@/modules/inventory/inks/api";
import type { InkBrandListParams, InkListParams } from "@/modules/inventory/inks/schemas";

export const inkBrandKeys = {
  all: ["inventory", "ink-brands"] as const,
  list: (params: InkBrandListParams) => [...inkBrandKeys.all, "list", params] as const,
  allItems: () => [...inkBrandKeys.all, "all"] as const,
  detail: (id: string) => [...inkBrandKeys.all, "detail", id] as const,
};

export const inkKeys = {
  all: ["inventory", "inks"] as const,
  list: (params: InkListParams) => [...inkKeys.all, "list", params] as const,
  detail: (id: string) => [...inkKeys.all, "detail", id] as const,
  history: (id: string) => [...inkKeys.all, "history", id] as const,
  lineHistory: (lineId: string, page: number) =>
    [...inkKeys.all, "line-history", lineId, page] as const,
  lineHistorySummary: (lineId: string) =>
    [...inkKeys.all, "line-history-summary", lineId] as const,
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
    queryFn: () => inksApi.list({ ...params, ...LIST_COLUMN_TOTALS_PARAM }),
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

export function useInkLineHistory(lineId: string, page = 1) {
  return useQuery({
    queryKey: inkKeys.lineHistory(lineId, page),
    queryFn: async () => (await inksApi.lineHistory(lineId, page)).data,
    enabled: Boolean(lineId),
  });
}

export function useInkLineHistorySummary(lineId: string) {
  return useQuery({
    queryKey: inkKeys.lineHistorySummary(lineId),
    queryFn: () => inksApi.lineHistorySummary(lineId),
    enabled: Boolean(lineId),
  });
}

export function useInkBrandsList(params: InkBrandListParams, enabled = true) {
  return useQuery({
    queryKey: inkBrandKeys.list(params),
    queryFn: () => inkBrandsApi.list({ ...params, ...LIST_COLUMN_TOTALS_PARAM }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useInkBrand(id: string | null) {
  return useQuery({
    queryKey: inkBrandKeys.detail(id ?? ""),
    queryFn: () => inkBrandsApi.get(id!),
    enabled: Boolean(id),
  });
}
