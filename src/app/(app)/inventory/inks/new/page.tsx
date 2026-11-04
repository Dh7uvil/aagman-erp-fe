import { InkRecordScreen } from "@/modules/inventory/inks/components/ink-record-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewInkSheetPage() {
  return (
    <PermissionGate permission={inkPermissions.create}>
      <InkRecordScreen mode="create" />
    </PermissionGate>
  );
}
