import { CylinderReturnRecordScreen } from "@/modules/inventory/cylinder-returns/components/cylinder-return-record-screen";
import { cylinderReturnPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewCylinderReturnPage() {
  return (
    <PermissionGate permission={cylinderReturnPermissions.create}>
      <CylinderReturnRecordScreen mode="create" />
    </PermissionGate>
  );
}
