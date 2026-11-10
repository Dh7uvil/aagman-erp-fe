import { AdhesiveCodeRecordScreen } from "@/modules/inventory/adhesive-codes/components/adhesive-code-record-screen";
import { adhesiveCodePermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function AdhesiveCodeViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={adhesiveCodePermissions.read}
      notFoundMessage="Adhesive code not found."
    >
      {(id) => <AdhesiveCodeRecordScreen mode="view" codeId={id} />}
    </DetailPageRoute>
  );
}
