import { Suspense } from "react";

import { InkStockOutScreen } from "@/modules/inventory/inks/components/ink-stock-out-screen";
import { inkPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InkStockOutPage() {
  return (
    <PermissionGate permission={inkPermissions.update}>
      <Suspense fallback={null}>
        <InkStockOutScreen />
      </Suspense>
    </PermissionGate>
  );
}
