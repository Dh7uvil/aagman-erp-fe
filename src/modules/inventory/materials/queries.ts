"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { materialsApi } from "@/modules/inventory/materials/api";
import type { MaterialListParams } from "@/modules/inventory/materials/schemas";

export const materialKeys = {
  all: ["inventory", "materials"] as const,
  list: (params: MaterialListParams) => [...materialKeys.all, "list", params] as const,
  allItems: (params: Pick<MaterialListParams, "is_active" | "parent_id" | "product_id">) =>
    [...materialKeys.all, "all", params] as const,
  detail: (id: string) => [...materialKeys.all, "detail", id] as const,
  history: (id: string, page = 1) => [...materialKeys.all, "history", id, page] as const,
  historySummary: (id: string) => [...materialKeys.all, "history-summary", id] as const,
};

export function useMaterials(params: MaterialListParams, enabled = true) {
  return useQuery({
    queryKey: materialKeys.list(params),
    queryFn: () => materialsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAllMaterials(
  params: Pick<MaterialListParams, "is_active" | "parent_id" | "product_id"> = {
    is_active: true,
  },
  enabled = true,
) {
  return useQuery({
    queryKey: materialKeys.allItems(params),
    queryFn: () => materialsApi.listAll(params),
    enabled,
  });
}

export function useMaterial(id: string | null) {
  return useQuery({
    queryKey: materialKeys.detail(id ?? ""),
    queryFn: () => materialsApi.get(id!),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useMaterialHistory(id: string, page = 1) {
  return useQuery({
    queryKey: materialKeys.history(id, page),
    queryFn: async () => (await materialsApi.history(id, page)).data,
    enabled: Boolean(id),
  });
}

export function useMaterialHistorySummary(id: string) {
  return useQuery({
    queryKey: materialKeys.historySummary(id),
    queryFn: () => materialsApi.historySummary(id),
    enabled: Boolean(id),
  });
}
