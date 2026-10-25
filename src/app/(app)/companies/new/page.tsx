import { CompanyRecordScreen } from "@/modules/users-management/companies/components/company-record-screen";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { PermissionGate } from "@/shared/auth/guards";

export default function NewCompanyPage() {
  return (
    <PermissionGate permission={companyPermissions.create}>
      <CompanyRecordScreen mode="create" />
    </PermissionGate>
  );
}
