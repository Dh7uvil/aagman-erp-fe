"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  applyCreatedMicronToMaterialForm,
  applyCreatedProductToMaterialForm,
  applyCreatedSizeLineQuantityUnitToMaterialForm,
  applyCreatedSizeLineUnitToMaterialForm,
  applyCreatedUnitToMaterialForm,
} from "@/modules/inventory/materials/components/apply-quick-create-selection";
import { CategoryQuickCreateDialog } from "@/modules/inventory/materials/components/category-quick-create-dialog";
import { MicronQuickCreateDialog } from "@/modules/inventory/materials/components/micron-quick-create-dialog";
import { useDeleteMaterial } from "@/modules/inventory/materials/mutations";
import {
  emptyMaterialSizeLine,
  type MaterialEditFormValues,
  type MaterialSizeLineValues,
} from "@/modules/inventory/materials/schemas";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
  unitPermissions,
} from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { UnitQuickCreateDialog } from "@/modules/inventory/units/components/unit-quick-create-dialog";
import { useAllUnits } from "@/modules/inventory/units/queries";
import type { Unit } from "@/modules/inventory/units/schemas";
import { Button } from "@/shared/components/ui/button";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { DISPLAY_SCALE } from "@/shared/lib/format";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  FormControl,
  FormField,
  FormGrid,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Switch } from "@/shared/components/ui/switch";
import { setFormValueWhenDefaulting } from "@/shared/lib/form-quick-create";
import { useCan } from "@/shared/providers/session-provider";

function unitIdForCode(units: { id: string; code: string }[], code: string): string {
  return units.find((item) => item.code === code)?.id ?? "";
}

/** Size | unit | rolls | qty | unit | active | delete — balanced fr cols so numerics do not collapse on tablet. */
const SIZE_LINE_GRID =
  "sm:grid sm:grid-cols-[minmax(5.5rem,1.15fr)_minmax(7.5rem,1.35fr)_minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(7.5rem,1.35fr)_4.25rem_2.5rem] sm:items-center";

const SIZE_LINE_CELL = "min-w-0 w-full sm:px-3 sm:py-3 lg:px-4";

function MaterialFormSection({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h3 className="text-sm font-semibold tracking-tight">{title}</h3> : null}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MaterialEditFormFields({
  control,
  readOnly,
}: {
  control: Control<MaterialEditFormValues>;
  readOnly: boolean;
}) {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canCreateCategory = can(categoryPermissions.create);
  const canCreateUnit = can(unitPermissions.create);
  const { canDelete } = useCrudPermissions(materialPermissions);
  const deleteMaterial = useDeleteMaterial();
  const form = useFormContext<MaterialEditFormValues>();
  const productId = useWatch({ control, name: "product_id" });
  const parentId = useWatch({ control, name: "parent_id" });
  const { fields, append, remove } = useFieldArray({ control, name: "size_lines" });
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [micronDialogOpen, setMicronDialogOpen] = useState(false);
  const [sizeUnitDialogOpen, setSizeUnitDialogOpen] = useState(false);
  const [qtyUnitDialogOpen, setQtyUnitDialogOpen] = useState(false);
  const [priceUnitDialogOpen, setPriceUnitDialogOpen] = useState(false);
  const [sizeUnitDialogIndex, setSizeUnitDialogIndex] = useState<number | null>(null);
  const [qtyUnitDialogIndex, setQtyUnitDialogIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    index: number;
    line: MaterialSizeLineValues;
  } | null>(null);

  function handleSizeUnitCreated(unit: Unit) {
    if (sizeUnitDialogIndex === null) {
      return;
    }
    applyCreatedSizeLineUnitToMaterialForm(form, sizeUnitDialogIndex, unit.id);
    setSizeUnitDialogIndex(null);
  }

  function handleQtyUnitCreated(unit: Unit) {
    if (qtyUnitDialogIndex === null) {
      return;
    }
    applyCreatedSizeLineQuantityUnitToMaterialForm(form, qtyUnitDialogIndex, unit.id);
    setQtyUnitDialogIndex(null);
  }

  function handlePriceUnitCreated(unit: Unit) {
    applyCreatedUnitToMaterialForm(form, "price_unit_id", unit.id);
  }

  const productsQuery = useAllCategories();
  const micronsQuery = useAllMicrons(productId || undefined);
  const micronsLoading =
    micronsQuery.isPending || micronsQuery.isFetching || micronsQuery.isRefetching;
  const unitsQuery = useAllUnits();

  const products = productsQuery.data ?? [];
  const microns = micronsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const defaultSizeUnitId = unitIdForCode(units, "mm");
  const defaultQuantityUnitId = unitIdForCode(units, "kg");

  useEffect(() => {
    if (!parentId) {
      return;
    }
    const micron = microns.find((item) => item.id === parentId);
    if (!micron) {
      return;
    }
    if (canViewPrice && micron.price_per_unit) {
      form.setValue("price_per_unit", micron.price_per_unit, { shouldDirty: false });
    }
    if (micron.price_unit_id) {
      form.setValue("price_unit_id", micron.price_unit_id, { shouldDirty: false });
    } else {
      const kgId = unitIdForCode(units, "kg");
      if (kgId) {
        form.setValue("price_unit_id", kgId, { shouldDirty: false });
      }
    }
  }, [parentId, microns, units, canViewPrice, form]);

  useEffect(() => {
    if (!productId || micronsLoading) {
      return;
    }
    const micronId = form.getValues("parent_id");
    if (micronId && !microns.some((m) => m.id === micronId)) {
      form.setValue("parent_id", "", { shouldValidate: false, shouldDirty: true });
    }
  }, [productId, microns, micronsLoading, form]);

  useEffect(() => {
    if (!defaultSizeUnitId && !defaultQuantityUnitId) {
      return;
    }
    const lines = form.getValues("size_lines");
    lines.forEach((line, index) => {
      if (!line.size_unit_id && defaultSizeUnitId) {
        setFormValueWhenDefaulting(form, `size_lines.${index}.size_unit_id`, defaultSizeUnitId);
      }
      if (!line.unit_id && defaultQuantityUnitId) {
        setFormValueWhenDefaulting(form, `size_lines.${index}.unit_id`, defaultQuantityUnitId);
      }
    });
  }, [defaultSizeUnitId, defaultQuantityUnitId, form, fields.length]);

  function addSizeLine() {
    append(emptyMaterialSizeLine(defaultSizeUnitId, defaultQuantityUnitId));
  }

  function renderAddSizeButton() {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addSizeLine}
        className="w-full sm:w-auto"
      >
        <Plus className="size-4" />
        Add size
      </Button>
    );
  }

  function removeSizeRow(index: number) {
    if (fields.length === 1) {
      form.setValue(
        "size_lines",
        [emptyMaterialSizeLine(defaultSizeUnitId, defaultQuantityUnitId)],
        {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    remove(index);
  }

  function requestRemoveSizeLine(index: number) {
    const line = form.getValues(`size_lines.${index}`);
    if (line.id) {
      if (!canDelete) {
        return;
      }
      setPendingDelete({ index, line });
      return;
    }
    removeSizeRow(index);
  }

  async function confirmRemoveSavedSize() {
    if (!pendingDelete?.line.id) {
      return;
    }
    try {
      await deleteMaterial.mutateAsync(pendingDelete.line.id);
      removeSizeRow(pendingDelete.index);
      toast.success("Size deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function canRemoveSizeLine(line: MaterialSizeLineValues) {
    if (readOnly) {
      return false;
    }
    return line.id ? canDelete : true;
  }

  return (
    <div className="flex flex-col gap-5">
      <MaterialFormSection>
        <FormGrid columns={2}>
          <FormField
            control={control}
            name="product_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <MasterSelect
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("parent_id", "", { shouldValidate: false, shouldDirty: true });
                      form.clearErrors("parent_id");
                    }}
                    disabled={readOnly}
                    placeholder="Select product"
                    options={products.map((item) => ({ value: item.id, label: item.name }))}
                    createLabel={!readOnly && canCreateCategory ? "New product" : undefined}
                    onCreate={
                      !readOnly && canCreateCategory ? () => setProductDialogOpen(true) : undefined
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </MaterialFormSection>

      <MaterialFormSection>
        <FormGrid columns={canViewPrice ? 3 : 2}>
          <FormField
            control={control}
            name="parent_id"
            render={({ field }) => (
              <FormItem className={canViewPrice ? undefined : "sm:col-span-2 lg:col-span-1"}>
                <FormLabel>Micron</FormLabel>
                <FormControl>
                  <MasterSelect
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value) {
                        form.clearErrors("parent_id");
                      }
                    }}
                    disabled={readOnly || !productId}
                    placeholder={productId ? "Select micron" : "Select product first"}
                    options={microns.map((item) => ({ value: item.id, label: item.name }))}
                    loading={micronsLoading}
                    createLabel={
                      !readOnly && canCreateCategory && productId ? "New micron" : undefined
                    }
                    onCreate={
                      !readOnly && canCreateCategory && productId
                        ? () => setMicronDialogOpen(true)
                        : undefined
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {canViewPrice ? (
            <>
              <FormField
                control={control}
                name="price_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <DecimalInput kind="money" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="price_unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price unit</FormLabel>
                    <FormControl>
                      <MasterSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={readOnly}
                        placeholder="Per"
                        options={units.map((item) => ({
                          value: item.id,
                          label: item.code,
                        }))}
                        createLabel={!readOnly && canCreateUnit ? "New unit" : undefined}
                        onCreate={
                          !readOnly && canCreateUnit ? () => setPriceUnitDialogOpen(true) : undefined
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}
        </FormGrid>
      </MaterialFormSection>

      <MaterialFormSection title="Sizes">
        <div className="flex flex-col gap-3">
          <div
            className={`hidden overflow-hidden rounded-md border bg-muted/50 shadow-sm sm:grid ${SIZE_LINE_GRID}`}
          >
            <div className="px-3 py-2.5 text-xs font-medium text-muted-foreground lg:px-4">Size</div>
            <div className="px-3 py-2.5 text-xs font-medium text-muted-foreground lg:px-4">
              Size unit
            </div>
            <div className="px-3 py-2.5 text-xs font-medium text-muted-foreground lg:px-4">
              No. of rolls
            </div>
            <div className="px-3 py-2.5 text-xs font-medium text-muted-foreground lg:px-4">
              Qty available
            </div>
            <div className="px-3 py-2.5 text-xs font-medium text-muted-foreground lg:px-4">
              Qty unit
            </div>
            <div className="px-1 py-2.5 text-center text-xs font-medium text-muted-foreground">
              Active
            </div>
            <div className="px-1 py-2.5" aria-hidden />
          </div>
          {fields.map((fieldItem, index) => {
            const line = form.watch(`size_lines.${index}`);
            const showRemove = canRemoveSizeLine(line);
            return (
              <div
                key={fieldItem.id}
                className={`grid grid-cols-1 gap-4 overflow-hidden rounded-md border bg-card p-4 shadow-sm ${SIZE_LINE_GRID} sm:gap-0 sm:p-0`}
              >
                <FormField
                  control={control}
                  name={`size_lines.${index}.size`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">Size</FormLabel>
                      <FormControl>
                        <DecimalInput
                          kind="quantity"
                          numericOnly
                          precision={DISPLAY_SCALE}
                          {...field}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`size_lines.${index}.size_unit_id`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">Size unit</FormLabel>
                      <FormControl>
                        <MasterSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={readOnly}
                          placeholder="Unit"
                          options={units.map((item) => ({
                            value: item.id,
                            label: item.code,
                          }))}
                          createLabel={!readOnly && canCreateUnit ? "New unit" : undefined}
                          onCreate={
                            !readOnly && canCreateUnit
                              ? () => {
                                  setSizeUnitDialogIndex(index);
                                  setSizeUnitDialogOpen(true);
                                }
                              : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`size_lines.${index}.opening_rolls`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">No. of rolls</FormLabel>
                      <FormControl>
                        <DecimalInput
                          kind="quantity"
                          precision={DISPLAY_SCALE}
                          {...field}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`size_lines.${index}.quantity_available`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">Qty available</FormLabel>
                      <FormControl>
                        <DecimalInput
                          kind="quantity"
                          precision={DISPLAY_SCALE}
                          {...field}
                          disabled={readOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`size_lines.${index}.unit_id`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">Qty unit</FormLabel>
                      <FormControl>
                        <MasterSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={readOnly}
                          placeholder="kg"
                          options={units.map((item) => ({
                            value: item.id,
                            label: item.code,
                          }))}
                          createLabel={!readOnly && canCreateUnit ? "New unit" : undefined}
                          onCreate={
                            !readOnly && canCreateUnit
                              ? () => {
                                  setQtyUnitDialogIndex(index);
                                  setQtyUnitDialogOpen(true);
                                }
                              : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between gap-2 sm:contents">
                  <FormField
                    control={control}
                    name={`size_lines.${index}.is_active`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:justify-center sm:px-2 sm:py-3">
                        <FormLabel className="text-sm font-normal sm:sr-only">Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={readOnly}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex shrink-0 items-center sm:justify-center sm:px-1 sm:py-3">
                    {showRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => requestRemoveSizeLine(index)}
                        aria-label="Remove size"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          {!readOnly ? (
            <div className="flex w-full sm:justify-end">{renderAddSizeButton()}</div>
          ) : null}
        </div>
      </MaterialFormSection>

      <CategoryQuickCreateDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        onCreated={(category) => applyCreatedProductToMaterialForm(form, category.id)}
      />
      <MicronQuickCreateDialog
        open={micronDialogOpen}
        onOpenChange={setMicronDialogOpen}
        defaultProductId={productId || undefined}
        onCreated={(micron) => applyCreatedMicronToMaterialForm(form, micron, canViewPrice)}
      />
      <UnitQuickCreateDialog
        open={sizeUnitDialogOpen}
        onOpenChange={(open) => {
          setSizeUnitDialogOpen(open);
          if (!open) {
            setSizeUnitDialogIndex(null);
          }
        }}
        onCreated={handleSizeUnitCreated}
      />
      <UnitQuickCreateDialog
        open={qtyUnitDialogOpen}
        onOpenChange={(open) => {
          setQtyUnitDialogOpen(open);
          if (!open) {
            setQtyUnitDialogIndex(null);
          }
        }}
        onCreated={handleQtyUnitCreated}
      />
      <UnitQuickCreateDialog
        open={priceUnitDialogOpen}
        onOpenChange={setPriceUnitDialogOpen}
        onCreated={handlePriceUnitCreated}
      />
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        title="Delete size"
        description={
          pendingDelete
            ? `Delete size ${pendingDelete.line.size || "variant"}? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        pending={deleteMaterial.isPending}
        onConfirm={confirmRemoveSavedSize}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      />
    </div>
  );
}
