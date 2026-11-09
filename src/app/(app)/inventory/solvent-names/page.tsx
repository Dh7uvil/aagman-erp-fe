import { SolventNamesScreen } from "@/modules/inventory/solvent-names/components/solvent-names-screen";
import { solventNamePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SolventNamesPage() {
  return (
    <PermissionGate permission={solventNamePermissions.read}>
      <SolventNamesScreen />
    </PermissionGate>
  );
}
