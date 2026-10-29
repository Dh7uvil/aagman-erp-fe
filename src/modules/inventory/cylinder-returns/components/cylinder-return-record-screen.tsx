"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { cylinderReturnPermissions } from "@/modules/inventory/permissions";
import { useCreateCylinderReturn, useUpdateCylinderReturn } from "@/modules/inventory/cylinder-returns/mutations";
import { useCylinderReturn } from "@/modules/inventory/cylinder-returns/queries";
import { cylinderReturnRoutes } from "@/modules/inventory/cylinder-returns/routes";
import {
  CylinderReturnFormSchema,
  type CylinderReturnFormValues,
} from "@/modules/inventory/cylinder-returns/schemas";
import { useJobs } from "@/modules/inventory/jobs/queries";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { MasterSelect } from "@/shared/components/form/master-select";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { historyHref } from "@/shared/lib/history";
import {
  Form,
  FormControl,
  FormField,
  FormGrid,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

export type CylinderReturnRecordMode = "create" | "view" | "edit";

export function CylinderReturnRecordScreen({
  mode,
  returnId,
}: {
  mode: CylinderReturnRecordMode;
  returnId?: string;
}) {
  const router = useRouter();
  const { canCreate, canUpdate } = useCrudPermissions(cylinderReturnPermissions);
  const createReturn = useCreateCylinderReturn();
  const updateReturn = useUpdateCylinderReturn();
  const [formError, setFormError] = useState<string | null>(null);

  const returnQuery = useCylinderReturn(mode === "create" ? null : (returnId ?? null));
  const record = returnQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const form = useForm<CylinderReturnFormValues>({
    resolver: zodResolver(CylinderReturnFormSchema),
    values:
      mode === "create"
        ? { company_id: "", job_id: "", remarks: "" }
        : record
          ? { company_id: record.company_id, job_id: record.job_id, remarks: record.remarks ?? "" }
          : undefined,
  });

  const companyId = form.watch("company_id");
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const jobsQuery = useJobs(
    { page: 1, page_size: 100, company_id: companyId || undefined, include_closed: false },
    Boolean(companyId),
  );
  const jobOptions = useMemo(
    () =>
      (jobsQuery.data?.data ?? [])
        .filter((job) => job.status !== "RETURNED")
        .map((job) => ({ value: job.id, label: `${job.job_number} — ${job.product_name}` })),
    [jobsQuery.data?.data],
  );

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: CylinderReturnFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createReturn.mutateAsync(values);
        toast.success("Cylinder return created");
        router.push(cylinderReturnRoutes.view(created.id));
        return;
      }
      if (!returnId) {
        return;
      }
      await updateReturn.mutateAsync({ id: returnId, values });
      toast.success("Return updated");
      router.push(cylinderReturnRoutes.view(returnId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  if (mode !== "create" && returnQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (mode !== "create" && returnQuery.isError) {
    return (
      <DataTableError message={getErrorMessage(returnQuery.error)} onRetry={() => returnQuery.refetch()} />
    );
  }

  const title =
    mode === "create"
      ? "New cylinder return"
      : mode === "edit"
        ? "Edit cylinder return"
        : (record?.return_number ?? "Cylinder return");

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        listHref={cylinderReturnRoutes.list}
        viewHref={returnId ? cylinderReturnRoutes.view(returnId) : cylinderReturnRoutes.list}
        editHref={returnId ? cylinderReturnRoutes.edit(returnId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        {mode === "view" && returnId ? (
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Cylinder return</CardTitle>
            <HistoryHeaderButton
              href={historyHref("cylinder-returns", returnId, record?.return_number ?? null)}
            />
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && returnId ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <FormGrid columns={2}>
                <FormField
                  control={form.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <MasterSelect
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("job_id", "");
                          }}
                          disabled={readOnly || mode === "edit"}
                          placeholder="Select customer"
                          options={(companiesQuery.data?.data ?? []).map((c) => ({
                            value: c.id,
                            label: c.name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="job_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job</FormLabel>
                      <FormControl>
                        <MasterSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={readOnly || mode === "edit" || !companyId}
                          placeholder="Select job"
                          options={jobOptions}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormGrid>
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={readOnly} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={createReturn.isPending || updateReturn.isPending}>
                    {mode === "create" ? "Create return" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      {mode === "view" && record ? (
        <RelatedDocumentsCard documents={record.related_documents ?? []} />
      ) : null}
    </div>
  );
}
