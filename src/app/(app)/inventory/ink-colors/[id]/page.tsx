import { InkColorRecordScreen } from "@/modules/inventory/ink-colors/components/ink-color-record-screen";
import { inkColorPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function InkColorViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={inkColorPermissions.read}
      notFoundMessage="Ink color not found."
    >
      {(id) => <InkColorRecordScreen mode="view" colorId={id} />}
    </DetailPageRoute>
  );
}
