"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { solventBrandsApi, solventsApi } from "@/modules/inventory/solvents/api";
import type { SolventBrandListParams, SolventListParams } from "@/modules/inventory/solvents/schemas";

export const solventBrandKeys = {
  all: ["inventory", "solvent-brands"] as const,
  list: (params: SolventBrandListParams) => [...solventBrandKeys.all, "list", params] as const,
  allItems: () => [...solventBrandKeys.all, "all"] as const,
  detail: (id: string) => [...solventBrandKeys.all, "detail", id] as const,
};

export const solventKeys = {
  all: ["inventory", "solvents"] as const,
  list: (params: SolventListParams) => [...solventKeys.all, "list", params] as const,
  detail: (id: string) => [...solventKeys.all, "detail", id] as const,
  history: (id: string) => [...solventKeys.all, "history", id] as const,
  lineHistory: (lineId: string, page: number) =>
    [...solventKeys.all, "line-history", lineId, page] as const,
  lineHistorySummary: (lineId: string) =>
    [...solventKeys.all, "line-history-summary", lineId] as const,
};

export function useAllSolventBrands(enabled = true) {
  return useQuery({
    queryKey: solventBrandKeys.allItems(),
    queryFn: () => solventBrandsApi.listAll({ is_active: true }),
    enabled,
  });
}

export function useSolvents(params: SolventListParams) {
  return useQuery({
    queryKey: solventKeys.list(params),
    queryFn: () => solventsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSolvent(id: string | null) {
  return useQuery({
    queryKey: solventKeys.detail(id ?? ""),
    queryFn: () => solventsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSolventHistory(id: string | null) {
  return useQuery({
    queryKey: solventKeys.history(id ?? ""),
    queryFn: () => solventsApi.history(id!),
    enabled: Boolean(id),
  });
}

export function useSolventLineHistory(lineId: string, page = 1) {
  return useQuery({
    queryKey: solventKeys.lineHistory(lineId, page),
    queryFn: async () => (await solventsApi.lineHistory(lineId, page)).data,
    enabled: Boolean(lineId),
  });
}

export function useSolventLineHistorySummary(lineId: string) {
  return useQuery({
    queryKey: solventKeys.lineHistorySummary(lineId),
    queryFn: () => solventsApi.lineHistorySummary(lineId),
    enabled: Boolean(lineId),
  });
}

export function useSolventBrandsList(params: SolventBrandListParams, enabled = true) {
  return useQuery({
    queryKey: solventBrandKeys.list(params),
    queryFn: () => solventBrandsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useSolventBrand(id: string | null) {
  return useQuery({
    queryKey: solventBrandKeys.detail(id ?? ""),
    queryFn: () => solventBrandsApi.get(id!),
    enabled: Boolean(id),
  });
}
