"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Control } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateCategory } from "@/modules/inventory/categories/mutations";
import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  applyCreatedMicronToMaterialSizeLine,
  applyCreatedProductToMaterialForm,
  applyCreatedSizeLineQuantityUnitToMaterialForm,
  applyCreatedSizeLineUnitToMaterialForm,
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
import { CompanyQuickCreateDialog } from "@/modules/users-management/companies/components/company-quick-create-dialog";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { UnitQuickCreateDialog } from "@/modules/inventory/units/components/unit-quick-create-dialog";
import { useAllUnits } from "@/modules/inventory/units/queries";
import type { Unit } from "@/modules/inventory/units/schemas";
import { Button } from "@/shared/components/ui/button";
import { AddLineItemButton } from "@/shared/components/form/add-line-item-button";
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

/** Micron [| price | per] | size | unit | rolls | qty | unit | active | delete */
const SIZE_LINE_GRID =
  "sm:grid-cols-[minmax(7.5rem,1.15fr)_minmax(5rem,0.95fr)_minmax(7.25rem,1.15fr)_minmax(4.5rem,0.85fr)_minmax(4.5rem,0.85fr)_minmax(7.25rem,1.15fr)_3.25rem_2.25rem] sm:items-stretch";
const SIZE_LINE_GRID_WITH_PRICE =
  "sm:grid-cols-[minmax(7.5rem,1.1fr)_minmax(4.25rem,0.75fr)_minmax(8.75rem,1fr)_minmax(4.75rem,0.8fr)_minmax(7rem,1fr)_minmax(4.25rem,0.8fr)_minmax(4.25rem,0.8fr)_minmax(7rem,1fr)_3.25rem_2.25rem] sm:items-stretch";

function sizeLineGridClass(canViewPrice: boolean) {
  const cols = canViewPrice ? SIZE_LINE_GRID_WITH_PRICE : SIZE_LINE_GRID;
  return `sm:grid ${cols}`;
}

function sizeLineTableMinWidth(canViewPrice: boolean) {
  return canViewPrice ? "sm:min-w-[60rem]" : "sm:min-w-[46rem]";
}

const SIZE_LINE_HEADER =
  "flex items-center px-1 py-2 text-xs font-medium text-muted-foreground sm:px-1.5";
const SIZE_LINE_CELL =
  "flex min-h-0 min-w-0 w-full flex-col justify-center space-y-0 overflow-hidden sm:px-1.5 sm:py-2 [&_[data-slot=form-control]]:min-w-0";
/** Unit / Per columns: tighter horizontal inset so selects align with numeric fields */
const SIZE_LINE_UNIT_CELL =
  "flex min-h-0 min-w-0 w-full flex-col justify-center space-y-0 overflow-hidden sm:px-1 sm:py-2 [&_[data-slot=form-control]]:min-w-0";
/** Vertical rule after Per, size unit, rolls, and qty unit (desktop grid only) */
const SIZE_LINE_COL_DIVIDER = "sm:self-stretch sm:border-r-2 sm:border-border";

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

function clearProductCascade(form: ReturnType<typeof useFormContext<MaterialEditFormValues>>) {
  form.setValue("product_id", "", { shouldValidate: false, shouldDirty: true });
  const lines = form.getValues("size_lines");
  lines.forEach((_, index) => {
    form.setValue(`size_lines.${index}.parent_id`, "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    form.setValue(`size_lines.${index}.price_per_unit`, "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    form.setValue(`size_lines.${index}.price_unit_id`, "", {
      shouldValidate: false,
      shouldDirty: true,
    });
    form.clearErrors(`size_lines.${index}.parent_id`);
  });
}

export function MaterialEditFormFields({
  control,
  readOnly,
  editProductId,
}: {
  control: Control<MaterialEditFormValues>;
  readOnly: boolean;
  /** When set, changing company updates this product after confirmation. */
  editProductId?: string;
}) {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canCreateCategory = can(categoryPermissions.create);
  const canUpdateCategory = can(categoryPermissions.update);
  const canCreateCompany = can(companyPermissions.create);
  const canCreateUnit = can(unitPermissions.create);
  const { canDelete } = useCrudPermissions(materialPermissions);
  const deleteMaterial = useDeleteMaterial();
  const form = useFormContext<MaterialEditFormValues>();
  const productId = useWatch({ control, name: "product_id" });
  const { fields, append, remove } = useFieldArray({ control, name: "size_lines" });
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [micronDialogOpen, setMicronDialogOpen] = useState(false);
  const [micronDialogIndex, setMicronDialogIndex] = useState<number | null>(null);
  const [sizeUnitDialogOpen, setSizeUnitDialogOpen] = useState(false);
  const [qtyUnitDialogOpen, setQtyUnitDialogOpen] = useState(false);
  const [priceUnitDialogOpen, setPriceUnitDialogOpen] = useState(false);
  const [priceUnitDialogIndex, setPriceUnitDialogIndex] = useState<number | null>(null);
  const [sizeUnitDialogIndex, setSizeUnitDialogIndex] = useState<number | null>(null);
  const [qtyUnitDialogIndex, setQtyUnitDialogIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    index: number;
    line: MaterialSizeLineValues;
  } | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const updateCategory = useUpdateCategory();

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
    if (priceUnitDialogIndex === null) {
      return;
    }
    form.setValue(`size_lines.${priceUnitDialogIndex}.price_unit_id`, unit.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    syncLinePriceToSameMicron(priceUnitDialogIndex, { price_unit_id: unit.id });
    setPriceUnitDialogIndex(null);
  }

  function micronCatalogPrice(micronId: string): { price: string; priceUnitId: string } {
    const micron = microns.find((item) => item.id === micronId);
    const kgId = unitIdForCode(units, "kg");
    return {
      price: micron?.price_per_unit ?? "",
      priceUnitId: micron?.price_unit_id ?? kgId,
    };
  }

  function syncLinePriceToSameMicron(
    sourceIndex: number,
    patch: Partial<Pick<MaterialSizeLineValues, "price_per_unit" | "price_unit_id">>,
  ) {
    const lines = form.getValues("size_lines");
    const micronId = lines[sourceIndex]?.parent_id;
    if (!micronId) {
      return;
    }
    lines.forEach((line, index) => {
      if (index === sourceIndex || line.parent_id !== micronId) {
        return;
      }
      if (patch.price_per_unit !== undefined) {
        form.setValue(`size_lines.${index}.price_per_unit`, patch.price_per_unit, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
      if (patch.price_unit_id !== undefined) {
        form.setValue(`size_lines.${index}.price_unit_id`, patch.price_unit_id, {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    });
  }

  function applyMicronToLine(index: number, micronId: string) {
    const { price, priceUnitId } = micronCatalogPrice(micronId);
    if (canViewPrice && price) {
      form.setValue(`size_lines.${index}.price_per_unit`, price, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
    if (priceUnitId) {
      form.setValue(`size_lines.${index}.price_unit_id`, priceUnitId, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
    syncLinePriceToSameMicron(index, {
      price_per_unit: form.getValues(`size_lines.${index}.price_per_unit`),
      price_unit_id: form.getValues(`size_lines.${index}.price_unit_id`),
    });
  }

  const companyId = useWatch({ control, name: "company_id" });
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const scopedCompanyId = companyId || undefined;
  const productsQuery = useAllCategories(scopedCompanyId);
  const micronsQuery = useAllMicrons(productId || undefined, Boolean(productId), false);
  const micronsLoading =
    micronsQuery.isPending || micronsQuery.isFetching || micronsQuery.isRefetching;
  const unitsQuery = useAllUnits();

  const products = productsQuery.data ?? [];
  const microns = micronsQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const defaultSizeUnitId = unitIdForCode(units, "mm");
  const defaultQuantityUnitId = unitIdForCode(units, "kg");

  async function applyCompanyChange(nextCompanyId: string) {
    form.setValue("company_id", nextCompanyId, { shouldValidate: true, shouldDirty: true });
    clearProductCascade(form);
  }

  async function confirmCompanyMove() {
    if (!pendingCompanyId || !editProductId) {
      setPendingCompanyId(null);
      return;
    }
    try {
      await updateCategory.mutateAsync({
        id: editProductId,
        values: { company_id: pendingCompanyId },
      });
      await applyCompanyChange(pendingCompanyId);
      toast.success("Product moved to the selected company");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPendingCompanyId(null);
    }
  }

  function handleCompanyChange(nextCompanyId: string) {
    if (!nextCompanyId || nextCompanyId === companyId) {
      return;
    }
    if (editProductId && canUpdateCategory && productId) {
      setPendingCompanyId(nextCompanyId);
      return;
    }
    void applyCompanyChange(nextCompanyId);
  }
  useEffect(() => {
    if (!productId || micronsLoading) {
      return;
    }
    const lines = form.getValues("size_lines");
    lines.forEach((line, index) => {
      if (line.parent_id && !microns.some((m) => m.id === line.parent_id)) {
        form.setValue(`size_lines.${index}.parent_id`, "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue(`size_lines.${index}.price_per_unit`, "", {
          shouldValidate: false,
          shouldDirty: true,
        });
        form.setValue(`size_lines.${index}.price_unit_id`, "", {
          shouldValidate: false,
          shouldDirty: true,
        });
      }
    });
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

  function defaultLineSeed(): Pick<
    MaterialSizeLineValues,
    "parent_id" | "price_per_unit" | "price_unit_id"
  > {
    const lines = form.getValues("size_lines");
    const last = lines[lines.length - 1];
    return {
      parent_id: last?.parent_id ?? "",
      price_per_unit: last?.price_per_unit ?? "",
      price_unit_id: last?.price_unit_id ?? unitIdForCode(units, "kg"),
    };
  }

  function addSizeLine() {
    const seed = defaultLineSeed();
    append(
      emptyMaterialSizeLine(
        seed.parent_id,
        defaultSizeUnitId,
        defaultQuantityUnitId,
        seed.price_per_unit,
        seed.price_unit_id,
      ),
    );
  }

  function removeSizeRow(index: number) {
    if (fields.length === 1) {
      const seed = defaultLineSeed();
      form.setValue(
        "size_lines",
        [
          emptyMaterialSizeLine(
            seed.parent_id,
            defaultSizeUnitId,
            defaultQuantityUnitId,
            seed.price_per_unit,
            seed.price_unit_id,
          ),
        ],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
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
            name="company_id"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <MasterSelect
                    value={field.value}
                    onValueChange={handleCompanyChange}
                    disabled={readOnly || (Boolean(editProductId) && !canUpdateCategory)}
                    placeholder="Select company"
                    options={companies.map((item) => ({ value: item.id, label: item.name }))}
                    createLabel={!readOnly && canCreateCompany ? "Add company" : undefined}
                    onCreate={
                      !readOnly && canCreateCompany ? () => setCompanyDialogOpen(true) : undefined
                    }
                    loading={companiesQuery.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                      const product = products.find((item) => item.id === value);
                      if (product?.company_id) {
                        form.setValue("company_id", product.company_id, {
                          shouldValidate: false,
                          shouldDirty: false,
                        });
                      }
                      const lines = form.getValues("size_lines");
                      lines.forEach((_, index) => {
                        form.setValue(`size_lines.${index}.parent_id`, "", {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                        form.setValue(`size_lines.${index}.price_per_unit`, "", {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                        form.setValue(`size_lines.${index}.price_unit_id`, "", {
                          shouldValidate: false,
                          shouldDirty: true,
                        });
                        form.clearErrors(`size_lines.${index}.parent_id`);
                      });
                    }}
                    disabled={readOnly || (!companyId && !editProductId)}
                    placeholder={
                      companyId || editProductId ? "Select product" : "Select company first"
                    }
                    options={products.map((item) => ({ value: item.id, label: item.name }))}
                    createLabel={
                      !readOnly && canCreateCategory && companyId ? "New product" : undefined
                    }
                    onCreate={
                      !readOnly && canCreateCategory && companyId
                        ? () => setProductDialogOpen(true)
                        : undefined
                    }
                    loading={productsQuery.isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormGrid>
      </MaterialFormSection>

      <MaterialFormSection title="Sizes">
        <div className="flex flex-col gap-3 overflow-x-auto">
          <div className={sizeLineTableMinWidth(canViewPrice)}>
            <div
              className={`hidden overflow-hidden rounded-md border bg-muted/50 shadow-sm ${sizeLineGridClass(canViewPrice)}`}
            >
              <div className={SIZE_LINE_HEADER}>Micron</div>
              {canViewPrice ? (
                <>
                  <div className={SIZE_LINE_HEADER}>Price</div>
                  <div className={`${SIZE_LINE_HEADER} ${SIZE_LINE_COL_DIVIDER}`}>Per</div>
                </>
              ) : null}
              <div className={SIZE_LINE_HEADER}>Size</div>
              <div className={`${SIZE_LINE_HEADER} ${SIZE_LINE_COL_DIVIDER}`}>Size unit</div>
              <div className={`${SIZE_LINE_HEADER} ${SIZE_LINE_COL_DIVIDER}`}>No. of rolls</div>
              <div className={SIZE_LINE_HEADER}>Qty available</div>
              <div className={`${SIZE_LINE_HEADER} ${SIZE_LINE_COL_DIVIDER}`}>Qty unit</div>
              <div className={`${SIZE_LINE_HEADER} text-center`}>Active</div>
              <div className={SIZE_LINE_HEADER} aria-hidden />
            </div>
            {fields.map((fieldItem, index) => {
            const line = form.watch(`size_lines.${index}`);
            const isIncrementRow = Boolean(editProductId && !line.id);
            const showRemove = canRemoveSizeLine(line);
            return (
              <div
                key={fieldItem.id}
                className={`grid grid-cols-1 gap-4 overflow-hidden rounded-md border bg-card p-4 shadow-sm ${sizeLineGridClass(canViewPrice)} sm:gap-0 sm:p-0`}
              >
                <FormField
                  control={control}
                  name={`size_lines.${index}.parent_id`}
                  render={({ field }) => (
                    <FormItem className={SIZE_LINE_CELL}>
                      <FormLabel className="sm:sr-only">Micron</FormLabel>
                      <FormControl>
                        <MasterSelect
                          compact
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              form.clearErrors(`size_lines.${index}.parent_id`);
                              applyMicronToLine(index, value);
                            }
                          }}
                          disabled={readOnly || !productId}
                          placeholder={productId ? "Micron" : "Product first"}
                          options={microns.map((item) => ({ value: item.id, label: item.name }))}
                          loading={micronsLoading}
                          createLabel={
                            !readOnly && canCreateCategory && productId ? "New micron" : undefined
                          }
                          onCreate={
                            !readOnly && canCreateCategory && productId
                              ? () => {
                                  setMicronDialogIndex(index);
                                  setMicronDialogOpen(true);
                                }
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
                      name={`size_lines.${index}.price_per_unit`}
                      render={({ field }) => (
                        <FormItem className={SIZE_LINE_CELL}>
                          <FormLabel className="sm:sr-only">Price</FormLabel>
                          <FormControl>
                            <DecimalInput
                              kind="money"
                              {...field}
                              disabled={readOnly}
                              onChange={(event) => {
                                field.onChange(event);
                                syncLinePriceToSameMicron(index, {
                                  price_per_unit: event.target.value,
                                });
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`size_lines.${index}.price_unit_id`}
                      render={({ field }) => (
                        <FormItem className={`${SIZE_LINE_UNIT_CELL} ${SIZE_LINE_COL_DIVIDER}`}>
                          <FormLabel className="sm:sr-only">Price unit</FormLabel>
                          <FormControl>
                            <MasterSelect
                              compact
                              className="min-w-0 max-w-full"
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                syncLinePriceToSameMicron(index, { price_unit_id: value });
                              }}
                              disabled={readOnly}
                              placeholder="Per"
                              options={units.map((item) => ({
                                value: item.id,
                                label: item.code,
                              }))}
                              createLabel={!readOnly && canCreateUnit ? "New unit" : undefined}
                              onCreate={
                                !readOnly && canCreateUnit
                                  ? () => {
                                      setPriceUnitDialogIndex(index);
                                      setPriceUnitDialogOpen(true);
                                    }
                                  : undefined
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : null}
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
                    <FormItem className={`${SIZE_LINE_UNIT_CELL} ${SIZE_LINE_COL_DIVIDER}`}>
                      <FormLabel className="sm:sr-only">Size unit</FormLabel>
                      <FormControl>
                        <MasterSelect
                          compact
                          className="min-w-0 max-w-full"
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
                    <FormItem className={`${SIZE_LINE_CELL} ${SIZE_LINE_COL_DIVIDER}`}>
                      <FormLabel className={isIncrementRow ? "sr-only" : "sm:sr-only"}>
                        {isIncrementRow ? "Add rolls" : "No. of rolls"}
                      </FormLabel>
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
                      <FormLabel className={isIncrementRow ? "sr-only" : "sm:sr-only"}>
                        {isIncrementRow ? "Add qty (kg)" : "Qty available"}
                      </FormLabel>
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
                    <FormItem className={`${SIZE_LINE_UNIT_CELL} ${SIZE_LINE_COL_DIVIDER}`}>
                      <FormLabel className="sm:sr-only">Qty unit</FormLabel>
                      <FormControl>
                        <MasterSelect
                          compact
                          className="min-w-0 max-w-full"
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
                      <FormItem className="flex flex-row items-center gap-2 space-y-0 sm:justify-center sm:px-1 sm:py-2">
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
                  <div className="flex shrink-0 items-center sm:justify-center sm:px-1 sm:py-2">
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
          </div>
          {!readOnly ? (
            <AddLineItemButton onClick={addSizeLine}>Add size</AddLineItemButton>
          ) : null}
        </div>
      </MaterialFormSection>

      <CompanyQuickCreateDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        onCreated={(company) => {
          form.setValue("company_id", company.id, { shouldValidate: true, shouldDirty: true });
          clearProductCascade(form);
        }}
      />
      <CategoryQuickCreateDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        companyId={companyId || undefined}
        onCreated={(category) =>
          applyCreatedProductToMaterialForm(form, category.id, category.company_id)
        }
      />
      <MicronQuickCreateDialog
        open={micronDialogOpen}
        onOpenChange={(open) => {
          setMicronDialogOpen(open);
          if (!open) {
            setMicronDialogIndex(null);
          }
        }}
        defaultProductId={productId || undefined}
        onCreated={(micron) => {
          const targetIndex = micronDialogIndex ?? 0;
          applyCreatedMicronToMaterialSizeLine(form, targetIndex, micron, canViewPrice);
          syncLinePriceToSameMicron(targetIndex, {
            price_per_unit: form.getValues(`size_lines.${targetIndex}.price_per_unit`),
            price_unit_id: form.getValues(`size_lines.${targetIndex}.price_unit_id`),
          });
          setMicronDialogIndex(null);
        }}
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
        onOpenChange={(open) => {
          setPriceUnitDialogOpen(open);
          if (!open) {
            setPriceUnitDialogIndex(null);
          }
        }}
        onCreated={handlePriceUnitCreated}
      />
      <ConfirmActionDialog
        open={Boolean(pendingCompanyId)}
        title="Move product to another company"
        description="This moves the product and all of its materials to the selected company."
        confirmLabel="Move product"
        pending={updateCategory.isPending}
        onConfirm={confirmCompanyMove}
        onOpenChange={(open) => !open && setPendingCompanyId(null)}
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
