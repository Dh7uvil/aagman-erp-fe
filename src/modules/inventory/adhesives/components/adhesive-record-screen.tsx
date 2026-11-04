"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdhesiveFormFields } from "@/modules/inventory/adhesives/components/adhesive-form-fields";
import { AdhesiveSheetMovementsHeaderButton } from "@/modules/inventory/adhesives/components/adhesive-sheet-movements-header-button";
import { AdhesiveStockOutDialog } from "@/modules/inventory/adhesives/components/adhesive-stock-out-dialog";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { useCreateAdhesiveSheet, useUpdateAdhesiveSheet } from "@/modules/inventory/adhesives/mutations";
import { useAdhesive } from "@/modules/inventory/adhesives/queries";
import { adhesiveRoutes } from "@/modules/inventory/adhesives/routes";
import {
  AdhesiveFormSchema,
  adhesiveFormToCreatePayload,
  adhesiveFormToUpdatePayload,
  adhesiveSheetFormRevision,
  emptyAdhesiveLine,
  adhesiveSheetToFormValues,
  type AdhesiveFormValues,
} from "@/modules/inventory/adhesives/schemas";
import { adhesivePermissions, adhesivePricePermissions } from "@/modules/inventory/permissions";
import { useAllUnits } from "@/modules/inventory/units/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";
import { useFormResetWhenServerChanges } from "@/shared/hooks/use-form-reset-when-server-changes";
import { useCan } from "@/shared/providers/session-provider";

export type AdhesiveRecordMode = "create" | "view" | "edit";

export function AdhesiveRecordScreen({ mode, sheetId }: { mode: AdhesiveRecordMode; sheetId?: string }) {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(adhesivePricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(adhesivePermissions);
  const createSheet = useCreateAdhesiveSheet();
  const updateSheet = useUpdateAdhesiveSheet();
  const [formError, setFormError] = useState<string | null>(null);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const sheetQuery = useAdhesive(mode === "create" ? null : (sheetId ?? null));
  const sheet = sheetQuery.data;
  const unitsQuery = useAllUnits();
  const defaultUnitId = unitsQuery.data?.find((u) => u.code === "kg")?.id ?? "";

  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;
  const canStockOut = mode !== "create" && canUpdate && Boolean(sheet?.lines.length);
  const canViewHistory = can(adhesivePermissions.history);

  const formValues = useMemo(() => {
    if (mode === "create") {
      return adhesiveSheetToFormValues(null, defaultUnitId);
    }
    return sheet ? adhesiveSheetToFormValues(sheet, defaultUnitId) : undefined;
  }, [mode, sheet, defaultUnitId]);

  const formValuesReady = mode === "create" ? Boolean(defaultUnitId) : Boolean(sheet && defaultUnitId);

  const serverRevision =
    mode !== "create" && sheet ? adhesiveSheetFormRevision(sheet) : undefined;

  const form = useForm<AdhesiveFormValues>({
    resolver: zodResolver(AdhesiveFormSchema),
    defaultValues: {
      company_id: "",
      lines: [emptyAdhesiveLine("")],
    },
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${sheetId ?? "new"}`);
  useFormResetWhenServerChanges(form, formValues, formValuesReady, serverRevision);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: AdhesiveFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createSheet.mutateAsync(
          adhesiveFormToCreatePayload(values, canViewPrice),
        );
        toast.success("Adhesive stock saved");
        router.push(adhesiveRoutes.view(created.id));
        return;
      }
      if (!sheetId) {
        return;
      }
      const updated = await updateSheet.mutateAsync({
        id: sheetId,
        values: adhesiveFormToUpdatePayload(values, canViewPrice),
      });
      form.reset(adhesiveSheetToFormValues(updated, defaultUnitId));
      toast.success("Adhesive sheet updated");
      router.replace(adhesiveRoutes.view(sheetId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createSheet.isPending || updateSheet.isPending;

  if (mode !== "create" && sheetQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && sheetQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(sheetQuery.error)}
        onRetry={() => sheetQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !sheet) {
    return <p className="text-muted-foreground text-sm">Adhesive sheet not found.</p>;
  }

  const title =
    mode === "create"
      ? "New adhesive sheet"
      : mode === "edit"
        ? (sheet?.company_name ?? "Edit adhesive sheet")
        : (sheet?.company_name ?? "Adhesive sheet");

  const subtitle =
    mode === "create"
      ? "Create adhesive lines for a company with optional product and adhesive images"
      : mode === "edit"
        ? "Update adhesive lines for this company"
        : "Company adhesive inventory and line items";

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        listHref={adhesiveRoutes.list}
        viewHref={sheetId ? adhesiveRoutes.view(sheetId) : adhesiveRoutes.list}
        editHref={sheetId ? adhesiveRoutes.edit(sheetId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
        extraActions={
          canStockOut ? (
            <Button
              type="button"
              variant="outline"
              className={stockOutButtonClassName}
              onClick={() => setStockOutOpen(true)}
            >
              <MinusCircle className="size-4" aria-hidden />
              Stock out
            </Button>
          ) : null
        }
      />

      <Card>
        {mode === "view" && sheetId && canViewHistory ? (
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Adhesive sheet</CardTitle>
            {sheet?.lines.length ? (
              <AdhesiveSheetMovementsHeaderButton lines={sheet.lines} />
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && sheetId && canViewHistory ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={
                canSubmit
                  ? form.handleSubmit(onSubmit, () => {
                      toast.error("Fix the highlighted fields before saving.");
                    })
                  : (event) => event.preventDefault()
              }
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <AdhesiveFormFields
                control={form.control}
                readOnly={readOnly}
                canViewPrice={canViewPrice}
                isCreate={mode === "create"}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create adhesive sheet" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>

      {sheet ? (
        <AdhesiveStockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} sheet={sheet} />
      ) : null}
    </div>
  );
}
