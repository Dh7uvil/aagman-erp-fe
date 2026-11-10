import { SolventNameRecordScreen } from "@/modules/inventory/solvent-names/components/solvent-name-record-screen";
import { solventNamePermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SolventNameViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={solventNamePermissions.read}
      notFoundMessage="Solvent name not found."
    >
      {(id) => <SolventNameRecordScreen mode="view" codeId={id} />}
    </DetailPageRoute>
  );
}
