import { Suspense } from "react";

import { MaterialEditScreen } from "@/modules/inventory/materials/components/material-edit-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function MaterialEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={materialPermissions.update} notFoundMessage="Material not found.">
      {(id) => (
        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <MaterialEditScreen materialId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
