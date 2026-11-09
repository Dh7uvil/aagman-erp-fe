"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

import { cylinderReturnsApi } from "@/modules/inventory/cylinder-returns/api";
import type { CylinderReturnListParams } from "@/modules/inventory/cylinder-returns/schemas";

export const cylinderReturnKeys = {
  all: ["inventory", "cylinder-returns"] as const,
  list: (params: CylinderReturnListParams) => [...cylinderReturnKeys.all, "list", params] as const,
  detail: (id: string) => [...cylinderReturnKeys.all, "detail", id] as const,
  history: (id: string) => [...cylinderReturnKeys.all, "history", id] as const,
};

export function useCylinderReturns(params: CylinderReturnListParams, enabled = true) {
  return useQuery({
    queryKey: cylinderReturnKeys.list(params),
    queryFn: () => cylinderReturnsApi.list({ ...params, ...LIST_COLUMN_TOTALS_PARAM }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCylinderReturn(id: string | null) {
  return useQuery({
    queryKey: cylinderReturnKeys.detail(id ?? ""),
    queryFn: () => cylinderReturnsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCylinderReturnHistory(id: string | null) {
  return useQuery({
    queryKey: cylinderReturnKeys.history(id ?? ""),
    queryFn: () => cylinderReturnsApi.history(id!),
    enabled: Boolean(id),
  });
}
