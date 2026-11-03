import type { CylinderStatus } from "@/modules/inventory/cylinders/schemas";
import { SEMANTIC_CHART } from "@/shared/lib/semantic-colors";
import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/shared/components/ui/badge";

export type CylinderStatusBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Badge colors aligned with common ERP / ops conventions. */
export const CYLINDER_STATUS_BADGE_VARIANT: Record<CylinderStatus, CylinderStatusBadgeVariant> = {
  ACTIVE: "success",
  PAUSED: "destructive",
  COMPLETED: "success",
  RETURNED: "muted",
};

/** Pie / bar fills for dashboard cylinder status breakdown. */
export const CYLINDER_STATUS_CHART_COLOR: Record<CylinderStatus, string> = {
  ACTIVE: SEMANTIC_CHART.success,
  PAUSED: SEMANTIC_CHART.danger,
  COMPLETED: SEMANTIC_CHART.success,
  RETURNED: SEMANTIC_CHART.neutral,
};

export function cylinderStatusBadgeVariant(status: string): CylinderStatusBadgeVariant {
  return CYLINDER_STATUS_BADGE_VARIANT[status as CylinderStatus] ?? "muted";
}

export function cylinderStatusChartColor(status: string): string {
  return CYLINDER_STATUS_CHART_COLOR[status as CylinderStatus] ?? "var(--muted-foreground)";
}
