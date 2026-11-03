"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { cylinderPermissions } from "@/modules/inventory/permissions";
import { CylinderFormFields } from "@/modules/inventory/cylinders/components/cylinder-form-fields";
import {
  CylinderHeaderCreateActions,
  cylinderSecondaryHeaderActionClass,
} from "@/modules/inventory/cylinders/components/cylinder-header-create-actions";
import { CylinderPauseDialog } from "@/modules/inventory/cylinders/components/cylinder-pause-dialog";
import { CylinderResumeDialog } from "@/modules/inventory/cylinders/components/cylinder-resume-dialog";
import { CylinderStatusBadge } from "@/modules/inventory/cylinders/components/cylinder-status-badge";
import { useCreateCylinder, useUpdateCylinder } from "@/modules/inventory/cylinders/mutations";
import { useCylinder } from "@/modules/inventory/cylinders/queries";
import { cylinderRoutes } from "@/modules/inventory/cylinders/routes";
import {
  CylinderFormSchema,
  cylinderToCloneFormValues,
  cylinderToFormValues,
  type Cylinder,
  type CylinderFormValues,
} from "@/modules/inventory/cylinders/schemas";
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
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";

export type CylinderRecordMode = "create" | "view" | "edit";

function CylinderRecordForm({
  mode,
  cylinderId,
  cylinder,
  formValues,
  readOnly,
  canSubmit,
  canViewHistory,
  pauseOpen,
  onPauseOpenChange,
  resumeOpen,
  onResumeOpenChange,
  onCylinderPaused,
  onCylinderResumed,
}: {
  mode: CylinderRecordMode;
  cylinderId?: string;
  cylinder: Cylinder | null;
  formValues: CylinderFormValues;
  readOnly: boolean;
  canSubmit: boolean;
  canViewHistory: boolean;
  pauseOpen: boolean;
  onPauseOpenChange: (open: boolean) => void;
  resumeOpen: boolean;
  onResumeOpenChange: (open: boolean) => void;
  onCylinderPaused?: () => void;
  onCylinderResumed?: () => void;
}) {
  const router = useRouter();
  const createJob = useCreateCylinder();
  const updateJob = useUpdateCylinder();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CylinderFormValues>({
    resolver: zodResolver(CylinderFormSchema),
    values: formValues,
  });

  useFormResetOnRouteEntry(form, formValues, true, `${mode}-${cylinderId ?? "new"}`);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: CylinderFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createJob.mutateAsync(values);
        toast.success("Cylinder created");
        router.push(cylinderRoutes.view(created.id));
        return;
      }
      if (!cylinderId) {
        return;
      }
      await updateJob.mutateAsync({ id: cylinderId, values });
      toast.success("Cylinder updated");
      router.push(cylinderRoutes.view(cylinderId));
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
        {mode === "view" && cylinderId ? (
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Cylinder</CardTitle>
            {canViewHistory ? (
              <HistoryHeaderButton href={historyHref("cylinders", cylinderId, cylinder?.cylinder_number ?? null)} />
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && cylinderId ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <CylinderFormFields
                control={form.control}
                readOnly={readOnly}
                setValue={form.setValue}
                cylinder={mode === "create" ? null : cylinder}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={createJob.isPending || updateJob.isPending}>
                    {mode === "create" ? "Create cylinder" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      {mode === "view" && cylinder ? (
        <>
          <RelatedDocumentsCard documents={cylinder.related_documents ?? []} />
          {cylinderId ? (
            <>
              <CylinderPauseDialog
                cylinderId={cylinderId}
                open={pauseOpen}
                onOpenChange={onPauseOpenChange}
                onPaused={onCylinderPaused}
              />
              <CylinderResumeDialog
                cylinderId={cylinderId}
                open={resumeOpen}
                onOpenChange={onResumeOpenChange}
                onResumed={onCylinderResumed}
              />
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function CylinderRecordScreen({
  mode,
  cylinderId,
  cloneFromId,
}: {
  mode: CylinderRecordMode;
  cylinderId?: string;
  cloneFromId?: string;
}) {
  const can = useCan();
  const { canCreate, canRead, canUpdate } = useCrudPermissions(cylinderPermissions);
  const canViewHistory = can(cylinderPermissions.history);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  const cylinderQuery = useCylinder(mode === "create" ? null : (cylinderId ?? null));
  const cloneSourceQuery = useCylinder(mode === "create" && cloneFromId ? cloneFromId : null);
  const cylinder = cylinderQuery.data;
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

  if (mode !== "create" && cylinderQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && cylinderQuery.isError) {
    return (
      <DataTableError message={getErrorMessage(cylinderQuery.error)} onRetry={() => cylinderQuery.refetch()} />
    );
  }

  if (mode !== "create" && !cylinder) {
    return <p className="text-muted-foreground text-sm">Cylinder not found.</p>;
  }

  const formValues =
    mode === "create"
      ? cloneFromId && cloneSource
        ? cylinderToCloneFormValues(cloneSource)
        : cylinderToFormValues(null)
      : cylinderToFormValues(cylinder!);

  const formKey =
    mode === "create" ? `create-${cloneFromId ?? "new"}` : `${cylinder!.id}-${mode}-${cylinder!.updated_at}`;

  const title =
    mode === "create"
      ? cloneFromId && cloneSource
        ? "Clone cylinder"
        : "New cylinder"
      : mode === "edit"
        ? "Edit cylinder"
        : (cylinder?.cylinder_number ?? "Cylinder");
  const createSubtitle =
    cloneFromId && cloneSource
      ? `Prefilled from ${cloneSource.cylinder_number}. Cylinder image and challan are not copied.`
      : undefined;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={mode === "view" ? cylinder?.product_name : createSubtitle}
        badges={mode === "view" && cylinder ? <CylinderStatusBadge status={cylinder.status} /> : undefined}
        listHref={cylinderRoutes.list}
        viewHref={cylinderId ? cylinderRoutes.view(cylinderId) : cylinderRoutes.list}
        editHref={cylinderId ? cylinderRoutes.edit(cylinderId) : undefined}
        canUpdate={canUpdate && cylinder?.status !== "RETURNED"}
        mode={mode === "edit" ? "edit" : "view"}
        splitSecondaryActionsOnMobile={mode === "view"}
        extraActions={
          mode === "view" && cylinder ? (
            <>
              {canCreate && canRead ? (
                <CylinderHeaderCreateActions cloneHref={cylinderRoutes.clone(cylinder.id)} showNewCylinder={false} />
              ) : null}
              {canUpdate ? (
                <>
                  {cylinder.status !== "PAUSED" &&
                  cylinder.status !== "RETURNED" &&
                  cylinder.status !== "COMPLETED" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className={cylinderSecondaryHeaderActionClass}
                      onClick={() => setPauseOpen(true)}
                    >
                      <PauseLabel />
                    </Button>
                  ) : null}
                  {cylinder.status === "PAUSED" ? (
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
      <CylinderRecordForm
        key={formKey}
        mode={mode}
        cylinderId={cylinderId}
        cylinder={mode === "create" ? null : cylinder!}
        formValues={formValues}
        readOnly={readOnly}
        canSubmit={Boolean(canSubmit)}
        canViewHistory={canViewHistory}
        pauseOpen={pauseOpen}
        onPauseOpenChange={setPauseOpen}
        resumeOpen={resumeOpen}
        onResumeOpenChange={setResumeOpen}
        onCylinderPaused={() => void cylinderQuery.refetch()}
        onCylinderResumed={() => void cylinderQuery.refetch()}
      />
    </div>
  );
}
