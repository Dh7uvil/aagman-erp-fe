"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  companyFormToCreateRequest,
  companyFormToUpdateRequest,
} from "@/modules/users-management/companies/company-payload";
import { CompanyFormFields } from "@/modules/users-management/companies/components/company-form-fields";
import { useCreateCompany, useUpdateCompany } from "@/modules/users-management/companies/mutations";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { useCompany } from "@/modules/users-management/companies/queries";
import { companyRoutes } from "@/modules/users-management/companies/routes";
import {
  CompanyFormSchema,
  companyToFormValues,
  type CompanyFormValues,
} from "@/modules/users-management/companies/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

export type CompanyRecordMode = "create" | "view" | "edit";

export function CompanyRecordScreen({
  mode,
  companyId,
}: {
  mode: CompanyRecordMode;
  companyId?: string;
}) {
  const router = useRouter();
  const { canCreate, canUpdate } = useCrudPermissions(companyPermissions);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const [formError, setFormError] = useState<string | null>(null);

  const companyQuery = useCompany(mode === "create" ? null : (companyId ?? null));
  const company = companyQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(CompanyFormSchema),
    values:
      mode === "create"
        ? companyToFormValues(null)
        : company
          ? companyToFormValues(company)
          : undefined,
  });

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: CompanyFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createCompany.mutateAsync(companyFormToCreateRequest(values));
        toast.success("Company created");
        router.push(companyRoutes.view(created.id));
        return;
      }
      if (!companyId) {
        return;
      }
      await updateCompany.mutateAsync({
        id: companyId,
        values: companyFormToUpdateRequest(values),
      });
      toast.success("Company updated");
      router.push(companyRoutes.view(companyId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createCompany.isPending || updateCompany.isPending;

  if (mode !== "create" && companyQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && companyQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(companyQuery.error)}
        onRetry={() => companyQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !company) {
    return <p className="text-muted-foreground text-sm">Company not found.</p>;
  }

  const title =
    mode === "create" ? "New company" : mode === "edit" ? "Edit company" : (company?.name ?? "Company");
  const subtitle =
    mode === "view"
      ? "View company details"
      : mode === "edit"
        ? "Update company master record"
        : "Create a company master record";

  const listHref = companyRoutes.list;
  const viewHref = companyId ? companyRoutes.view(companyId) : listHref;
  const editHref = companyId ? companyRoutes.edit(companyId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        listHref={listHref}
        viewHref={viewHref}
        editHref={editHref}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <CompanyFormFields control={form.control} readOnly={readOnly} />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create company" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
