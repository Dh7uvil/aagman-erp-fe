"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/modules/users-management/auth/queries";
import { organizationApi } from "@/modules/users-management/organization/api";
import { organizationKeys } from "@/modules/users-management/organization/queries";

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: organizationApi.update,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      await queryClient.invalidateQueries({ queryKey: authKeys.organizationBranding() });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      await queryClient.invalidateQueries({ queryKey: authKeys.organizationBranding() });
    },
  });
}

/** @deprecated Use {@link useDeleteOrganizationLogo} */
export const useDeleteTenantLogo = useDeleteOrganizationLogo;
