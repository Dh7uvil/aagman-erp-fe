/** Generated from src/shared/lib/permissions-catalog.json — do not edit manually. */
/** Regenerate: npm run generate:permissions */

export const catalogPermissions = [
  "identity.audit_log.read",
  "identity.branch.create",
  "identity.branch.delete",
  "identity.branch.read",
  "identity.branch.update",
  "identity.company.create",
  "identity.company.delete",
  "identity.company.read",
  "identity.company.update",
  "identity.department.create",
  "identity.department.delete",
  "identity.department.read",
  "identity.department.update",
  "identity.permission.read",
  "identity.role.create",
  "identity.role.delete",
  "identity.role.read",
  "identity.role.update",
  "identity.settings.read",
  "identity.settings.update",
  "identity.user.create",
  "identity.user.delete",
  "identity.user.read",
  "identity.user.update",
  "identity.warehouse.create",
  "identity.warehouse.delete",
  "identity.warehouse.read",
  "identity.warehouse.update",
  "inventory.material.create",
  "inventory.material.delete",
  "inventory.material.read",
  "inventory.material.update",
  "inventory.material.view_price",
  "inventory.materials_report.read",
  "inventory.unit.create",
  "inventory.unit.delete",
  "inventory.unit.read",
  "inventory.unit.update",
] as const;

export type CatalogPermission = (typeof catalogPermissions)[number];

export const catalogPermissionSet = new Set<string>(catalogPermissions);

export function isCatalogPermission(value: string): value is CatalogPermission {
  return catalogPermissionSet.has(value);
}

export const permissionsByModule = {
  identity: {
    audit_log: {
      read: "identity.audit_log.read",
    },
    branch: {
      create: "identity.branch.create",
      delete: "identity.branch.delete",
      read: "identity.branch.read",
      update: "identity.branch.update",
    },
    company: {
      create: "identity.company.create",
      delete: "identity.company.delete",
      read: "identity.company.read",
      update: "identity.company.update",
    },
    department: {
      create: "identity.department.create",
      delete: "identity.department.delete",
      read: "identity.department.read",
      update: "identity.department.update",
    },
    permission: {
      read: "identity.permission.read",
    },
    role: {
      create: "identity.role.create",
      delete: "identity.role.delete",
      read: "identity.role.read",
      update: "identity.role.update",
    },
    settings: {
      read: "identity.settings.read",
      update: "identity.settings.update",
    },
    user: {
      create: "identity.user.create",
      delete: "identity.user.delete",
      read: "identity.user.read",
      update: "identity.user.update",
    },
    warehouse: {
      create: "identity.warehouse.create",
      delete: "identity.warehouse.delete",
      read: "identity.warehouse.read",
      update: "identity.warehouse.update",
    },
  },
  inventory: {
    material: {
      create: "inventory.material.create",
      delete: "inventory.material.delete",
      read: "inventory.material.read",
      update: "inventory.material.update",
      view_price: "inventory.material.view_price",
    },
    materials_report: {
      read: "inventory.materials_report.read",
    },
    unit: {
      create: "inventory.unit.create",
      delete: "inventory.unit.delete",
      read: "inventory.unit.read",
      update: "inventory.unit.update",
    },
  },
} as const;
