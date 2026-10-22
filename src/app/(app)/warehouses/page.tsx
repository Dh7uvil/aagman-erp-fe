import { WarehousesScreen } from "@/modules/users-management/warehouses/components/warehouses-screen";
import { warehousePermissions } from "@/modules/users-management/warehouses/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function WarehousesPage() {
  return (
    <PermissionGate permission={warehousePermissions.read}>
      <WarehousesScreen />
    </PermissionGate>
  );
}
