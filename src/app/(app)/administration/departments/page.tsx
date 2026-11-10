import { DepartmentsScreen } from "@/modules/users-management/departments/components/departments-screen";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function DepartmentsPage() {
  return (
    <PermissionGate permission={departmentPermissions.read}>
      <DepartmentsScreen />
    </PermissionGate>
  );
}
