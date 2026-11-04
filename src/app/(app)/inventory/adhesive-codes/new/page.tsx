import { AdhesiveCodeRecordScreen } from "@/modules/inventory/adhesive-codes/components/adhesive-code-record-screen";
import { adhesiveCodePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewAdhesiveCodePage() {
  return (
    <PermissionGate permission={adhesiveCodePermissions.create}>
      <AdhesiveCodeRecordScreen mode="create" />
    </PermissionGate>
  );
}
