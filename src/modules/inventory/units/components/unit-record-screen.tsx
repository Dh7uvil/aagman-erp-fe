"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { UnitFormFields } from "@/modules/inventory/units/components/unit-form-fields";
import { useCreateUnit, useUpdateUnit } from "@/modules/inventory/units/mutations";
import { unitPermissions } from "@/modules/inventory/permissions";
import { useUnit } from "@/modules/inventory/units/queries";
import { unitRoutes } from "@/modules/inventory/units/routes";
import {
  UnitFormSchema,
  unitToFormValues,
  type UnitCreateRequest,
  type UnitFormValues,
  type UnitUpdateRequest,
} from "@/modules/inventory/units/schemas";
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

export type UnitRecordMode = "create" | "view" | "edit";

export function UnitRecordScreen({ mode, unitId }: { mode: UnitRecordMode; unitId?: string }) {
  const router = useRouter();
  const { canCreate, canUpdate } = useCrudPermissions(unitPermissions);
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const [formError, setFormError] = useState<string | null>(null);

  const unitQuery = useUnit(mode === "create" ? null : (unitId ?? null));
  const unit = unitQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(UnitFormSchema),
    values:
      mode === "create" ? unitToFormValues(null) : unit ? unitToFormValues(unit) : undefined,
  });

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: UnitFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const payload: UnitCreateRequest = {
          code: values.code.trim(),
          name: values.name.trim(),
          is_active: values.is_active,
        };
        const created = await createUnit.mutateAsync(payload);
        toast.success("Unit created");
        router.push(unitRoutes.view(created.id));
        return;
      }
      if (!unitId) {
        return;
      }
      const payload: UnitUpdateRequest = {
        code: values.code.trim(),
        name: values.name.trim(),
        is_active: values.is_active,
      };
      await updateUnit.mutateAsync({ id: unitId, values: payload });
      toast.success("Unit updated");
      router.push(unitRoutes.view(unitId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createUnit.isPending || updateUnit.isPending;

  if (mode !== "create" && unitQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && unitQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(unitQuery.error)}
        onRetry={() => unitQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !unit) {
    return <p className="text-muted-foreground text-sm">Unit not found.</p>;
  }

  const title =
    mode === "create" ? "New unit" : mode === "edit" ? "Edit unit" : (unit?.name ?? "Unit");

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={
          mode === "view"
            ? "View unit of measure"
            : mode === "edit"
              ? "Update unit details"
              : "Create a unit of measure"
        }
        listHref={unitRoutes.list}
        viewHref={unitId ? unitRoutes.view(unitId) : unitRoutes.list}
        editHref={unitId ? unitRoutes.edit(unitId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <UnitFormFields control={form.control} readOnly={readOnly} />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create unit" : "Save changes"}
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
