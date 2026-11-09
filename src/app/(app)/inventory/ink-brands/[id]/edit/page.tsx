import { InkBrandRecordScreen } from "@/modules/inventory/ink-brands/components/ink-brand-record-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default async function EditInkBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission={inkPermissions.update}>
      <InkBrandRecordScreen mode="edit" brandId={id} />
    </PermissionGate>
  );
}
