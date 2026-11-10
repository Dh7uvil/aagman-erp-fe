import { SolventBrandRecordScreen } from "@/modules/inventory/solvent-brands/components/solvent-brand-record-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewSolventBrandPage() {
  return (
    <PermissionGate permission={solventPermissions.create}>
      <SolventBrandRecordScreen mode="create" />
    </PermissionGate>
  );
}
