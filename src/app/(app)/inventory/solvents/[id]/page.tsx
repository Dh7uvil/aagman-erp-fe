import { SolventRecordScreen } from "@/modules/inventory/solvents/components/solvent-record-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SolventSheetViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={solventPermissions.read} notFoundMessage="Solvent sheet not found.">
      {(id) => <SolventRecordScreen mode="view" sheetId={id} />}
    </DetailPageRoute>
  );
}
