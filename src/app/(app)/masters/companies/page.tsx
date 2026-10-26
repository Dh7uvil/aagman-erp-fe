import { CompaniesScreen } from "@/modules/users-management/companies/components/companies-screen";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function CompaniesPage() {
  return (
    <PermissionGate permission={companyPermissions.read}>
      <CompaniesScreen />
    </PermissionGate>
  );
}
