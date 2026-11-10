import { UnitRecordScreen } from "@/modules/inventory/units/components/unit-record-screen";
import { unitPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewUnitPage() {
  return (
    <PermissionGate permission={unitPermissions.create}>
      <UnitRecordScreen mode="create" />
    </PermissionGate>
  );
}
