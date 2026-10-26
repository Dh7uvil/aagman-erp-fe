"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import { useFormContext, useWatch } from "react-hook-form";

import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  applyCreatedMicronToMaterialForm,
  applyCreatedProductToMaterialForm,
  applyCreatedUnitToMaterialForm,
} from "@/modules/inventory/materials/components/apply-quick-create-selection";
import { CategoryQuickCreateDialog } from "@/modules/inventory/materials/components/category-quick-create-dialog";
import { MicronQuickCreateDialog } from "@/modules/inventory/materials/components/micron-quick-create-dialog";
import type { MaterialFormValues } from "@/modules/inventory/materials/schemas";
import {
  categoryPermissions,
  inventoryPricePermissions,
  unitPermissions,
} from "@/modules/inventory/permissions";
import { UnitQuickCreateDialog } from "@/modules/inventory/units/components/unit-quick-create-dialog";
import { useAllUnits } from "@/modules/inventory/units/queries";
import type { Unit } from "@/modules/inventory/units/schemas";
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

export function MaterialFormFields({
  control,
  readOnly,
  isCreate,
}: {
  control: Control<MaterialFormValues>;
  readOnly: boolean;
  isCreate: boolean;
}) {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canCreateCategory = can(categoryPermissions.create);
  const canCreateUnit = can(unitPermissions.create);
  const form = useFormContext<MaterialFormValues>();
  const productId = useWatch({ control, name: "product_id" });
  const parentId = useWatch({ control, name: "parent_id" });
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [micronDialogOpen, setMicronDialogOpen] = useState(false);
  const [sizeUnitDialogOpen, setSizeUnitDialogOpen] = useState(false);
  const [qtyUnitDialogOpen, setQtyUnitDialogOpen] = useState(false);
  const [priceUnitDialogOpen, setPriceUnitDialogOpen] = useState(false);

  function handleSizeUnitCreated(unit: Unit) {
    applyCreatedUnitToMaterialForm(form, "size_unit_id", unit.id);
  }

  function handleQtyUnitCreated(unit: Unit) {
    applyCreatedUnitToMaterialForm(form, "unit_id", unit.id);
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

  useEffect(() => {
    if (!isCreate || units.length === 0) {
      return;
    }
    const current = form.getValues("size_unit_id");
    if (!current) {
      const mmId = unitIdForCode(units, "mm");
      if (mmId) {
        setFormValueWhenDefaulting(form, "size_unit_id", mmId);
      }
    }
    const priceUnit = form.getValues("price_unit_id");
    if (!priceUnit) {
      const kgId = unitIdForCode(units, "kg");
      if (kgId) {
        setFormValueWhenDefaulting(form, "price_unit_id", kgId);
      }
    }
    const qtyUnit = form.getValues("unit_id");
    if (!qtyUnit) {
      const kgId = unitIdForCode(units, "kg");
      if (kgId) {
        setFormValueWhenDefaulting(form, "unit_id", kgId);
      }
    }
  }, [isCreate, units, form]);

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

      <MaterialFormSection
        title="Sizes"
        actions={
          isCreate ? (
            <div className="flex flex-wrap items-center gap-3">
              <FormField
                control={control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormLabel className="text-sm font-normal">Active</FormLabel>
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
            </div>
          ) : null
        }
      >
        <div className="overflow-hidden rounded-md border">
          <div className="hidden border-b bg-muted/40 sm:grid sm:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1fr)_minmax(0,1fr)_8.5rem] sm:items-center">
            <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Size</div>
            <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Size unit</div>
            <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">No. of rolls</div>
            <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty available</div>
            <div className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Qty unit</div>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1fr)_minmax(0,1fr)_8.5rem] sm:items-center sm:gap-0 sm:p-0">
            <FormField
              control={control}
              name="size"
              render={({ field }) => (
                <FormItem className="min-w-0 px-0 sm:px-4 sm:py-3">
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
              name="size_unit_id"
              render={({ field }) => (
                <FormItem className="min-w-0 px-0 sm:px-4 sm:py-3">
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
                        !readOnly && canCreateUnit ? () => setSizeUnitDialogOpen(true) : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="opening_rolls"
              render={({ field }) => (
                <FormItem className="min-w-0 px-0 sm:px-4 sm:py-3">
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
              name="quantity_available"
              render={({ field }) => (
                <FormItem className="min-w-0 px-0 sm:px-4 sm:py-3">
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
              name="unit_id"
              render={({ field }) => (
                <FormItem className="min-w-0 px-0 sm:px-4 sm:py-3">
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
                        !readOnly && canCreateUnit ? () => setQtyUnitDialogOpen(true) : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
        onOpenChange={setSizeUnitDialogOpen}
        onCreated={handleSizeUnitCreated}
      />
      <UnitQuickCreateDialog
        open={qtyUnitDialogOpen}
        onOpenChange={setQtyUnitDialogOpen}
        onCreated={handleQtyUnitCreated}
      />
      <UnitQuickCreateDialog
        open={priceUnitDialogOpen}
        onOpenChange={setPriceUnitDialogOpen}
        onCreated={handlePriceUnitCreated}
      />
    </div>
  );
}
