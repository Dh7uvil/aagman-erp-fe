import { JobsScreen } from "@/modules/inventory/jobs/components/jobs-screen";
import { jobPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function InventoryJobsPage() {
  return (
    <PermissionGate permission={jobPermissions.read}>
      <JobsScreen />
    </PermissionGate>
  );
}
