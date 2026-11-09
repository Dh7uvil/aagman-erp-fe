"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { adhesiveBrandsApi, adhesivesApi } from "@/modules/inventory/adhesives/api";
import type { AdhesiveBrandListParams, AdhesiveListParams } from "@/modules/inventory/adhesives/schemas";

export const adhesiveBrandKeys = {
  all: ["inventory", "adhesive-brands"] as const,
  list: (params: AdhesiveBrandListParams) => [...adhesiveBrandKeys.all, "list", params] as const,
  allItems: () => [...adhesiveBrandKeys.all, "all"] as const,
  detail: (id: string) => [...adhesiveBrandKeys.all, "detail", id] as const,
};

export const adhesiveKeys = {
  all: ["inventory", "adhesives"] as const,
  list: (params: AdhesiveListParams) => [...adhesiveKeys.all, "list", params] as const,
  detail: (id: string) => [...adhesiveKeys.all, "detail", id] as const,
  history: (id: string) => [...adhesiveKeys.all, "history", id] as const,
  lineHistory: (lineId: string, page: number) =>
    [...adhesiveKeys.all, "line-history", lineId, page] as const,
  lineHistorySummary: (lineId: string) =>
    [...adhesiveKeys.all, "line-history-summary", lineId] as const,
};

export function useAllAdhesiveBrands(enabled = true) {
  return useQuery({
    queryKey: adhesiveBrandKeys.allItems(),
    queryFn: () => adhesiveBrandsApi.listAll({ is_active: true }),
    enabled,
  });
}

export function useAdhesives(params: AdhesiveListParams) {
  return useQuery({
    queryKey: adhesiveKeys.list(params),
    queryFn: () => adhesivesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdhesive(id: string | null) {
  return useQuery({
    queryKey: adhesiveKeys.detail(id ?? ""),
    queryFn: () => adhesivesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useAdhesiveHistory(id: string | null) {
  return useQuery({
    queryKey: adhesiveKeys.history(id ?? ""),
    queryFn: () => adhesivesApi.history(id!),
    enabled: Boolean(id),
  });
}

export function useAdhesiveLineHistory(lineId: string, page = 1) {
  return useQuery({
    queryKey: adhesiveKeys.lineHistory(lineId, page),
    queryFn: async () => (await adhesivesApi.lineHistory(lineId, page)).data,
    enabled: Boolean(lineId),
  });
}

export function useAdhesiveLineHistorySummary(lineId: string) {
  return useQuery({
    queryKey: adhesiveKeys.lineHistorySummary(lineId),
    queryFn: () => adhesivesApi.lineHistorySummary(lineId),
    enabled: Boolean(lineId),
  });
}

export function useAdhesiveBrandsList(params: AdhesiveBrandListParams, enabled = true) {
  return useQuery({
    queryKey: adhesiveBrandKeys.list(params),
    queryFn: () => adhesiveBrandsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdhesiveBrand(id: string | null) {
  return useQuery({
    queryKey: adhesiveBrandKeys.detail(id ?? ""),
    queryFn: () => adhesiveBrandsApi.get(id!),
    enabled: Boolean(id),
  });
}
