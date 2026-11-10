"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

import { inkColorsApi } from "@/modules/inventory/ink-colors/api";
import type { InkColorListParams } from "@/modules/inventory/ink-colors/schemas";

export const inkColorKeys = {
  all: ["inventory", "ink-colors"] as const,
  list: (params: InkColorListParams) => [...inkColorKeys.all, "list", params] as const,
  allItems: (isActive?: boolean) => [...inkColorKeys.all, "all", isActive] as const,
  detail: (id: string) => [...inkColorKeys.all, "detail", id] as const,
  usage: (id: string) => [...inkColorKeys.all, "usage", id] as const,
  history: (id: string) => [...inkColorKeys.all, "history", id] as const,
};

export function useInkColors(params: InkColorListParams) {
  return useQuery({
    queryKey: inkColorKeys.list(params),
    queryFn: () => inkColorsApi.list({ ...params, ...LIST_COLUMN_TOTALS_PARAM }),
    placeholderData: keepPreviousData,
  });
}

export function useAllInkColors(enabled = true, isActive = true) {
  return useQuery({
    queryKey: inkColorKeys.allItems(isActive),
    queryFn: () => inkColorsApi.listAll({ is_active: isActive }),
    enabled,
  });
}

export function useInkColor(id: string | null) {
  return useQuery({
    queryKey: inkColorKeys.detail(id ?? ""),
    queryFn: () => inkColorsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useInkColorUsage(id: string | null, enabled = true) {
  return useQuery({
    queryKey: inkColorKeys.usage(id ?? ""),
    queryFn: () => inkColorsApi.usage(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useInkColorHistory(id: string | null) {
  return useQuery({
    queryKey: inkColorKeys.history(id ?? ""),
    queryFn: () => inkColorsApi.history(id!),
    enabled: Boolean(id),
  });
}
