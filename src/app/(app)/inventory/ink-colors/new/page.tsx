import { InkColorRecordScreen } from "@/modules/inventory/ink-colors/components/ink-color-record-screen";
import { inkColorPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewInkColorPage() {
  return (
    <PermissionGate permission={inkColorPermissions.create}>
      <InkColorRecordScreen mode="create" />
    </PermissionGate>
  );
}
