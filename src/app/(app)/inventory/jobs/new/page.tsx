import { Suspense } from "react";

import { JobRecordScreen } from "@/modules/inventory/jobs/components/job-record-screen";
import { jobPermissions } from "@/modules/inventory/permissions";
import { PermissionGate } from "@/shared/auth/guards";

const CLONE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseCloneFromId(raw: string | string[] | undefined): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  return CLONE_ID_PATTERN.test(raw) ? raw : undefined;
}

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cloneFromId = parseCloneFromId(params.clone);

  return (
    <PermissionGate permission={jobPermissions.create}>
      <Suspense fallback={null}>
        <JobRecordScreen mode="create" cloneFromId={cloneFromId} />
      </Suspense>
    </PermissionGate>
  );
}
