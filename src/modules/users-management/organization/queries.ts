"use client";

import { useQuery } from "@tanstack/react-query";

import { organizationApi } from "@/modules/users-management/organization/api";

export const organizationKeys = {
  all: ["organization"] as const,
  current: () => [...organizationKeys.all, "current"] as const,
};

export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.current(),
    queryFn: organizationApi.get,
  });
}

/** @deprecated Use {@link useOrganization} */
export const useCurrentTenant = useOrganization;
