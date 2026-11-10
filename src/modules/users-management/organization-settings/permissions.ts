import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const organizationSettingsPermissions = {
  read: "identity.settings.read",
  update: "identity.settings.update",
} as const satisfies Record<string, CatalogPermission>;
