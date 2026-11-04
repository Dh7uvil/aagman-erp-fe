import { SolventBrandsScreen } from "@/modules/inventory/solvent-brands/components/solvent-brands-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SolventBrandsPage() {
  return (
    <PermissionGate permission={solventPermissions.read}>
      <SolventBrandsScreen />
    </PermissionGate>
  );
}
