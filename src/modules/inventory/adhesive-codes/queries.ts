"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { adhesiveCodesApi } from "@/modules/inventory/adhesive-codes/api";
import type { AdhesiveCodeListParams } from "@/modules/inventory/adhesive-codes/schemas";

export const adhesiveCodeKeys = {
  all: ["inventory", "adhesive-codes"] as const,
  list: (params: AdhesiveCodeListParams) => [...adhesiveCodeKeys.all, "list", params] as const,
  allItems: (isActive?: boolean) => [...adhesiveCodeKeys.all, "all", isActive] as const,
  detail: (id: string) => [...adhesiveCodeKeys.all, "detail", id] as const,
  usage: (id: string) => [...adhesiveCodeKeys.all, "usage", id] as const,
  history: (id: string) => [...adhesiveCodeKeys.all, "history", id] as const,
};

export function useAdhesiveCodes(params: AdhesiveCodeListParams) {
  return useQuery({
    queryKey: adhesiveCodeKeys.list(params),
    queryFn: () => adhesiveCodesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllAdhesiveCodes(enabled = true, isActive = true) {
  return useQuery({
    queryKey: adhesiveCodeKeys.allItems(isActive),
    queryFn: () => adhesiveCodesApi.listAll({ is_active: isActive }),
    enabled,
  });
}

export function useAdhesiveCode(id: string | null) {
  return useQuery({
    queryKey: adhesiveCodeKeys.detail(id ?? ""),
    queryFn: () => adhesiveCodesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useAdhesiveCodeUsage(id: string | null, enabled = true) {
  return useQuery({
    queryKey: adhesiveCodeKeys.usage(id ?? ""),
    queryFn: () => adhesiveCodesApi.usage(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useAdhesiveCodeHistory(id: string | null) {
  return useQuery({
    queryKey: adhesiveCodeKeys.history(id ?? ""),
    queryFn: () => adhesiveCodesApi.history(id!),
    enabled: Boolean(id),
  });
}
