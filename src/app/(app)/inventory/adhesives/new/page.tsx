import { AdhesiveRecordScreen } from "@/modules/inventory/adhesives/components/adhesive-record-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewAdhesiveSheetPage() {
  return (
    <PermissionGate permission={adhesivePermissions.create}>
      <AdhesiveRecordScreen mode="create" />
    </PermissionGate>
  );
}
