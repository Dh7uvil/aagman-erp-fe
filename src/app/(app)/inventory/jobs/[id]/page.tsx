import { Suspense } from "react";

import { JobRecordScreen } from "@/modules/inventory/jobs/components/job-record-screen";
import { jobPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function JobViewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={jobPermissions.read} notFoundMessage="Job not found.">
      {(id) => (
        <Suspense fallback={null}>
          <JobRecordScreen mode="view" jobId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
