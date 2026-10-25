import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const companyPermissions = {
  read: "identity.company.read",
  create: "identity.company.create",
  update: "identity.company.update",
  delete: "identity.company.delete",
} as const satisfies Record<string, CatalogPermission>;
