import { Suspense } from "react";

import { CylinderReturnRecordScreen } from "@/modules/inventory/cylinder-returns/components/cylinder-return-record-screen";
import { cylinderReturnPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CylinderReturnEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={cylinderReturnPermissions.update}
      notFoundMessage="Cylinder return not found."
    >
      {(id) => (
        <Suspense fallback={null}>
          <CylinderReturnRecordScreen mode="edit" returnId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
