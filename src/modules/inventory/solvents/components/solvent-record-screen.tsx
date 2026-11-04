"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SolventFormFields } from "@/modules/inventory/solvents/components/solvent-form-fields";
import { SolventSheetMovementsHeaderButton } from "@/modules/inventory/solvents/components/solvent-sheet-movements-header-button";
import { SolventStockOutDialog } from "@/modules/inventory/solvents/components/solvent-stock-out-dialog";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { useCreateSolventSheet, useUpdateSolventSheet } from "@/modules/inventory/solvents/mutations";
import { useSolvent } from "@/modules/inventory/solvents/queries";
import { solventRoutes } from "@/modules/inventory/solvents/routes";
import {
  SolventFormSchema,
  solventFormToCreatePayload,
  solventFormToUpdatePayload,
  solventSheetFormRevision,
  emptySolventLine,
  solventSheetToFormValues,
  type SolventFormValues,
} from "@/modules/inventory/solvents/schemas";
import { solventPermissions, solventPricePermissions } from "@/modules/inventory/permissions";
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

export type SolventRecordMode = "create" | "view" | "edit";

export function SolventRecordScreen({ mode, sheetId }: { mode: SolventRecordMode; sheetId?: string }) {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(solventPricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(solventPermissions);
  const createSheet = useCreateSolventSheet();
  const updateSheet = useUpdateSolventSheet();
  const [formError, setFormError] = useState<string | null>(null);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const sheetQuery = useSolvent(mode === "create" ? null : (sheetId ?? null));
  const sheet = sheetQuery.data;
  const unitsQuery = useAllUnits();
  const defaultUnitId = unitsQuery.data?.find((u) => u.code === "kg")?.id ?? "";

  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;
  const canStockOut = mode !== "create" && canUpdate && Boolean(sheet?.lines.length);
  const canViewHistory = can(solventPermissions.history);

  const formValues = useMemo(() => {
    if (mode === "create") {
      return solventSheetToFormValues(null, defaultUnitId);
    }
    return sheet ? solventSheetToFormValues(sheet, defaultUnitId) : undefined;
  }, [mode, sheet, defaultUnitId]);

  const formValuesReady = mode === "create" ? Boolean(defaultUnitId) : Boolean(sheet && defaultUnitId);

  const serverRevision =
    mode !== "create" && sheet ? solventSheetFormRevision(sheet) : undefined;

  const form = useForm<SolventFormValues>({
    resolver: zodResolver(SolventFormSchema),
    defaultValues: {
      company_id: "",
      lines: [emptySolventLine("")],
    },
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${sheetId ?? "new"}`);
  useFormResetWhenServerChanges(form, formValues, formValuesReady, serverRevision);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: SolventFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const created = await createSheet.mutateAsync(
          solventFormToCreatePayload(values, canViewPrice),
        );
        toast.success("Solvent stock saved");
        router.push(solventRoutes.view(created.id));
        return;
      }
      if (!sheetId) {
        return;
      }
      const updated = await updateSheet.mutateAsync({
        id: sheetId,
        values: solventFormToUpdatePayload(values, canViewPrice),
      });
      form.reset(solventSheetToFormValues(updated, defaultUnitId));
      toast.success("Solvent sheet updated");
      router.replace(solventRoutes.view(sheetId));
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
    return <p className="text-muted-foreground text-sm">Solvent sheet not found.</p>;
  }

  const title =
    mode === "create"
      ? "New solvent sheet"
      : mode === "edit"
        ? (sheet?.company_name ?? "Edit solvent sheet")
        : (sheet?.company_name ?? "Solvent sheet");

  const subtitle =
    mode === "create"
      ? "Create solvent lines for a company with optional product and solvent images"
      : mode === "edit"
        ? "Update solvent lines for this company"
        : "Company solvent inventory and line items";

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        listHref={solventRoutes.list}
        viewHref={sheetId ? solventRoutes.view(sheetId) : solventRoutes.list}
        editHref={sheetId ? solventRoutes.edit(sheetId) : undefined}
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
            <CardTitle className="text-base">Solvent sheet</CardTitle>
            {sheet?.lines.length ? (
              <SolventSheetMovementsHeaderButton lines={sheet.lines} />
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
              <SolventFormFields
                control={form.control}
                readOnly={readOnly}
                canViewPrice={canViewPrice}
                isCreate={mode === "create"}
              />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create solvent sheet" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>

      {sheet ? (
        <SolventStockOutDialog open={stockOutOpen} onOpenChange={setStockOutOpen} sheet={sheet} />
      ) : null}
    </div>
  );
}
