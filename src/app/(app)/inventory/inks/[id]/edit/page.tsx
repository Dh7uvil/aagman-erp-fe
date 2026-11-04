import { InkRecordScreen } from "@/modules/inventory/inks/components/ink-record-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function InkSheetEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={inkPermissions.update} notFoundMessage="Ink sheet not found.">
      {(id) => <InkRecordScreen mode="edit" sheetId={id} />}
    </DetailPageRoute>
  );
}
