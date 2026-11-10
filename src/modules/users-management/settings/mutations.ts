"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authKeys } from "@/modules/users-management/auth/queries";
import { settingsApi } from "@/modules/users-management/settings/api";
import type { MeUpdate } from "@/modules/users-management/settings/schemas";

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MeUpdate) => settingsApi.updateMe(values),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data);
    },
  });
}
