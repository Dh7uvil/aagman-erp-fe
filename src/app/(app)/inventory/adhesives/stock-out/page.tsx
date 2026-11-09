import { Suspense } from "react";

import { AdhesiveStockOutScreen } from "@/modules/inventory/adhesives/components/adhesive-stock-out-screen";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function AdhesiveStockOutPage() {
  return (
    <PermissionGate permission={adhesivePermissions.update}>
      <Suspense fallback={null}>
        <AdhesiveStockOutScreen />
      </Suspense>
    </PermissionGate>
  );
}
