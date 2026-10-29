"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCylinderReturnHistory } from "@/modules/inventory/cylinder-returns/queries";
import { useJob, useJobHistory } from "@/modules/inventory/jobs/queries";
import { EntityHistoryCard } from "@/shared/components/document/entity-history-card";
import { useSetBreadcrumbRecord } from "@/shared/components/layout/breadcrumb-record";
import { PageHeader } from "@/shared/components/layout/page-header";
import { BackLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  getHistoryResource,
  historyPageTitle,
  historyViewHref,
  isHistoryResource,
  type HistoryResource,
} from "@/shared/lib/history";

export function EntityRecordHistoryScreen({ resource, id }: { resource: string; id: string }) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const valid = isHistoryResource(resource);
  const spec = valid ? getHistoryResource(resource) : undefined;

  useSetBreadcrumbRecord(code || spec?.label || "Details");

  if (!valid || !spec) {
    return (
      <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
    );
  }

  const viewHref = historyViewHref(resource as HistoryResource, id);
  const pageTitle = historyPageTitle();

  if (resource === "jobs") {
    return (
      <JobRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Job"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  if (resource === "cylinder-returns") {
    return (
      <CylinderReturnRecordHistory
        id={id}
        viewHref={viewHref}
        code={code}
        pageTitle={pageTitle}
        recordLabel="Cylinder return"
        supportsAttachments={spec.supportsAttachments}
      />
    );
  }

  return (
    <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
  );
}

function RecordHistoryLayout({
  viewHref,
  code,
  pageTitle,
  recordLabel,
  entries,
  isLoading,
  isError,
  onRetry,
  jobId,
  job,
  supportsAttachments,
}: {
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel?: string;
  entries: ReturnType<typeof useJobHistory>["data"];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  jobId?: string;
  job?: ReturnType<typeof useJob>["data"];
  supportsAttachments: boolean;
}) {
  const subtitle = code ? (recordLabel ? `${recordLabel} · ${code}` : code) : recordLabel;

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title={pageTitle}
        subtitle={subtitle}
        actions={
          <Button type="button" variant="outline" size="sm" asChild data-page-header-persist>
            <Link href={viewHref}>
              <BackLabel>
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to record</span>
              </BackLabel>
            </Link>
          </Button>
        }
      />
      <EntityHistoryCard
        showTitle={false}
        entries={entries}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        jobId={jobId}
        job={job}
        supportsAttachments={supportsAttachments}
      />
    </div>
  );
}

function JobRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useJobHistory(id);
  const jobQuery = useJob(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading || jobQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      jobId={id}
      job={jobQuery.data}
      supportsAttachments={supportsAttachments}
    />
  );
}

function CylinderReturnRecordHistory({
  id,
  viewHref,
  code,
  pageTitle,
  recordLabel,
  supportsAttachments,
}: {
  id: string;
  viewHref: string;
  code: string | null;
  pageTitle: string;
  recordLabel: string;
  supportsAttachments: boolean;
}) {
  const historyQuery = useCylinderReturnHistory(id);
  return (
    <RecordHistoryLayout
      viewHref={viewHref}
      code={code}
      pageTitle={pageTitle}
      recordLabel={recordLabel}
      entries={historyQuery.data}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
      onRetry={() => void historyQuery.refetch()}
      supportsAttachments={supportsAttachments}
    />
  );
}
