"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { SolventNameQuickCreateDialog } from "@/modules/inventory/solvent-names/components/solvent-name-quick-create-dialog";
import { useAllSolventNames } from "@/modules/inventory/solvent-names/queries";
import { SolventBrandQuickCreateDialog } from "@/modules/inventory/solvents/components/solvent-brand-quick-create-dialog";
import {
  computeSolventLineTotals,
  emptySolventLine,
  type SolventFormValues,
} from "@/modules/inventory/solvents/schemas";
import { useAllSolventBrands } from "@/modules/inventory/solvents/queries";
import { solventNamePermissions, solventPermissions, unitPermissions } from "@/modules/inventory/permissions";
import { UnitQuickCreateDialog } from "@/modules/inventory/units/components/unit-quick-create-dialog";
import { useAllUnits } from "@/modules/inventory/units/queries";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AddLineItemButton } from "@/shared/components/form/add-line-item-button";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { formatDecimal } from "@/shared/lib/format";
import { setFormValueFromQuickCreate } from "@/shared/lib/form-quick-create";

const SOLVENT_LINE_HEADER =
  "flex min-h-10 items-center px-2 py-2 text-xs font-medium text-muted-foreground";
const ADHESIVE_LINE_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[5rem] [&_[data-slot=form-control]]:items-center";
const ADHESIVE_LINE_NUMERIC_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[7rem] [&_[data-slot=form-control]]:items-center [&_input]:w-full";
const ADHESIVE_LINE_UNIT_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[5.5rem] [&_[data-slot=form-control]]:items-center";
const ADHESIVE_LINE_COL_DIVIDER = "lg:self-stretch lg:border-r-2 lg:border-border";
const ADHESIVE_LINE_READOUT = "flex min-h-10 w-full items-center text-sm font-medium tabular-nums";
const ADHESIVE_LINE_DELETE_COL =
  "sticky right-0 z-30 flex shrink-0 self-stretch items-center justify-center border-l border-border bg-card lg:w-11 lg:px-1 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.12)]";
const ADHESIVE_LINE_DELETE_HEADER =
  "sticky right-0 z-30 flex min-h-10 shrink-0 items-center border-l border-border bg-muted lg:w-11 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.08)]";

/** Full static class strings so Tailwind emits every grid template (dynamic concat breaks lg layout). */
const ADHESIVE_LINE_GRID_WITH_PRICE_AND_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(7rem,1.05fr)_2.75rem] lg:items-center";
const ADHESIVE_LINE_GRID_WITH_PRICE_NO_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(7rem,1.05fr)] lg:items-center";
const ADHESIVE_LINE_GRID_NO_PRICE_WITH_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_2.75rem] lg:items-center";
const ADHESIVE_LINE_GRID_NO_PRICE_NO_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)] lg:items-center";

function solventLineGridClass(canViewPrice: boolean, includeDeleteColumn: boolean) {
  if (canViewPrice) {
    return includeDeleteColumn
      ? ADHESIVE_LINE_GRID_WITH_PRICE_AND_DELETE
      : ADHESIVE_LINE_GRID_WITH_PRICE_NO_DELETE;
  }
  return includeDeleteColumn
    ? ADHESIVE_LINE_GRID_NO_PRICE_WITH_DELETE
    : ADHESIVE_LINE_GRID_NO_PRICE_NO_DELETE;
}

function solventLineTableMinWidth(canViewPrice: boolean, includeDeleteColumn: boolean) {
  if (canViewPrice) {
    return includeDeleteColumn ? "lg:min-w-[78rem]" : "lg:min-w-[75.25rem]";
  }
  return includeDeleteColumn ? "lg:min-w-[54rem]" : "lg:min-w-[51.25rem]";
}

export function SolventLineFields({
  control,
  readOnly,
  canViewPrice,
  embedded = false,
}: {
  control: Control<SolventFormValues>;
  readOnly: boolean;
  canViewPrice: boolean;
  embedded?: boolean;
}) {
  const form = useFormContext<SolventFormValues>();
  const { canCreate: canCreateSolvent } = useCrudPermissions(solventPermissions);
  const { canCreate: canCreateCode } = useCrudPermissions(solventNamePermissions);
  const { canCreate: canCreateUnit } = useCrudPermissions(unitPermissions);
  const brandsQuery = useAllSolventBrands();
  const codesQuery = useAllSolventNames();
  const unitsQuery = useAllUnits();
  const brands = brandsQuery.data ?? [];
  const codes = codesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const defaultUnitId = units.find((u) => u.code === "kg")?.id ?? "";

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
    keyName: "fieldKey",
  });
  const lines = useWatch({ control, name: "lines" });
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brandDialogIndex, setBrandDialogIndex] = useState<number | null>(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeDialogIndex, setCodeDialogIndex] = useState<number | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitDialogIndex, setUnitDialogIndex] = useState<number | null>(null);

  const showDeleteColumn = !readOnly;
  const gridClass = solventLineGridClass(canViewPrice, showDeleteColumn);
  const tableMinWidth = solventLineTableMinWidth(canViewPrice, showDeleteColumn);

  const addLineAction = !readOnly ? (
    <AddLineItemButton onClick={() => append(emptySolventLine(defaultUnitId))}>Add line</AddLineItemButton>
  ) : null;

  const linesContent = (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
        <div className={`flex flex-col gap-3 ${tableMinWidth}`}>
        <div className={`hidden rounded-md border bg-muted shadow-sm ${gridClass}`}>
          <div className={SOLVENT_LINE_HEADER}>Brand</div>
          <div className={`${SOLVENT_LINE_HEADER} ${ADHESIVE_LINE_COL_DIVIDER}`}>Code</div>
          <div className={SOLVENT_LINE_HEADER}>No. of drums</div>
          <div className={SOLVENT_LINE_HEADER}>Drum qty</div>
          <div className={SOLVENT_LINE_HEADER}>Unit</div>
          <div className={`${SOLVENT_LINE_HEADER} ${ADHESIVE_LINE_COL_DIVIDER}`}>Total kg</div>
          {canViewPrice ? (
            <>
              <div className={SOLVENT_LINE_HEADER}>Solvent rate</div>
              <div className={SOLVENT_LINE_HEADER}>Avg rate</div>
              <div className={`${SOLVENT_LINE_HEADER} ${ADHESIVE_LINE_COL_DIVIDER}`}>Total rate</div>
            </>
          ) : null}
          {showDeleteColumn ? (
            <div className={`${SOLVENT_LINE_HEADER} ${ADHESIVE_LINE_DELETE_HEADER}`} aria-hidden />
          ) : null}
        </div>

        {fields.map((field, index) => {
          const line = lines?.[index];
          const totals = computeSolventLineTotals(
            line?.drum_count ?? "0",
            line?.drum_qty ?? "0",
            line?.solvent_rate ?? "",
          );
          const unitCode = units.find((u) => u.id === line?.drum_unit_id)?.code ?? "kg";
          const avgRateLabel =
            canViewPrice && line?.avg_price_per_unit?.trim()
              ? formatPricePerUnit(
                  line.avg_price_per_unit,
                  line.price_unit_code?.trim() || unitCode,
                )
              : canViewPrice
                ? "—"
                : null;
          const showRemove = !readOnly && fields.length > 1;

          return (
            <div
              key={field.fieldKey}
              className={`grid grid-cols-1 gap-4 rounded-md border bg-card p-4 shadow-sm ${gridClass} lg:gap-0 lg:p-0`}
            >
              <FormField
                control={control}
                name={`lines.${index}.brand_id`}
                render={({ field: brandField }) => (
                  <FormItem className={ADHESIVE_LINE_CELL}>
                    <FormLabel className="lg:sr-only">Brand</FormLabel>
                    <FormControl>
                      <MasterSelect
                        compact
                        className="min-w-[8.5rem]"
                        options={brands.map((b) => ({ value: b.id, label: b.name }))}
                        value={brandField.value}
                        onValueChange={brandField.onChange}
                        disabled={readOnly}
                        placeholder="Brand"
                        createLabel={canCreateSolvent ? "New brand" : undefined}
                        onCreate={
                          canCreateSolvent
                            ? () => {
                                setBrandDialogIndex(index);
                                setBrandDialogOpen(true);
                              }
                            : undefined
                        }
                        loading={brandsQuery.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`lines.${index}.solvent_name_id`}
                render={({ field: colorField }) => (
                  <FormItem className={`${ADHESIVE_LINE_CELL} ${ADHESIVE_LINE_COL_DIVIDER}`}>
                    <FormLabel className="lg:sr-only">Code</FormLabel>
                    <FormControl>
                      <MasterSelect
                        compact
                        className="min-w-[8.5rem]"
                        options={codes.map((c) => ({ value: c.id, label: c.name }))}
                        value={colorField.value}
                        onValueChange={colorField.onChange}
                        disabled={readOnly}
                        placeholder="Name"
                        createLabel={canCreateCode ? "New solvent" : undefined}
                        onCreate={
                          canCreateCode
                            ? () => {
                                setCodeDialogIndex(index);
                                setCodeDialogOpen(true);
                              }
                            : undefined
                        }
                        loading={codesQuery.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`lines.${index}.drum_count`}
                render={({ field: drumField }) => (
                  <FormItem className={ADHESIVE_LINE_NUMERIC_CELL}>
                    <FormLabel className="lg:sr-only">No. of drums</FormLabel>
                    <FormControl>
                      <DecimalInput kind="quantity" {...drumField} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`lines.${index}.drum_qty`}
                render={({ field: qtyField }) => (
                  <FormItem className={ADHESIVE_LINE_NUMERIC_CELL}>
                    <FormLabel className="lg:sr-only">Drum qty</FormLabel>
                    <FormControl>
                      <DecimalInput kind="quantity" {...qtyField} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`lines.${index}.drum_unit_id`}
                render={({ field: unitField }) => (
                  <FormItem className={ADHESIVE_LINE_UNIT_CELL}>
                    <FormLabel className="lg:sr-only">Unit</FormLabel>
                    <FormControl>
                      <MasterSelect
                        compact
                        className="min-w-[5.5rem] max-w-full"
                        options={units.map((u) => ({ value: u.id, label: u.code }))}
                        value={unitField.value}
                        onValueChange={unitField.onChange}
                        disabled={readOnly}
                        placeholder="kg"
                        createLabel={canCreateUnit ? "New unit" : undefined}
                        onCreate={
                          canCreateUnit
                            ? () => {
                                setUnitDialogIndex(index);
                                setUnitDialogOpen(true);
                              }
                            : undefined
                        }
                        loading={unitsQuery.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className={`${ADHESIVE_LINE_CELL} ${ADHESIVE_LINE_COL_DIVIDER}`}>
                <FormLabel className="lg:sr-only">Total kg</FormLabel>
                <p className={ADHESIVE_LINE_READOUT}>
                  {formatDecimal(String(totals.totalQty))} {unitCode}
                </p>
              </FormItem>
              {canViewPrice ? (
                <>
                  <FormField
                    control={control}
                    name={`lines.${index}.solvent_rate`}
                    render={({ field: rateField }) => (
                      <FormItem className={ADHESIVE_LINE_NUMERIC_CELL}>
                        <FormLabel className="lg:sr-only">Solvent rate</FormLabel>
                        <FormControl>
                          <DecimalInput
                            kind="money"
                            {...rateField}
                            disabled={readOnly}
                            placeholder="Rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem className={ADHESIVE_LINE_CELL}>
                    <FormLabel className="lg:sr-only">Avg rate</FormLabel>
                    <p className={`${ADHESIVE_LINE_READOUT} text-muted-foreground`}>{avgRateLabel}</p>
                  </FormItem>
                  <FormItem className={`${ADHESIVE_LINE_CELL} ${ADHESIVE_LINE_COL_DIVIDER}`}>
                    <FormLabel className="lg:sr-only">Total rate</FormLabel>
                    <p className={ADHESIVE_LINE_READOUT}>
                      {totals.totalRate != null ? formatDecimal(String(totals.totalRate)) : "—"}
                    </p>
                  </FormItem>
                </>
              ) : null}
              {showDeleteColumn ? (
                <div className={ADHESIVE_LINE_DELETE_COL}>
                  {showRemove ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                      aria-label="Remove line"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        </div>
      </div>
      {addLineAction}
    </div>
  );

  const brandDialog = (
    <SolventBrandQuickCreateDialog
      open={brandDialogOpen}
      onOpenChange={setBrandDialogOpen}
      onCreated={(brand) => {
        if (brandDialogIndex != null) {
          setFormValueFromQuickCreate(form, `lines.${brandDialogIndex}.brand_id`, brand.id);
        }
        setBrandDialogIndex(null);
      }}
    />
  );

  const codeDialog = (
    <SolventNameQuickCreateDialog
      open={codeDialogOpen}
      onOpenChange={setCodeDialogOpen}
      onCreated={(color) => {
        if (codeDialogIndex != null) {
          setFormValueFromQuickCreate(form, `lines.${codeDialogIndex}.solvent_name_id`, color.id);
        }
        setCodeDialogIndex(null);
      }}
    />
  );

  const unitDialog = (
    <UnitQuickCreateDialog
      open={unitDialogOpen}
      onOpenChange={setUnitDialogOpen}
      onCreated={(unit) => {
        if (unitDialogIndex != null) {
          setFormValueFromQuickCreate(form, `lines.${unitDialogIndex}.drum_unit_id`, unit.id);
        }
        setUnitDialogIndex(null);
      }}
    />
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-3">
        {linesContent}
        {brandDialog}
        {codeDialog}
        {unitDialog}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-tight">Solvent lines</h3>
      {linesContent}
      {brandDialog}
      {codeDialog}
      {unitDialog}
    </section>
  );
}
