"use client";

import { useMemo, useState } from "react";

import { JobsOverviewSection } from "@/modules/dashboard/components/jobs-overview-section";
import { MaterialsOverviewSection } from "@/modules/dashboard/components/materials-overview-section";
import { DashboardRangeTabs } from "@/modules/dashboard/components/range-tabs";
import { dashboardRangeParams, type DashboardRangeDays } from "@/modules/dashboard/schemas";
import { jobPermissions, materialPermissions } from "@/modules/inventory/permissions";
import { useCan } from "@/shared/providers/session-provider";

export function DashboardScreen() {
  const can = useCan();
  const canJobs = can(jobPermissions.read);
  const canMaterials = can(materialPermissions.read);
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);

  const rangeParams = useMemo(() => dashboardRangeParams(rangeDays), [rangeDays]);

  if (!canJobs && !canMaterials) {
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
      {canJobs ? <JobsOverviewSection rangeParams={rangeParams} /> : null}
      {canMaterials ? <MaterialsOverviewSection rangeParams={rangeParams} /> : null}
    </div>
  );
}
