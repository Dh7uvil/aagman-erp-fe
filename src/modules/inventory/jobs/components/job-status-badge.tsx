import { jobStatusBadgeVariant } from "@/modules/inventory/jobs/lib/job-status-style";
import type { JobStatus } from "@/modules/inventory/jobs/schemas";
import { StatusBadge } from "@/shared/components/ui/badge";
import { humanizeEnum } from "@/shared/lib/format";

export function JobStatusBadge({ status }: { status: JobStatus | string }) {
  return (
    <StatusBadge variant={jobStatusBadgeVariant(status)}>{humanizeEnum(status)}</StatusBadge>
  );
}
