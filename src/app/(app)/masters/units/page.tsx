import { UnitsScreen } from "@/modules/inventory/units/components/units-screen";
import { unitPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InventoryUnitsPage() {
  return (
    <PermissionGate permission={unitPermissions.read}>
      <UnitsScreen />
    </PermissionGate>
  );
}
