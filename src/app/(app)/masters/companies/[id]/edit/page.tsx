import { CompanyRecordScreen } from "@/modules/users-management/companies/components/company-record-screen";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CompanyEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={companyPermissions.update}
      notFoundMessage="Company not found."
    >
      {(id) => <CompanyRecordScreen mode="edit" companyId={id} />}
    </DetailPageRoute>
  );
}
