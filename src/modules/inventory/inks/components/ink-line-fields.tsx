"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { InkColorQuickCreateDialog } from "@/modules/inventory/ink-colors/components/ink-color-quick-create-dialog";
import { InkHexSwatch } from "@/modules/inventory/ink-colors/components/ink-hex-swatch";
import { useAllInkColors } from "@/modules/inventory/ink-colors/queries";
import { BrandQuickCreateDialog } from "@/modules/inventory/inks/components/brand-quick-create-dialog";
import {
  computeInkLineTotals,
  emptyInkLine,
  type InkFormValues,
} from "@/modules/inventory/inks/schemas";
import { useAllInkBrands } from "@/modules/inventory/inks/queries";
import { inkColorPermissions, inkPermissions, unitPermissions } from "@/modules/inventory/permissions";
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

const INK_LINE_HEADER =
  "flex min-h-10 items-center px-2 py-2 text-xs font-medium text-muted-foreground";
const INK_LINE_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[5rem] [&_[data-slot=form-control]]:items-center";
const INK_LINE_NUMERIC_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[7rem] [&_[data-slot=form-control]]:items-center [&_input]:w-full";
const INK_LINE_UNIT_CELL =
  "min-h-10 gap-0 content-center lg:px-2 lg:py-2 [&_[data-slot=form-control]]:min-w-[5.5rem] [&_[data-slot=form-control]]:items-center";
const INK_LINE_COL_DIVIDER = "lg:self-stretch lg:border-r-2 lg:border-border";
const INK_LINE_HEX_CELL =
  "min-h-10 min-w-0 gap-0 content-center overflow-visible whitespace-nowrap lg:min-w-[7.5rem] lg:px-2 lg:py-2";
const INK_LINE_READOUT = "flex min-h-10 w-full items-center text-sm font-medium tabular-nums";
const INK_LINE_DELETE_COL =
  "sticky right-0 z-30 flex shrink-0 self-stretch items-center justify-center border-l border-border bg-card lg:w-11 lg:px-1 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.12)]";
const INK_LINE_DELETE_HEADER =
  "sticky right-0 z-30 flex min-h-10 shrink-0 items-center border-l border-border bg-muted lg:w-11 shadow-[-6px_0_10px_-2px_rgba(0,0,0,0.08)]";

const INK_LINE_GRID_WITH_PRICE_AND_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7.5rem,9rem)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(7rem,1.05fr)_2.75rem] lg:items-center";
const INK_LINE_GRID_WITH_PRICE_NO_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7.5rem,9rem)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(7rem,1.05fr)] lg:items-center";
const INK_LINE_GRID_NO_PRICE_WITH_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7.5rem,9rem)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)_2.75rem] lg:items-center";
const INK_LINE_GRID_NO_PRICE_NO_DELETE =
  "lg:grid lg:grid-cols-[minmax(9rem,1.35fr)_minmax(9rem,1.35fr)_minmax(7.5rem,9rem)_minmax(7rem,7.5rem)_minmax(7rem,7.5rem)_minmax(6.5rem,1fr)_minmax(7rem,1.05fr)] lg:items-center";

function inkLineGridClass(canViewPrice: boolean, includeDeleteColumn: boolean) {
  if (canViewPrice) {
    return includeDeleteColumn
      ? INK_LINE_GRID_WITH_PRICE_AND_DELETE
      : INK_LINE_GRID_WITH_PRICE_NO_DELETE;
  }
  return includeDeleteColumn
    ? INK_LINE_GRID_NO_PRICE_WITH_DELETE
    : INK_LINE_GRID_NO_PRICE_NO_DELETE;
}

function inkLineTableMinWidth(canViewPrice: boolean, includeDeleteColumn: boolean) {
  if (canViewPrice) {
    return includeDeleteColumn ? "lg:min-w-[86rem]" : "lg:min-w-[83.25rem]";
  }
  return includeDeleteColumn ? "lg:min-w-[62rem]" : "lg:min-w-[59.25rem]";
}

export function InkLineFields({
  control,
  readOnly,
  canViewPrice,
  embedded = false,
}: {
  control: Control<InkFormValues>;
  readOnly: boolean;
  canViewPrice: boolean;
  embedded?: boolean;
}) {
  const form = useFormContext<InkFormValues>();
  const { canCreate: canCreateInk } = useCrudPermissions(inkPermissions);
  const { canCreate: canCreateColor } = useCrudPermissions(inkColorPermissions);
  const { canCreate: canCreateUnit } = useCrudPermissions(unitPermissions);
  const brandsQuery = useAllInkBrands();
  const colorsQuery = useAllInkColors();
  const unitsQuery = useAllUnits();
  const brands = brandsQuery.data ?? [];
  const colors = colorsQuery.data ?? [];
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
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [colorDialogIndex, setColorDialogIndex] = useState<number | null>(null);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitDialogIndex, setUnitDialogIndex] = useState<number | null>(null);

  const colorById = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const showDeleteColumn = !readOnly;
  const gridClass = inkLineGridClass(canViewPrice, showDeleteColumn);
  const tableMinWidth = inkLineTableMinWidth(canViewPrice, showDeleteColumn);

  function syncHexForLine(index: number, colorId: string) {
    const hex = colorById.get(colorId)?.hex_code ?? "";
    form.setValue(`lines.${index}.hex_code`, hex, { shouldDirty: true, shouldValidate: false });
  }

  const addLineAction = !readOnly ? (
    <AddLineItemButton onClick={() => append(emptyInkLine(defaultUnitId))}>Add line</AddLineItemButton>
  ) : null;

  const linesContent = (
    <div className="flex flex-col gap-3">
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1">
        <div className={`flex flex-col gap-3 ${tableMinWidth}`}>
        <div className={`hidden rounded-md border bg-muted shadow-sm ${gridClass}`}>
          <div className={INK_LINE_HEADER}>Brand</div>
          <div className={INK_LINE_HEADER}>Color</div>
          <div className={`${INK_LINE_HEADER} justify-center ${INK_LINE_COL_DIVIDER}`}>Hex</div>
          <div className={INK_LINE_HEADER}>No. of drums</div>
          <div className={INK_LINE_HEADER}>Drum qty</div>
          <div className={INK_LINE_HEADER}>Unit</div>
          <div className={`${INK_LINE_HEADER} ${INK_LINE_COL_DIVIDER}`}>Total kg</div>
          {canViewPrice ? (
            <>
              <div className={INK_LINE_HEADER}>Ink rate</div>
              <div className={INK_LINE_HEADER}>Avg rate</div>
              <div className={`${INK_LINE_HEADER} ${INK_LINE_COL_DIVIDER}`}>Total rate</div>
            </>
          ) : null}
          {showDeleteColumn ? (
            <div className={`${INK_LINE_HEADER} ${INK_LINE_DELETE_HEADER}`} aria-hidden />
          ) : null}
        </div>

        {fields.map((field, index) => {
          const line = lines?.[index];
          const totals = computeInkLineTotals(
            line?.drum_count ?? "0",
            line?.drum_qty ?? "0",
            line?.ink_rate ?? "",
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
                  <FormItem className={INK_LINE_CELL}>
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
                        createLabel={canCreateInk ? "New brand" : undefined}
                        onCreate={
                          canCreateInk
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
                name={`lines.${index}.color_id`}
                render={({ field: colorField }) => (
                  <FormItem className={INK_LINE_CELL}>
                    <FormLabel className="lg:sr-only">Color</FormLabel>
                    <FormControl>
                      <MasterSelect
                        compact
                        className="min-w-[8.5rem]"
                        options={colors.map((c) => ({ value: c.id, label: c.name }))}
                        value={colorField.value}
                        onValueChange={(value) => {
                          colorField.onChange(value);
                          syncHexForLine(index, value);
                        }}
                        disabled={readOnly}
                        placeholder="Color"
                        createLabel={canCreateColor ? "New color" : undefined}
                        onCreate={
                          canCreateColor
                            ? () => {
                                setColorDialogIndex(index);
                                setColorDialogOpen(true);
                              }
                            : undefined
                        }
                        loading={colorsQuery.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className={`${INK_LINE_HEX_CELL} ${INK_LINE_COL_DIVIDER}`}>
                <FormLabel className="lg:sr-only">Hex</FormLabel>
                <InkHexSwatch hex={line?.hex_code || null} className="text-xs" />
              </FormItem>
              <FormField
                control={control}
                name={`lines.${index}.drum_count`}
                render={({ field: drumField }) => (
                  <FormItem className={INK_LINE_NUMERIC_CELL}>
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
                  <FormItem className={INK_LINE_NUMERIC_CELL}>
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
                  <FormItem className={INK_LINE_UNIT_CELL}>
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
              <FormItem className={`${INK_LINE_CELL} ${INK_LINE_COL_DIVIDER}`}>
                <FormLabel className="lg:sr-only">Total kg</FormLabel>
                <p className={INK_LINE_READOUT}>
                  {formatDecimal(String(totals.totalQty))} {unitCode}
                </p>
              </FormItem>
              {canViewPrice ? (
                <>
                  <FormField
                    control={control}
                    name={`lines.${index}.ink_rate`}
                    render={({ field: rateField }) => (
                      <FormItem className={INK_LINE_NUMERIC_CELL}>
                        <FormLabel className="lg:sr-only">Ink rate</FormLabel>
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
                  <FormItem className={INK_LINE_CELL}>
                    <FormLabel className="lg:sr-only">Avg rate</FormLabel>
                    <p className={`${INK_LINE_READOUT} text-muted-foreground`}>{avgRateLabel}</p>
                  </FormItem>
                  <FormItem className={`${INK_LINE_CELL} ${INK_LINE_COL_DIVIDER}`}>
                    <FormLabel className="lg:sr-only">Total rate</FormLabel>
                    <p className={INK_LINE_READOUT}>
                      {totals.totalRate != null ? formatDecimal(String(totals.totalRate)) : "—"}
                    </p>
                  </FormItem>
                </>
              ) : null}
              {showDeleteColumn ? (
                <div className={INK_LINE_DELETE_COL}>
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
    <BrandQuickCreateDialog
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

  const colorDialog = (
    <InkColorQuickCreateDialog
      open={colorDialogOpen}
      onOpenChange={setColorDialogOpen}
      onCreated={(color) => {
        if (colorDialogIndex != null) {
          setFormValueFromQuickCreate(form, `lines.${colorDialogIndex}.color_id`, color.id);
          syncHexForLine(colorDialogIndex, color.id);
        }
        setColorDialogIndex(null);
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
        {colorDialog}
        {unitDialog}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold tracking-tight">Ink lines</h3>
      {linesContent}
      {brandDialog}
      {colorDialog}
      {unitDialog}
    </section>
  );
}
