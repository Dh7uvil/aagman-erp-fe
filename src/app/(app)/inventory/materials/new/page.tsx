import { MaterialRecordScreen } from "@/modules/inventory/materials/components/material-record-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewMaterialPage() {
  return (
    <PermissionGate permission={materialPermissions.create}>
      <MaterialRecordScreen />
    </PermissionGate>
  );
}
