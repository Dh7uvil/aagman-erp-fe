import { AdhesivesScreen } from "@/modules/inventory/adhesives/components/adhesives-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AdhesivesPage() {
  return (
    <PermissionGate permission={adhesivePermissions.read}>
      <AdhesivesScreen />
    </PermissionGate>
  );
}
