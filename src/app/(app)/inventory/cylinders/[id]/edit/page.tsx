import { Suspense } from "react";

import { CylinderRecordScreen } from "@/modules/inventory/cylinders/components/cylinder-record-screen";
import { cylinderPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CylinderEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={cylinderPermissions.update} notFoundMessage="Cylinder not found.">
      {(id) => (
        <Suspense fallback={null}>
          <CylinderRecordScreen mode="edit" cylinderId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
