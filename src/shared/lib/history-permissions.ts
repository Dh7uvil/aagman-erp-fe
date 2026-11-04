import {
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
    default:
      return undefined;
  }
}
