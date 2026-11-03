import { CylindersScreen } from "@/modules/inventory/cylinders/components/cylinders-screen";
import { cylinderPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InventoryCylindersPage() {
  return (
    <PermissionGate permission={cylinderPermissions.read}>
      <CylindersScreen />
    </PermissionGate>
  );
}
