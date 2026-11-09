import { SolventNameRecordScreen } from "@/modules/inventory/solvent-names/components/solvent-name-record-screen";
import { solventNamePermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SolventNameEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={solventNamePermissions.update}
      notFoundMessage="Solvent name not found."
    >
      {(id) => <SolventNameRecordScreen mode="edit" codeId={id} />}
    </DetailPageRoute>
  );
}
