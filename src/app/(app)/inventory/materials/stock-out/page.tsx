import { MaterialStockOutScreen } from "@/modules/inventory/materials/components/material-stock-out-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function MaterialStockOutPage() {
  return (
    <PermissionGate permission={materialPermissions.update}>
      <MaterialStockOutScreen />
    </PermissionGate>
  );
}
