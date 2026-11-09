import { AdhesiveBrandRecordScreen } from "@/modules/inventory/adhesive-brands/components/adhesive-brand-record-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function AdhesiveBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={adhesivePermissions.read}>
      <AdhesiveBrandRecordScreen mode="view" brandId={id} />
    </PermissionGate>
  );
}
