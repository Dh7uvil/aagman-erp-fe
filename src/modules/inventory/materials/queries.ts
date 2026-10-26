"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { materialsApi } from "@/modules/inventory/materials/api";
import type { MaterialListParams } from "@/modules/inventory/materials/schemas";

export const materialKeys = {
  all: ["inventory", "materials"] as const,
  list: (params: MaterialListParams) => [...materialKeys.all, "list", params] as const,
  allItems: (params: Pick<MaterialListParams, "is_active" | "parent_id">) =>
    [...materialKeys.all, "all", params] as const,
  detail: (id: string) => [...materialKeys.all, "detail", id] as const,
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
  params: Pick<MaterialListParams, "is_active" | "parent_id"> = { is_active: true },
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
  });
}
