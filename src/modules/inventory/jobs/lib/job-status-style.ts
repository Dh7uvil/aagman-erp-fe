import type { JobStatus } from "@/modules/inventory/jobs/schemas";
import { SEMANTIC_CHART } from "@/shared/lib/semantic-colors";
import type { VariantProps } from "class-variance-authority";

import { badgeVariants } from "@/shared/components/ui/badge";

export type JobStatusBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Badge colors aligned with common ERP / ops conventions. */
export const JOB_STATUS_BADGE_VARIANT: Record<JobStatus, JobStatusBadgeVariant> = {
  ACTIVE: "info",
  RESUMED: "info",
  PAUSED: "warning",
  COMPLETED: "success",
  RETURNED: "muted",
};

/** Pie / bar fills for dashboard job status breakdown. */
export const JOB_STATUS_CHART_COLOR: Record<JobStatus, string> = {
  ACTIVE: SEMANTIC_CHART.primary,
  RESUMED: SEMANTIC_CHART.info,
  PAUSED: SEMANTIC_CHART.warning,
  COMPLETED: SEMANTIC_CHART.success,
  RETURNED: SEMANTIC_CHART.neutral,
};

export function jobStatusBadgeVariant(status: string): JobStatusBadgeVariant {
  return JOB_STATUS_BADGE_VARIANT[status as JobStatus] ?? "muted";
}

export function jobStatusChartColor(status: string): string {
  return JOB_STATUS_CHART_COLOR[status as JobStatus] ?? "var(--muted-foreground)";
}
