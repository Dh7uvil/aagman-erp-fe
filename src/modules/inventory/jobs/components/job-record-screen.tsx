"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { jobPermissions } from "@/modules/inventory/permissions";
import { JobFormFields } from "@/modules/inventory/jobs/components/job-form-fields";
import {
  JobHeaderCreateActions,
  jobSecondaryHeaderActionClass,
} from "@/modules/inventory/jobs/components/job-header-create-actions";
import { JobPauseDialog } from "@/modules/inventory/jobs/components/job-pause-dialog";
import { JobResumeDialog } from "@/modules/inventory/jobs/components/job-resume-dialog";
import { useCreateJob, useUpdateJob } from "@/modules/inventory/jobs/mutations";
import { useJob } from "@/modules/inventory/jobs/queries";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import {
  JobFormSchema,
  jobToCloneFormValues,
  jobToFormValues,
  type Job,
  type JobFormValues,
} from "@/modules/inventory/jobs/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useCan } from "@/shared/providers/session-provider";
import { DataTableError } from "@/shared/components/data-table/states";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { PauseLabel, ResumeLabel } from "@/shared/components/ui/action-button-labels";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { historyHref } from "@/shared/lib/history";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

export type JobRecordMode = "create" | "view" | "edit";

function JobRecordForm({
  mode,
  jobId,
  job,
  formValues,
  readOnly,
  canSubmit,
  canViewHistory,
  pauseOpen,
  onPauseOpenChange,
  resumeOpen,
  onResumeOpenChange,
  onJobPaused,
  onJobResumed,
}: {
  mode: JobRecordMode;
  jobId?: string;
  job: Job | null;
  formValues: JobFormValues;
  readOnly: boolean;
  canSubmit: boolean;
  canViewHistory: boolean;
  pauseOpen: boolean;
  onPauseOpenChange: (open: boolean) => void;
  resumeOpen: boolean;
  onResumeOpenChange: (open: boolean) => void;
  onJobPaused?: () => void;
  onJobResumed?: () => void;
}) {
  const router = useRouter();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(JobFormSchema),
    values: formValues,
  });

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: JobFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createJob.mutateAsync(values);
        toast.success("Job created");
        router.push(jobRoutes.view(created.id));
        return;
      }
      if (!jobId) {
        return;
      }
      await updateJob.mutateAsync({ id: jobId, values });
      toast.success("Job updated");
      router.push(jobRoutes.view(jobId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <>
      <Card>
        {mode === "view" && jobId ? (
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Job</CardTitle>
            {canViewHistory ? (
              <HistoryHeaderButton href={historyHref("jobs", jobId, job?.job_number ?? null)} />
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && jobId ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <JobFormFields
                control={form.control}
                readOnly={readOnly}
                setValue={form.setValue}
                job={mode === "create" ? null : job}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={createJob.isPending || updateJob.isPending}>
                    {mode === "create" ? "Create job" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      {mode === "view" && job ? (
        <>
          <RelatedDocumentsCard documents={job.related_documents ?? []} />
          {jobId ? (
            <>
              <JobPauseDialog
                jobId={jobId}
                open={pauseOpen}
                onOpenChange={onPauseOpenChange}
                onPaused={onJobPaused}
              />
              <JobResumeDialog
                jobId={jobId}
                open={resumeOpen}
                onOpenChange={onResumeOpenChange}
                onResumed={onJobResumed}
              />
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function JobRecordScreen({
  mode,
  jobId,
  cloneFromId,
}: {
  mode: JobRecordMode;
  jobId?: string;
  cloneFromId?: string;
}) {
  const can = useCan();
  const { canCreate, canRead, canUpdate } = useCrudPermissions(jobPermissions);
  const canViewHistory = can(jobPermissions.history);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  const jobQuery = useJob(mode === "create" ? null : (jobId ?? null));
  const cloneSourceQuery = useJob(mode === "create" && cloneFromId ? cloneFromId : null);
  const job = jobQuery.data;
  const cloneSource = cloneSourceQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  if (mode === "create" && cloneFromId && cloneSourceQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode === "create" && cloneFromId && cloneSourceQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(cloneSourceQuery.error)}
        onRetry={() => cloneSourceQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && jobQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && jobQuery.isError) {
    return (
      <DataTableError message={getErrorMessage(jobQuery.error)} onRetry={() => jobQuery.refetch()} />
    );
  }

  if (mode !== "create" && !job) {
    return <p className="text-muted-foreground text-sm">Job not found.</p>;
  }

  const formValues =
    mode === "create"
      ? cloneFromId && cloneSource
        ? jobToCloneFormValues(cloneSource)
        : jobToFormValues(null)
      : jobToFormValues(job!);

  const formKey =
    mode === "create" ? `create-${cloneFromId ?? "new"}` : `${job!.id}-${job!.updated_at}`;

  const title =
    mode === "create"
      ? cloneFromId && cloneSource
        ? "Clone job"
        : "New job"
      : mode === "edit"
        ? "Edit job"
        : (job?.job_number ?? "Job");
  const createSubtitle =
    cloneFromId && cloneSource
      ? `Prefilled from ${cloneSource.job_number}. Job image and challan are not copied.`
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={mode === "view" ? job?.product_name : createSubtitle}
        listHref={jobRoutes.list}
        viewHref={jobId ? jobRoutes.view(jobId) : jobRoutes.list}
        editHref={jobId ? jobRoutes.edit(jobId) : undefined}
        canUpdate={canUpdate && job?.status !== "RETURNED"}
        mode={mode === "edit" ? "edit" : "view"}
        splitSecondaryActionsOnMobile={mode === "view"}
        extraActions={
          mode === "view" && job ? (
            <>
              {canCreate && canRead ? (
                <JobHeaderCreateActions cloneHref={jobRoutes.clone(job.id)} showNewJob={false} />
              ) : null}
              {canUpdate ? (
                <>
                  {job.status !== "PAUSED" &&
                  job.status !== "RETURNED" &&
                  job.status !== "COMPLETED" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={jobSecondaryHeaderActionClass}
                      onClick={() => setPauseOpen(true)}
                    >
                      <PauseLabel />
                    </Button>
                  ) : null}
                  {job.status === "PAUSED" ? (
                    <Button type="button" size="sm" onClick={() => setResumeOpen(true)}>
                      <ResumeLabel />
                    </Button>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null
        }
      />
      <JobRecordForm
        key={formKey}
        mode={mode}
        jobId={jobId}
        job={mode === "create" ? null : job!}
        formValues={formValues}
        readOnly={readOnly}
        canSubmit={Boolean(canSubmit)}
        canViewHistory={canViewHistory}
        pauseOpen={pauseOpen}
        onPauseOpenChange={setPauseOpen}
        resumeOpen={resumeOpen}
        onResumeOpenChange={setResumeOpen}
        onJobPaused={() => void jobQuery.refetch()}
        onJobResumed={() => void jobQuery.refetch()}
      />
    </div>
  );
}
