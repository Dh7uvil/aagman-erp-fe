"use client";

import { Printer } from "lucide-react";
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
import { useCylinders } from "@/modules/inventory/cylinders/queries";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { usePrintCylinderReturnMemo } from "@/modules/inventory/cylinder-returns/lib/print-cylinder-return-memo";
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
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDate } from "@/shared/lib/format";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";

export type CylinderReturnRecordMode = "create" | "view" | "edit";

function localCalendarDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  const printMemo = usePrintCylinderReturnMemo();
  const [formError, setFormError] = useState<string | null>(null);

  const returnQuery = useCylinderReturn(mode === "create" ? null : (returnId ?? null));
  const record = returnQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const formValues =
    mode === "create"
      ? { company_id: "", cylinder_id: "", remarks: "" }
      : record
        ? { company_id: record.company_id, cylinder_id: record.cylinder_id, remarks: record.remarks ?? "" }
        : undefined;
  const formValuesReady = mode === "create" || Boolean(record);

  const form = useForm<CylinderReturnFormValues>({
    resolver: zodResolver(CylinderReturnFormSchema),
    values: formValues,
  });

  useFormResetOnRouteEntry(
    form,
    formValues,
    formValuesReady,
    `${mode}-${returnId ?? "new"}`,
  );

  const companyId = form.watch("company_id");
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const cylindersQuery = useCylinders(
    { page: 1, page_size: 100, company_id: companyId || undefined, include_closed: false },
    Boolean(companyId),
  );
  const jobOptions = useMemo(
    () =>
      (cylindersQuery.data?.data ?? [])
        .filter((row) => row.status !== "RETURNED")
        .map((row) => ({
          value: row.id,
          label: `${row.cylinder_number} — ${row.product_name}`,
        })),
    [cylindersQuery.data?.data],
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
  const returnDateLabel =
    mode === "create" ? formatDate(localCalendarDate()) : formatDate(record?.created_at);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        listHref={cylinderReturnRoutes.list}
        viewHref={returnId ? cylinderReturnRoutes.view(returnId) : cylinderReturnRoutes.list}
        editHref={returnId ? cylinderReturnRoutes.edit(returnId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
        extraActions={
          mode === "view" && record ? (
            <Button type="button" variant="outline" size="sm" onClick={() => printMemo(record)}>
              <Printer className="size-4" />
              Print memo
            </Button>
          ) : null
        }
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
                            form.setValue("cylinder_id", "");
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
                  name="cylinder_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cylinder</FormLabel>
                      <FormControl>
                        <MasterSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={readOnly || mode === "edit" || !companyId}
                          placeholder="Select cylinder"
                          options={jobOptions}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <Label>Return date</Label>
                  <Input value={returnDateLabel} disabled readOnly />
                  <span className="min-h-5" />
                </FormItem>
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
