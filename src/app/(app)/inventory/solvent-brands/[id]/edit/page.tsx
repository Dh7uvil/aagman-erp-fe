import { SolventBrandRecordScreen } from "@/modules/inventory/solvent-brands/components/solvent-brand-record-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function EditSolventBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={solventPermissions.update}>
      <SolventBrandRecordScreen mode="edit" brandId={id} />
    </PermissionGate>
  );
}
