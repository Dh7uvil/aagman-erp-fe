import { InkBrandRecordScreen } from "@/modules/inventory/ink-brands/components/ink-brand-record-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewInkBrandPage() {
  return (
    <PermissionGate permission={inkPermissions.create}>
      <InkBrandRecordScreen mode="create" />
    </PermissionGate>
  );
}
