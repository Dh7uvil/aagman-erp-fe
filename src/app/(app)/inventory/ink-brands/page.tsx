import { InkBrandsScreen } from "@/modules/inventory/ink-brands/components/ink-brands-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InkBrandsPage() {
  return (
    <PermissionGate permission={inkPermissions.read}>
      <InkBrandsScreen />
    </PermissionGate>
  );
}
