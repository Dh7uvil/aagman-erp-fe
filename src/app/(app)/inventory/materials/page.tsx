import { MaterialsScreen } from "@/modules/inventory/materials/components/materials-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InventoryMaterialsPage() {
  return (
    <PermissionGate permission={materialPermissions.read}>
      <MaterialsScreen />
    </PermissionGate>
  );
}
