"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { LIST_COLUMN_TOTALS_PARAM } from "@/shared/lib/list-export";

import { cylindersApi } from "@/modules/inventory/cylinders/api";
import type { CylinderListParams } from "@/modules/inventory/cylinders/schemas";

export const cylinderKeys = {
  all: ["inventory", "cylinders"] as const,
  list: (params: CylinderListParams) => [...cylinderKeys.all, "list", params] as const,
  detail: (id: string) => [...cylinderKeys.all, "detail", id] as const,
  history: (id: string) => [...cylinderKeys.all, "history", id] as const,
};

export function useCylinders(params: CylinderListParams, enabled = true) {
  return useQuery({
    queryKey: cylinderKeys.list(params),
    queryFn: () => cylindersApi.list({ ...params, ...LIST_COLUMN_TOTALS_PARAM }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCylinder(id: string | null) {
  return useQuery({
    queryKey: cylinderKeys.detail(id ?? ""),
    queryFn: () => cylindersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCylinderHistory(id: string | null) {
  return useQuery({
    queryKey: cylinderKeys.history(id ?? ""),
    queryFn: () => cylindersApi.history(id!),
    enabled: Boolean(id),
  });
}
