import { MovementsScreen } from "@/modules/inventory/movements/components/movements-screen";
import { materialsReportPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function MaterialsReportPage() {
  return (
    <PermissionGate permission={materialsReportPermissions.read}>
      <MovementsScreen />
    </PermissionGate>
  );
}
