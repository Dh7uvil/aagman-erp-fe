import { InkColorRecordScreen } from "@/modules/inventory/ink-colors/components/ink-color-record-screen";
import { inkColorPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function InkColorEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={inkColorPermissions.update}
      notFoundMessage="Ink color not found."
    >
      {(id) => <InkColorRecordScreen mode="edit" colorId={id} />}
    </DetailPageRoute>
  );
}
