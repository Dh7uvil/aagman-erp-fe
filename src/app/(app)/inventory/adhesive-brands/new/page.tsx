import { AdhesiveBrandRecordScreen } from "@/modules/inventory/adhesive-brands/components/adhesive-brand-record-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewAdhesiveBrandPage() {
  return (
    <PermissionGate permission={adhesivePermissions.create}>
      <AdhesiveBrandRecordScreen mode="create" />
    </PermissionGate>
  );
}
