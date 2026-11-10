"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { departmentsApi } from "@/modules/users-management/departments/api";
import { departmentKeys } from "@/modules/users-management/departments/queries";
import { organizationKeys } from "@/modules/users-management/organization/queries";
import { upsertQueryListItem } from "@/shared/api/upsert-query-list";

async function invalidateDepartments(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
  await queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: async (data) => {
      upsertQueryListItem(queryClient, departmentKeys.allItems({}), data);
      upsertQueryListItem(queryClient, departmentKeys.allItems({ branch_id: data.branch_id }), data);
      await invalidateDepartments(queryClient);
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof departmentsApi.update>[1];
    }) => departmentsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateDepartments(queryClient);
      await queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: async () => {
      await invalidateDepartments(queryClient);
    },
  });
}
