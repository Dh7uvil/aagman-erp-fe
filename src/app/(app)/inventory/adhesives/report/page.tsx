import { AdhesiveMovementsScreen } from "@/modules/inventory/adhesive-movements/components/adhesive-movements-screen";
import { adhesivesReportPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AdhesivesReportPage() {
  return (
    <PermissionGate permission={adhesivesReportPermissions.read}>
      <AdhesiveMovementsScreen />
    </PermissionGate>
  );
}
