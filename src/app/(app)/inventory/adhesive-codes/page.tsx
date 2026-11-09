import { AdhesiveCodesScreen } from "@/modules/inventory/adhesive-codes/components/adhesive-codes-screen";
import { adhesiveCodePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AdhesiveCodesPage() {
  return (
    <PermissionGate permission={adhesiveCodePermissions.read}>
      <AdhesiveCodesScreen />
    </PermissionGate>
  );
}
