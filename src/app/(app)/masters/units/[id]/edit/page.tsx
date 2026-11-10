import { UnitRecordScreen } from "@/modules/inventory/units/components/unit-record-screen";
import { unitPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function UnitEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={unitPermissions.update} notFoundMessage="Unit not found.">
      {(id) => <UnitRecordScreen mode="edit" unitId={id} />}
    </DetailPageRoute>
  );
}
