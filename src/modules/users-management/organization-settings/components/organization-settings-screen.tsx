import { CompanySettingsForm } from "@/modules/users-management/organization-settings/components/company-settings-form";
import { PageHeader } from "@/shared/components/layout/page-header";

export function OrganizationSettingsScreen() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Company profile, logo, and headquarters" />
      <CompanySettingsForm />
    </div>
  );
}
