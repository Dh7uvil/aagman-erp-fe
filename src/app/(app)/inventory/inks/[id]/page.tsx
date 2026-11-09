import { InkRecordScreen } from "@/modules/inventory/inks/components/ink-record-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function InkSheetViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={inkPermissions.read} notFoundMessage="Ink sheet not found.">
      {(id) => <InkRecordScreen mode="view" sheetId={id} />}
    </DetailPageRoute>
  );
}
