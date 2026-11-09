import { AdhesiveRecordScreen } from "@/modules/inventory/adhesives/components/adhesive-record-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function AdhesiveSheetViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={adhesivePermissions.read} notFoundMessage="Adhesive sheet not found.">
      {(id) => <AdhesiveRecordScreen mode="view" sheetId={id} />}
    </DetailPageRoute>
  );
}
