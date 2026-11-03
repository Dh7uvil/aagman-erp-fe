"use client";

import { useMemo, useState } from "react";

import { CylindersOverviewSection } from "@/modules/dashboard/components/cylinders-overview-section";
import { MaterialsOverviewSection } from "@/modules/dashboard/components/materials-overview-section";
import { DashboardRangeTabs } from "@/modules/dashboard/components/range-tabs";
import { dashboardRangeParams, type DashboardRangeDays } from "@/modules/dashboard/schemas";
import { cylinderPermissions, materialPermissions } from "@/modules/inventory/permissions";
import { useCan } from "@/shared/providers/session-provider";

export function DashboardScreen() {
  const can = useCan();
  const canCylinders = can(cylinderPermissions.read);
  const canMaterials = can(materialPermissions.read);
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);

  const rangeParams = useMemo(() => dashboardRangeParams(rangeDays), [rangeDays]);

  if (!canCylinders && !canMaterials) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view inventory dashboard metrics.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6 sm:mt-8 sm:gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">Overview for inventory operations</p>
        <DashboardRangeTabs value={rangeDays} onChange={setRangeDays} />
      </div>
      {canMaterials ? <MaterialsOverviewSection rangeParams={rangeParams} /> : null}
      {canCylinders ? <CylindersOverviewSection rangeParams={rangeParams} /> : null}
    </div>
  );
}
