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
  history: permissionsByModule.inventory.material.history,
} as const satisfies Record<string, CatalogPermission>;

export const materialsReportPermissions = {
  read: permissionsByModule.inventory.materials_report.read,
} as const satisfies Record<string, CatalogPermission>;

export const inventoryPricePermissions = {
  read: permissionsByModule.inventory.material.view_price,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderPermissions = {
  read: permissionsByModule.inventory.cylinder.read,
  create: permissionsByModule.inventory.cylinder.create,
  update: permissionsByModule.inventory.cylinder.update,
  delete: permissionsByModule.inventory.cylinder.delete,
  viewPrice: permissionsByModule.inventory.cylinder.view_price,
  history: permissionsByModule.inventory.cylinder.history,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderPricePermissions = {
  read: permissionsByModule.inventory.cylinder.view_price,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderImagePermissions = {
  read: permissionsByModule.inventory.cylinder_image.read,
  create: permissionsByModule.inventory.cylinder_image.create,
  update: permissionsByModule.inventory.cylinder_image.update,
  delete: permissionsByModule.inventory.cylinder_image.delete,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderChallanPermissions = {
  read: permissionsByModule.inventory.cylinder_challan.read,
  create: permissionsByModule.inventory.cylinder_challan.create,
  update: permissionsByModule.inventory.cylinder_challan.update,
  delete: permissionsByModule.inventory.cylinder_challan.delete,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderReturnPermissions = {
  read: permissionsByModule.inventory.cylinder_return.read,
  create: permissionsByModule.inventory.cylinder_return.create,
  update: permissionsByModule.inventory.cylinder_return.update,
  delete: permissionsByModule.inventory.cylinder_return.delete,
} as const satisfies Record<string, CatalogPermission>;

export const inkColorPermissions = {
  read: permissionsByModule.inventory.ink_color.read,
  create: permissionsByModule.inventory.ink_color.create,
  update: permissionsByModule.inventory.ink_color.update,
  delete: permissionsByModule.inventory.ink_color.delete,
  history: permissionsByModule.inventory.ink_color.history,
} as const satisfies Record<string, CatalogPermission>;

export const inkPermissions = {
  read: permissionsByModule.inventory.ink.read,
  create: permissionsByModule.inventory.ink.create,
  update: permissionsByModule.inventory.ink.update,
  delete: permissionsByModule.inventory.ink.delete,
  viewPrice: permissionsByModule.inventory.ink.view_price,
  history: permissionsByModule.inventory.ink.history,
} as const satisfies Record<string, CatalogPermission>;

export const inksReportPermissions = {
  read: permissionsByModule.inventory.inks_report.read,
} as const satisfies Record<string, CatalogPermission>;

export const inkPricePermissions = {
  read: permissionsByModule.inventory.ink.view_price,
} as const satisfies Record<string, CatalogPermission>;

export const inkImagePermissions = {
  read: permissionsByModule.inventory.ink_image.read,
  create: permissionsByModule.inventory.ink_image.create,
  update: permissionsByModule.inventory.ink_image.update,
  delete: permissionsByModule.inventory.ink_image.delete,
} as const satisfies Record<string, CatalogPermission>;
