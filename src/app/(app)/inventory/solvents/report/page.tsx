import { SolventMovementsScreen } from "@/modules/inventory/solvent-movements/components/solvent-movements-screen";
import { solventsReportPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SolventsReportPage() {
  return (
    <PermissionGate permission={solventsReportPermissions.read}>
      <SolventMovementsScreen />
    </PermissionGate>
  );
}
