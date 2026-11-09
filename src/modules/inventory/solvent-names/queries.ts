"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { solventNamesApi } from "@/modules/inventory/solvent-names/api";
import type { SolventNameListParams } from "@/modules/inventory/solvent-names/schemas";

export const solventNameKeys = {
  all: ["inventory", "solvent-names"] as const,
  list: (params: SolventNameListParams) => [...solventNameKeys.all, "list", params] as const,
  allItems: (isActive?: boolean) => [...solventNameKeys.all, "all", isActive] as const,
  detail: (id: string) => [...solventNameKeys.all, "detail", id] as const,
  usage: (id: string) => [...solventNameKeys.all, "usage", id] as const,
  history: (id: string) => [...solventNameKeys.all, "history", id] as const,
};

export function useSolventNames(params: SolventNameListParams) {
  return useQuery({
    queryKey: solventNameKeys.list(params),
    queryFn: () => solventNamesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllSolventNames(enabled = true, isActive = true) {
  return useQuery({
    queryKey: solventNameKeys.allItems(isActive),
    queryFn: () => solventNamesApi.listAll({ is_active: isActive }),
    enabled,
  });
}

export function useSolventName(id: string | null) {
  return useQuery({
    queryKey: solventNameKeys.detail(id ?? ""),
    queryFn: () => solventNamesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useSolventNameUsage(id: string | null, enabled = true) {
  return useQuery({
    queryKey: solventNameKeys.usage(id ?? ""),
    queryFn: () => solventNamesApi.usage(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useSolventNameHistory(id: string | null) {
  return useQuery({
    queryKey: solventNameKeys.history(id ?? ""),
    queryFn: () => solventNamesApi.history(id!),
    enabled: Boolean(id),
  });
}
