import { Suspense } from "react";

import { MaterialRecordScreen } from "@/modules/inventory/materials/components/material-record-screen";
import { materialPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function NewMaterialPage() {
  return (
    <PermissionGate permission={materialPermissions.create}>
      <Suspense
        fallback={
          <div className="flex flex-col gap-5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <MaterialRecordScreen />
      </Suspense>
    </PermissionGate>
  );
}
