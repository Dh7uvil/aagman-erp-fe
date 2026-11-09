"use client";

import { useMemo, useState } from "react";

import { AdhesivesOverviewSection } from "@/modules/dashboard/components/adhesives-overview-section";
import { SolventsOverviewSection } from "@/modules/dashboard/components/solvents-overview-section";
import { CylindersOverviewSection } from "@/modules/dashboard/components/cylinders-overview-section";
import { InksOverviewSection } from "@/modules/dashboard/components/inks-overview-section";
import { MaterialsOverviewSection } from "@/modules/dashboard/components/materials-overview-section";
import { DashboardRangeTabs } from "@/modules/dashboard/components/range-tabs";
import {
  DashboardSectionTabs,
  type DashboardInventorySection,
} from "@/modules/dashboard/components/section-tabs";
import { dashboardRangeParams, type DashboardRangeDays } from "@/modules/dashboard/schemas";
import {
  adhesivePermissions,
  cylinderPermissions,
  inkPermissions,
  materialPermissions,
  solventPermissions,
} from "@/modules/inventory/permissions";
import { useCan } from "@/shared/providers/session-provider";

export function DashboardScreen() {
  const can = useCan();
  const canCylinders = can(cylinderPermissions.read);
  const canMaterials = can(materialPermissions.read);
  const canInks = can(inkPermissions.read);
  const canAdhesives = can(adhesivePermissions.read);
  const canSolvents = can(solventPermissions.read);
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30);
  const [activeSection, setActiveSection] = useState<DashboardInventorySection | null>(null);

  const rangeParams = useMemo(() => dashboardRangeParams(rangeDays), [rangeDays]);

  const availableSections = useMemo(() => {
    const sections: DashboardInventorySection[] = [];
    if (canMaterials) {
      sections.push("materials");
    }
    if (canCylinders) {
      sections.push("cylinders");
    }
    if (canInks) {
      sections.push("inks");
    }
    if (canAdhesives) {
      sections.push("adhesives");
    }
    if (canSolvents) {
      sections.push("solvents");
    }
    return sections;
  }, [canMaterials, canCylinders, canInks, canAdhesives, canSolvents]);

  if (availableSections.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You do not have permission to view inventory dashboard metrics.
      </p>
    );
  }

  const resolvedSection: DashboardInventorySection =
    activeSection && availableSections.includes(activeSection)
      ? activeSection
      : availableSections[0];

  return (
    <div className="mt-6 flex flex-col gap-6 sm:mt-8 sm:gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">Overview for inventory operations</p>
          <DashboardRangeTabs value={rangeDays} onChange={setRangeDays} />
        </div>
        <DashboardSectionTabs
          value={resolvedSection}
          onChange={setActiveSection}
          sections={availableSections}
        />
      </div>
      {resolvedSection === "materials" ? (
        <MaterialsOverviewSection rangeParams={rangeParams} />
      ) : null}
      {resolvedSection === "cylinders" ? (
        <CylindersOverviewSection rangeParams={rangeParams} />
      ) : null}
      {resolvedSection === "inks" ? <InksOverviewSection rangeParams={rangeParams} /> : null}
      {resolvedSection === "adhesives" ? (
        <AdhesivesOverviewSection rangeParams={rangeParams} />
      ) : null}
      {resolvedSection === "solvents" ? (
        <SolventsOverviewSection rangeParams={rangeParams} />
      ) : null}
    </div>
  );
}
