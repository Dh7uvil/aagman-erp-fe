import { AdhesiveBrandsScreen } from "@/modules/inventory/adhesive-brands/components/adhesive-brands-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AdhesiveBrandsPage() {
  return (
    <PermissionGate permission={adhesivePermissions.read}>
      <AdhesiveBrandsScreen />
    </PermissionGate>
  );
}
