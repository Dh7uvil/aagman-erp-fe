import { CylinderReturnsScreen } from "@/modules/inventory/cylinder-returns/components/cylinder-returns-screen";
import { cylinderReturnPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CylinderReturnsPage() {
  return (
    <PermissionGate permission={cylinderReturnPermissions.read}>
      <CylinderReturnsScreen />
    </PermissionGate>
  );
}
