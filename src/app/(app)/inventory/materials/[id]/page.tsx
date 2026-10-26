import { Suspense } from "react";

import { MaterialProductViewScreen } from "@/modules/inventory/materials/components/material-product-view-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function MaterialViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={materialPermissions.read} notFoundMessage="Material not found.">
      {(id) => (
        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48 w-full" />
            </div>
          }
        >
          <MaterialProductViewScreen materialId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
