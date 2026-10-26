"use client";

import { useQuery } from "@tanstack/react-query";

import { micronsApi } from "@/modules/inventory/microns/api";

export const micronKeys = {
  all: ["inventory", "microns"] as const,
  allItems: (productId?: string) => [...micronKeys.all, "all", productId ?? ""] as const,
};

export function useAllMicrons(productId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: micronKeys.allItems(productId),
    queryFn: () => micronsApi.listAll({ is_active: true, product_id: productId }),
    enabled: enabled && Boolean(productId),
  });
}
