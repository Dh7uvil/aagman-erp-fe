import type { CatalogPermission } from "@/shared/lib/generated-permissions";
import { permissionsByModule } from "@/shared/lib/generated-permissions";

export const unitPermissions = {
  read: permissionsByModule.inventory.unit.read,
  create: permissionsByModule.inventory.unit.create,
  update: permissionsByModule.inventory.unit.update,
  delete: permissionsByModule.inventory.unit.delete,
} as const satisfies Record<string, CatalogPermission>;

/** Product/micron APIs are gated by material permissions (no separate category catalog). */
export const categoryPermissions = {
  read: permissionsByModule.inventory.material.read,
  create: permissionsByModule.inventory.material.create,
  update: permissionsByModule.inventory.material.update,
  delete: permissionsByModule.inventory.material.delete,
} as const satisfies Record<string, CatalogPermission>;

export const materialPermissions = {
  read: permissionsByModule.inventory.material.read,
  create: permissionsByModule.inventory.material.create,
  update: permissionsByModule.inventory.material.update,
  delete: permissionsByModule.inventory.material.delete,
  viewPrice: permissionsByModule.inventory.material.view_price,
} as const satisfies Record<string, CatalogPermission>;

export const materialsReportPermissions = {
  read: permissionsByModule.inventory.materials_report.read,
} as const satisfies Record<string, CatalogPermission>;

export const inventoryPricePermissions = {
  read: permissionsByModule.inventory.material.view_price,
} as const satisfies Record<string, CatalogPermission>;
