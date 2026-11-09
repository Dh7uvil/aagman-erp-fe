import { InksScreen } from "@/modules/inventory/inks/components/inks-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InksPage() {
  return (
    <PermissionGate permission={inkPermissions.read}>
      <InksScreen />
    </PermissionGate>
  );
}
