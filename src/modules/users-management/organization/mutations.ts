"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { authKeys } from "@/modules/users-management/auth/queries";
import { organizationApi } from "@/modules/users-management/organization/api";
import { organizationKeys } from "@/modules/users-management/organization/queries";
import type { Organization } from "@/modules/users-management/organization/schemas";

function cacheOrganization(queryClient: QueryClient, organization: Organization) {
  queryClient.setQueryData(organizationKeys.current(), organization);
  queryClient.setQueryData(authKeys.organizationBranding(), {
    name: organization.name,
    logo_url: organization.logo_url ?? null,
  });
}

async function refreshOrganizationViews(queryClient: QueryClient, organization?: Organization) {
  if (organization) {
    cacheOrganization(queryClient, organization);
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: organizationKeys.all }),
    queryClient.invalidateQueries({ queryKey: authKeys.organizationBranding() }),
  ]);
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.update,
    onSuccess: async (organization) => {
      await refreshOrganizationViews(queryClient, organization);
    },
  });
}

/** @deprecated Use {@link useUpdateOrganization} */
export const useUpdateCurrentTenant = useUpdateOrganization;

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.uploadLogo,
    retry: false,
    onSuccess: async (organization) => {
      await refreshOrganizationViews(queryClient, organization);
    },
  });
}

/** @deprecated Use {@link useUploadOrganizationLogo} */
export const useUploadTenantLogo = useUploadOrganizationLogo;

export function useDeleteOrganizationLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.deleteLogo,
    retry: false,
    onSuccess: async (organization) => {
      await refreshOrganizationViews(queryClient, organization);
    },
  });
}

/** @deprecated Use {@link useDeleteOrganizationLogo} */
export const useDeleteTenantLogo = useDeleteOrganizationLogo;
