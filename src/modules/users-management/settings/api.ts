import { apiClient } from "@/shared/api/client";
import { MeSchema, type Me } from "@/modules/users-management/auth/schemas";
import { MeUpdateSchema, type MeUpdate } from "@/modules/users-management/settings/schemas";

export const settingsApi = {
  updateMe: async (input: MeUpdate): Promise<Me> =>
    MeSchema.parse(await apiClient.patch("/auth/me", MeUpdateSchema.parse(input))),
};
