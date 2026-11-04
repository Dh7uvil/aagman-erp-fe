import { AdhesiveBrandRecordScreen } from "@/modules/inventory/adhesive-brands/components/adhesive-brand-record-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function EditAdhesiveBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={adhesivePermissions.update}>
      <AdhesiveBrandRecordScreen mode="edit" brandId={id} />
    </PermissionGate>
  );
}
