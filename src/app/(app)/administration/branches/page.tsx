import { BranchesScreen } from "@/modules/users-management/branches/components/branches-screen";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function BranchesPage() {
  return (
    <PermissionGate permission={branchPermissions.read}>
      <BranchesScreen />
    </PermissionGate>
  );
}
