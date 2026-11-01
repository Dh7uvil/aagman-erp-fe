"use client";

import { useQuery } from "@tanstack/react-query";

import { micronsApi } from "@/modules/inventory/microns/api";

export const micronKeys = {
  all: ["inventory", "microns"] as const,
  allItems: (productId?: string) => [...micronKeys.all, "all", productId ?? ""] as const,
  listItems: (productId?: string, activeOnly = true) =>
    [...micronKeys.allItems(productId), activeOnly ? "active" : "all"] as const,
};

export function useAllMicrons(
  productId: string | undefined,
  enabled = true,
  activeOnly = true,
) {
  return useQuery({
    queryKey: micronKeys.listItems(productId, activeOnly),
    queryFn: () =>
      micronsApi.listAll({
        product_id: productId,
        ...(activeOnly ? { is_active: true } : {}),
      }),
    enabled: enabled && Boolean(productId),
  });
}
