import {
  adhesiveCodePermissions,
  adhesivePermissions,
  solventNamePermissions,
  solventPermissions,
  cylinderPermissions,
  inkColorPermissions,
  inkPermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import type { CatalogPermission } from "@/shared/lib/generated-permissions";
import type { HistoryResource } from "@/shared/lib/history";

export function historyPermissionForResource(resource: HistoryResource): CatalogPermission | undefined {
  switch (resource) {
    case "cylinders":
      return cylinderPermissions.history;
    case "materials":
      return materialPermissions.history;
    case "ink-colors":
      return inkColorPermissions.history;
    case "inks":
      return inkPermissions.history;
    case "ink-lines":
      return inkPermissions.history;
    case "adhesive-codes":
      return adhesiveCodePermissions.history;
    case "adhesives":
      return adhesivePermissions.history;
    case "adhesive-lines":
      return adhesivePermissions.history;
    case "solvent-names":
      return solventNamePermissions.history;
    case "solvents":
      return solventPermissions.history;
    case "solvent-lines":
      return solventPermissions.history;
    default:
      return undefined;
  }
}
