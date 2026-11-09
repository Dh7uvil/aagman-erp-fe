import { Suspense } from "react";

import { SolventStockOutScreen } from "@/modules/inventory/solvents/components/solvent-stock-out-screen";
import { solventPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function SolventStockOutPage() {
  return (
    <PermissionGate permission={solventPermissions.update}>
      <Suspense fallback={null}>
        <SolventStockOutScreen />
      </Suspense>
    </PermissionGate>
  );
}
