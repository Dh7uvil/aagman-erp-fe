"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { companiesApi } from "@/modules/users-management/companies/api";
import { companyKeys } from "@/modules/users-management/companies/queries";

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof companiesApi.update>[1];
    }) => companiesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
      await queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}
