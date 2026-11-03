import { cylinderStatusBadgeVariant } from "@/modules/inventory/cylinders/lib/cylinder-status-style";
import type { CylinderStatus } from "@/modules/inventory/cylinders/schemas";
import { StatusBadge } from "@/shared/components/ui/badge";
import { humanizeEnum } from "@/shared/lib/format";

export function CylinderStatusBadge({ status }: { status: CylinderStatus | string }) {
  return (
    <StatusBadge variant={cylinderStatusBadgeVariant(status)}>{humanizeEnum(status)}</StatusBadge>
  );
}
