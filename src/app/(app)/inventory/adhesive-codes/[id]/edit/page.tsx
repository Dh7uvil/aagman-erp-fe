import { AdhesiveCodeRecordScreen } from "@/modules/inventory/adhesive-codes/components/adhesive-code-record-screen";
import { adhesiveCodePermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function AdhesiveCodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={adhesiveCodePermissions.update}
      notFoundMessage="Adhesive code not found."
    >
      {(id) => <AdhesiveCodeRecordScreen mode="edit" codeId={id} />}
    </DetailPageRoute>
  );
}
