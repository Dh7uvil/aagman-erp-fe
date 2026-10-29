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

export const jobPermissions = {
  read: permissionsByModule.inventory.job.read,
  create: permissionsByModule.inventory.job.create,
  update: permissionsByModule.inventory.job.update,
  delete: permissionsByModule.inventory.job.delete,
  viewPrice: permissionsByModule.inventory.job.view_price,
  history: permissionsByModule.inventory.job.history,
} as const satisfies Record<string, CatalogPermission>;

export const jobPricePermissions = {
  read: permissionsByModule.inventory.job.view_price,
} as const satisfies Record<string, CatalogPermission>;

export const jobImagePermissions = {
  read: permissionsByModule.inventory.job_image.read,
  create: permissionsByModule.inventory.job_image.create,
  update: permissionsByModule.inventory.job_image.update,
  delete: permissionsByModule.inventory.job_image.delete,
} as const satisfies Record<string, CatalogPermission>;

export const jobChallanPermissions = {
  read: permissionsByModule.inventory.job_challan.read,
  create: permissionsByModule.inventory.job_challan.create,
  update: permissionsByModule.inventory.job_challan.update,
  delete: permissionsByModule.inventory.job_challan.delete,
} as const satisfies Record<string, CatalogPermission>;

export const cylinderReturnPermissions = {
  read: permissionsByModule.inventory.cylinder_return.read,
  create: permissionsByModule.inventory.cylinder_return.create,
  update: permissionsByModule.inventory.cylinder_return.update,
  delete: permissionsByModule.inventory.cylinder_return.delete,
} as const satisfies Record<string, CatalogPermission>;
