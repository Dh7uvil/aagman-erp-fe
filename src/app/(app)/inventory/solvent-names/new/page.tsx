import { SolventNameRecordScreen } from "@/modules/inventory/solvent-names/components/solvent-name-record-screen";
import { solventNamePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewSolventNamePage() {
  return (
    <PermissionGate permission={solventNamePermissions.create}>
      <SolventNameRecordScreen mode="create" />
    </PermissionGate>
  );
}
