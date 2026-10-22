import { ALLOWED_LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "@/config/constants";
import {
  OrganizationSchema,
  type Organization,
  type OrganizationUpdate,
} from "@/modules/users-management/organization/schemas";
import { apiClient } from "@/shared/api/client";
import { ApiError, getErrorMessage } from "@/shared/api/errors";

function assertLogoFile(file: File) {
  if (file.size > MAX_LOGO_BYTES) {
    throw new ApiError("VALIDATION_ERROR", getErrorMessage("VALIDATION_ERROR"), 400);
  }
  if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError("VALIDATION_ERROR", getErrorMessage("VALIDATION_ERROR"), 400);
  }
}

export const organizationApi = {
  get: async (): Promise<Organization> =>
    OrganizationSchema.parse(await apiClient.get("/organization")),
  update: async (values: OrganizationUpdate): Promise<Organization> =>
    OrganizationSchema.parse(await apiClient.patch("/organization", values)),
  uploadLogo: async (file: File): Promise<Organization> => {
    assertLogoFile(file);
    const body = new FormData();
    body.set("file", file);
    return OrganizationSchema.parse(await apiClient.postForm("/organization/logo", body));
  },
  deleteLogo: async (): Promise<Organization> =>
    OrganizationSchema.parse(await apiClient.delete("/organization/logo")),
};
