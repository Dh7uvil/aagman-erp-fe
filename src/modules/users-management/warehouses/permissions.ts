import type { CatalogPermission } from "@/shared/lib/generated-permissions";

export const warehousePermissions = {
  read: "identity.warehouse.read",
  create: "identity.warehouse.create",
  update: "identity.warehouse.update",
  delete: "identity.warehouse.delete",
} as const satisfies Record<string, CatalogPermission>;
