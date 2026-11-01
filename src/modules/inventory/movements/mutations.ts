import { useMutation, useQueryClient } from "@tanstack/react-query";

import { movementsApi } from "@/modules/inventory/movements/api";
import type { MovementCreateRequest } from "@/modules/inventory/movements/schemas";
import { materialKeys } from "@/modules/inventory/materials/queries";
import { micronKeys } from "@/modules/inventory/microns/queries";

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MovementCreateRequest) => movementsApi.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: materialKeys.all });
      await queryClient.invalidateQueries({ queryKey: micronKeys.all });
    },
  });
}
