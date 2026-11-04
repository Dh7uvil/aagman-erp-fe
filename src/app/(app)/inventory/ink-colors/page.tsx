import { InkColorsScreen } from "@/modules/inventory/ink-colors/components/ink-colors-screen";
import { inkColorPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InkColorsPage() {
  return (
    <PermissionGate permission={inkColorPermissions.read}>
      <InkColorsScreen />
    </PermissionGate>
  );
}
