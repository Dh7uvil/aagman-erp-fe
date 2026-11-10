"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/users-management/auth/api";
import type { Me } from "@/modules/users-management/auth/schemas";
import { organizationApi } from "@/modules/users-management/organization/api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  organizationBranding: () => [...authKeys.all, "organization-branding"] as const,
};

export function useMe(initialData?: Me | null) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    initialData: initialData ?? undefined,
  });
}

/** Public org name/logo for login — works without a session. */
export function useAuthOrganizationBranding() {
  return useQuery({
    queryKey: authKeys.organizationBranding(),
    queryFn: organizationApi.getBranding,
    staleTime: 5 * 60 * 1000,
  });
}

export async function refetchCurrentUser(queryClient: QueryClient, refreshRouter?: () => void) {
  await queryClient.refetchQueries({ queryKey: authKeys.me() });
  refreshRouter?.();
}
