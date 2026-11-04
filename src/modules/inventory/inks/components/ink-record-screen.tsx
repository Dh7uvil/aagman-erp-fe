"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { InkFormFields } from "@/modules/inventory/inks/components/ink-form-fields";
import { InkSheetMovementsHeaderButton } from "@/modules/inventory/inks/components/ink-sheet-movements-header-button";
import { InkStockOutDialog } from "@/modules/inventory/inks/components/ink-stock-out-dialog";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { useCreateInkSheet, useUpdateInkSheet } from "@/modules/inventory/inks/mutations";
import { useInk } from "@/modules/inventory/inks/queries";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import {
  InkFormSchema,
  inkFormToCreatePayload,
  inkFormToUpdatePayload,
  inkSheetFormRevision,
  emptyInkLine,
  inkSheetToFormValues,
  type InkFormValues,
} from "@/modules/inventory/inks/schemas";
import { inkPermissions, inkPricePermissions } from "@/modules/inventory/permissions";
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

export type InkRecordMode = "create" | "view" | "edit";

export function InkRecordScreen({ mode, sheetId }: { mode: InkRecordMode; sheetId?: string }) {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(inkPricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(inkPermissions);
  const createSheet = useCreateInkSheet();
  const updateSheet = useUpdateInkSheet();
  const [formError, setFormError] = useState<string | null>(null);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const sheetQuery = useInk(mode === "create" ? null : (sheetId ?? null));
  const sheet = sheetQuery.data;
  const unitsQuery = useAllUnits();
  const defaultUnitId = unitsQuery.data?.find((u) => u.code === "kg")?.id ?? "";

  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;
  const canStockOut = mode !== "create" && canUpdate && Boolean(sheet?.lines.length);
  const canViewHistory = can(inkPermissions.history);

  const formValues = useMemo(() => {
    if (mode === "create") {
      return inkSheetToFormValues(null, defaultUnitId);
    }
    return sheet ? inkSheetToFormValues(sheet, defaultUnitId) : undefined;
  }, [mode, sheet, defaultUnitId]);

  const formValuesReady = mode === "create" ? Boolean(defaultUnitId) : Boolean(sheet && defaultUnitId);

  const serverRevision = mode !== "create" && sheet ? inkSheetFormRevision(sheet) : undefined;

  const form = useForm<InkFormValues>({
    resolver: zodResolver(InkFormSchema),
    defaultValues: {
      company_id: "",
      lines: [emptyInkLine("")],
    },
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${sheetId ?? "new"}`);
  useFormResetWhenServerChanges(form, formValues, formValuesReady, serverRevision);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: InkFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createSheet.mutateAsync(
          inkFormToCreatePayload(values, canViewPrice),
        );
        toast.success("Ink stock saved");
        router.push(inkRoutes.view(created.id));
        return;
      }
      if (!sheetId) {
        return;
      }
      const updated = await updateSheet.mutateAsync({
        id: sheetId,
        values: inkFormToUpdatePayload(values, canViewPrice),
      });
      form.reset(inkSheetToFormValues(updated, defaultUnitId));
      toast.success("Ink sheet updated");
      router.replace(inkRoutes.view(sheetId));
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
    return <p className="text-muted-foreground text-sm">Ink sheet not found.</p>;
  }

  const title =
    mode === "create"
      ? "New ink sheet"
      : mode === "edit"
        ? (sheet?.company_name ?? "Edit ink sheet")
        : (sheet?.company_name ?? "Ink sheet");

  const subtitle =
    mode === "create"
      ? "Create ink lines for a company with optional product and ink images"
      : mode === "edit"
        ? "Update ink lines for this company"
        : "Company ink inventory and line items";

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        listHref={inkRoutes.list}
        viewHref={sheetId ? inkRoutes.view(sheetId) : inkRoutes.list}
        editHref={sheetId ? inkRoutes.edit(sheetId) : undefined}
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
            <CardTitle className="text-base">Ink sheet</CardTitle>
            {sheet?.lines.length ? <InkSheetMovementsHeaderButton lines={sheet.lines} /> : null}
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
              <InkFormFields
                control={form.control}
                readOnly={readOnly}
                canViewPrice={canViewPrice}
                isCreate={mode === "create"}
                sheet={mode === "create" ? null : sheet}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create ink sheet" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>

      {sheet ? (
        <InkStockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} sheet={sheet} />
      ) : null}
    </div>
  );
}
