"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { unitsApi } from "@/modules/inventory/units/api";
import type { UnitListParams } from "@/modules/inventory/units/schemas";

export const unitKeys = {
  all: ["inventory", "units"] as const,
  list: (params: UnitListParams) => [...unitKeys.all, "list", params] as const,
  allItems: () => [...unitKeys.all, "all"] as const,
  detail: (id: string) => [...unitKeys.all, "detail", id] as const,
};

export function useUnits(params: UnitListParams) {
  return useQuery({
    queryKey: unitKeys.list(params),
    queryFn: () => unitsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllUnits(enabled = true) {
  return useQuery({
    queryKey: unitKeys.allItems(),
    queryFn: () => unitsApi.listAll({ is_active: true }),
    enabled,
  });
}

export function useUnit(id: string | null) {
  return useQuery({
    queryKey: unitKeys.detail(id ?? ""),
    queryFn: () => unitsApi.get(id!),
    enabled: Boolean(id),
  });
}
