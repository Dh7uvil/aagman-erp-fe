"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import { stockQuantity } from "@/modules/inventory/materials/api";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import {
  buildStockOutFormSchema,
  type StockOutFormValues,
} from "@/modules/inventory/materials/components/material-stock-out-schema";
import { useAllMaterials } from "@/modules/inventory/materials/queries";
import type { Material } from "@/modules/inventory/materials/schemas";
import { useCreateMovement } from "@/modules/inventory/movements/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDecimal } from "@/shared/lib/format";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";
import { useCompanies } from "@/modules/users-management/companies/queries";

export type MaterialStockOutPickerDefaults = {
  companyId?: string | null;
  productId?: string | null;
  micronId?: string | null;
  materialId?: string | null;
};

function MaterialStockOutFields({
  activeMaterials,
  selectedMaterialId,
  onMaterialIdChange,
  micronName,
  showWidthSelect,
  form,
  formError,
  pending,
  onClose,
  onSubmitForm,
  emptyHint,
}: {
  activeMaterials: Material[];
  selectedMaterialId: string;
  onMaterialIdChange: (id: string) => void;
  micronName?: string;
  showWidthSelect: boolean;
  form: ReturnType<typeof useForm<StockOutFormValues>>;
  formError: string | null;
  pending: boolean;
  onClose: () => void;
  onSubmitForm: (values: StockOutFormValues) => Promise<void>;
  emptyHint?: string;
}) {
  const selectedMaterial =
    activeMaterials.find((row) => row.id === selectedMaterialId) ?? activeMaterials[0];

  const widthLabel = selectedMaterial
    ? selectedMaterial.size_label || `${formatDecimal(selectedMaterial.size)} mm`
    : null;

  return (
    <>
      {activeMaterials.length === 0 && emptyHint ? (
        <p className="text-muted-foreground text-sm">{emptyHint}</p>
      ) : null}

      {activeMaterials.length > 0 && showWidthSelect ? (
        <FormField
          control={form.control}
          name="material_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    onMaterialIdChange(value);
                    form.clearErrors(["rolls", "kilograms"]);
                  }}
                  placeholder="Select width"
                  options={activeMaterials.map((row) => ({
                    value: row.id,
                    label: row.size_label || formatDecimal(row.size),
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      {selectedMaterial ? (
        <p className="text-muted-foreground text-sm">
          {micronName ? `${micronName} · ` : null}
          {widthLabel}
          {" · On hand "}
          <span className="text-foreground font-medium tabular-nums">
            {formatDecimal(selectedMaterial.rolls_on_hand)} rolls ·{" "}
            {formatDecimal(selectedMaterial.total_kg)} {selectedMaterial.unit_code || "kg"}
          </span>
        </p>
      ) : null}

      {activeMaterials.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="rolls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolls out</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" placeholder="0" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kilograms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kg out</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="decimal" placeholder="0" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder="e.g. Issued to production"
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}

      {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
      <FormDialogFooter
        pending={pending}
        canSubmit={Boolean(selectedMaterial)}
        submitLabel="Record stock out"
        submitVariant="outline"
        submitClassName={stockOutButtonClassName}
        onClose={onClose}
        onSubmit={() => void form.handleSubmit(onSubmitForm)()}
      />
    </>
  );
}

function MaterialStockOutDialogWithPicker({
  open,
  onOpenChange,
  pickerDefaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickerDefaults?: MaterialStockOutPickerDefaults;
}) {
  const createMovement = useCreateMovement();
  const [formError, setFormError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [productId, setProductId] = useState("");
  const [micronId, setMicronId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const categoriesQuery = useAllCategories(companyId || undefined, Boolean(companyId));
  const categories = categoriesQuery.data ?? [];
  const micronsQuery = useAllMicrons(productId || undefined, Boolean(productId));
  const microns = micronsQuery.data ?? [];
  const widthsQuery = useAllMaterials(
    { parent_id: micronId, is_active: true },
    Boolean(micronId),
  );
  const activeMaterials = useMemo(
    () => (widthsQuery.data ?? []).filter((row) => row.is_active),
    [widthsQuery.data],
  );

  const selectedMicron = microns.find((row) => row.id === micronId);

  const schema = useMemo(() => buildStockOutFormSchema(activeMaterials), [activeMaterials]);
  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { material_id: "", rolls: "", kilograms: "", note: "" },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextCompany = pickerDefaults?.companyId ?? "";
    const nextProduct = pickerDefaults?.productId ?? "";
    const nextMicron = pickerDefaults?.micronId ?? "";
    const nextMaterial = pickerDefaults?.materialId ?? "";
    setCompanyId(nextCompany);
    setProductId(nextProduct);
    setMicronId(nextMicron);
    setSelectedMaterialId(nextMaterial);
    form.reset({
      material_id: nextMaterial,
      rolls: "",
      kilograms: "",
      note: "",
    });
    setFormError(null);
  }, [open, pickerDefaults, form]);

  useEffect(() => {
    if (!open || !activeMaterials.length) {
      return;
    }
    const validId =
      selectedMaterialId && activeMaterials.some((row) => row.id === selectedMaterialId)
        ? selectedMaterialId
        : activeMaterials[0]!.id;
    if (validId !== selectedMaterialId) {
      setSelectedMaterialId(validId);
    }
    form.setValue("material_id", validId, { shouldValidate: false });
  }, [open, activeMaterials, selectedMaterialId, form]);

  const selectedMaterial = activeMaterials.find((row) => row.id === selectedMaterialId);

  async function onSubmit(values: StockOutFormValues) {
    if (!selectedMaterial) {
      setFormError("Select a width to stock out");
      return;
    }
    setFormError(null);
    try {
      await createMovement.mutateAsync({
        category_id: selectedMaterial.id,
        movement_date: new Date().toISOString().slice(0, 10),
        direction: "OUT",
        rolls: stockQuantity(values.rolls),
        kilograms: stockQuantity(values.kilograms),
        note: values.note?.trim() ? values.note.trim() : "Stock out",
      });
      toast.success("Stock out recorded");
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormDialogHeader title="Stock out" entity="Material" />
        <Form {...form}>
          <form
            onSubmit={isolatedFormSubmitHandler(form, onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Company</Label>
                <SearchableSelect
                  asFormControl={false}
                  value={companyId}
                  onValueChange={(value) => {
                    setCompanyId(value);
                    setProductId("");
                    setMicronId("");
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                  placeholder="Select company"
                  options={companies.map((row) => ({ value: row.id, label: row.name }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Product</Label>
                <SearchableSelect
                  asFormControl={false}
                  value={productId}
                  disabled={!companyId}
                  onValueChange={(value) => {
                    setProductId(value);
                    setMicronId("");
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                  placeholder={companyId ? "Select product" : "Select company first"}
                  options={categories.map((row) => ({ value: row.id, label: row.name }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Micron</Label>
                <SearchableSelect
                  asFormControl={false}
                  value={micronId}
                  disabled={!productId}
                  onValueChange={(value) => {
                    setMicronId(value);
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                  placeholder={productId ? "Select micron" : "Select product first"}
                  options={microns.map((row) => ({ value: row.id, label: row.name }))}
                />
              </div>
            </div>
            <MaterialStockOutFields
              activeMaterials={activeMaterials}
              selectedMaterialId={selectedMaterialId}
              onMaterialIdChange={setSelectedMaterialId}
              micronName={selectedMicron?.name}
              showWidthSelect={Boolean(micronId)}
              form={form}
              formError={formError}
              pending={createMovement.isPending}
              onClose={() => onOpenChange(false)}
              onSubmitForm={onSubmit}
              emptyHint="Select company, product, and micron to choose a width."
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MaterialStockOutDialogScoped({
  open,
  onOpenChange,
  materials,
  initialMaterialId,
  micronName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  initialMaterialId?: string;
  micronName?: string;
}) {
  const createMovement = useCreateMovement();
  const [formError, setFormError] = useState<string | null>(null);
  const activeMaterials = useMemo(
    () => materials.filter((row) => row.is_active),
    [materials],
  );

  const defaultMaterialId =
    initialMaterialId && activeMaterials.some((row) => row.id === initialMaterialId)
      ? initialMaterialId
      : activeMaterials[0]?.id;

  const [selectedMaterialId, setSelectedMaterialId] = useState(defaultMaterialId ?? "");
  const selectedMaterial =
    activeMaterials.find((row) => row.id === selectedMaterialId) ?? activeMaterials[0];

  const schema = useMemo(() => buildStockOutFormSchema(activeMaterials), [activeMaterials]);

  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      material_id: defaultMaterialId ?? "",
      rolls: "",
      kilograms: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const nextId = defaultMaterialId ?? "";
    setSelectedMaterialId(nextId);
    form.reset({
      material_id: nextId,
      rolls: "",
      kilograms: "",
      note: "",
    });
    setFormError(null);
  }, [open, defaultMaterialId, form]);

  useEffect(() => {
    form.setValue("material_id", selectedMaterialId, { shouldValidate: true });
  }, [form, selectedMaterialId]);

  async function onSubmit(values: StockOutFormValues) {
    if (!selectedMaterial) {
      setFormError("Select a width to stock out");
      return;
    }
    setFormError(null);
    try {
      await createMovement.mutateAsync({
        category_id: selectedMaterial.id,
        movement_date: new Date().toISOString().slice(0, 10),
        direction: "OUT",
        rolls: stockQuantity(values.rolls),
        kilograms: stockQuantity(values.kilograms),
        note: values.note?.trim() ? values.note.trim() : "Stock out",
      });
      toast.success("Stock out recorded");
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormDialogHeader title="Stock out" entity="Material" />
        <Form {...form}>
          <form
            onSubmit={isolatedFormSubmitHandler(form, onSubmit)}
            className="space-y-4"
          >
            <MaterialStockOutFields
              activeMaterials={activeMaterials}
              selectedMaterialId={selectedMaterialId}
              onMaterialIdChange={setSelectedMaterialId}
              micronName={micronName}
              showWidthSelect={activeMaterials.length > 1}
              form={form}
              formError={formError}
              pending={createMovement.isPending}
              onClose={() => onOpenChange(false)}
              onSubmitForm={onSubmit}
              emptyHint="No active widths available for stock out."
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type MaterialStockOutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Product view: widths for the selected micron. */
  materials?: Material[];
  initialMaterialId?: string;
  micronName?: string;
  /** List view: cascade company → product → micron → width. */
  pickerDefaults?: MaterialStockOutPickerDefaults;
};

export function MaterialStockOutDialog({
  open,
  onOpenChange,
  materials,
  initialMaterialId,
  micronName,
  pickerDefaults,
}: MaterialStockOutDialogProps) {
  if (materials !== undefined) {
    return (
      <MaterialStockOutDialogScoped
        open={open}
        onOpenChange={onOpenChange}
        materials={materials}
        initialMaterialId={initialMaterialId}
        micronName={micronName}
      />
    );
  }

  return (
    <MaterialStockOutDialogWithPicker
      open={open}
      onOpenChange={onOpenChange}
      pickerDefaults={pickerDefaults}
    />
  );
}
