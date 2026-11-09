import { InkMovementsScreen } from "@/modules/inventory/ink-movements/components/ink-movements-screen";
import { inksReportPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InksReportPage() {
  return (
    <PermissionGate permission={inksReportPermissions.read}>
      <InkMovementsScreen />
    </PermissionGate>
  );
}
