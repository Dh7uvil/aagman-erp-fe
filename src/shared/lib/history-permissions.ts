import { jobPermissions } from "@/modules/inventory/permissions";
import type { CatalogPermission } from "@/shared/lib/generated-permissions";
import type { HistoryResource } from "@/shared/lib/history";

export function historyPermissionForResource(resource: HistoryResource): CatalogPermission | undefined {
  switch (resource) {
    case "jobs":
      return jobPermissions.history;
    default:
      return undefined;
  }
}
