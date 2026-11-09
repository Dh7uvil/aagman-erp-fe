import { SolventRecordScreen } from "@/modules/inventory/solvents/components/solvent-record-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewSolventSheetPage() {
  return (
    <PermissionGate permission={solventPermissions.create}>
      <SolventRecordScreen mode="create" />
    </PermissionGate>
  );
}
