import { SolventsScreen } from "@/modules/inventory/solvents/components/solvents-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SolventsPage() {
  return (
    <PermissionGate permission={solventPermissions.read}>
      <SolventsScreen />
    </PermissionGate>
  );
}
