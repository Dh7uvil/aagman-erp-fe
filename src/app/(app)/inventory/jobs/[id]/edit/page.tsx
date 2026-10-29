import { Suspense } from "react";

import { JobRecordScreen } from "@/modules/inventory/jobs/components/job-record-screen";
import { jobPermissions } from "@/modules/inventory/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute params={params} permission={jobPermissions.update} notFoundMessage="Job not found.">
      {(id) => (
        <Suspense fallback={null}>
          <JobRecordScreen mode="edit" jobId={id} />
        </Suspense>
      )}
    </DetailPageRoute>
  );
}
