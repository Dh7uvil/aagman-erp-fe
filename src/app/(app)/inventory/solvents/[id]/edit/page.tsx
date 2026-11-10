import { SolventRecordScreen } from "@/modules/inventory/solvents/components/solvent-record-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SolventSheetEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={solventPermissions.update} notFoundMessage="Solvent sheet not found.">
      {(id) => <SolventRecordScreen mode="edit" sheetId={id} />}
    </DetailPageRoute>
  );
}
