"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useCreateMicron } from "@/modules/inventory/microns/mutations";
import type { Micron } from "@/modules/inventory/microns/schemas";
import { inventoryPricePermissions, unitPermissions } from "@/modules/inventory/permissions";
import { UnitQuickCreateDialog } from "@/modules/inventory/units/components/unit-quick-create-dialog";
import { useAllUnits } from "@/modules/inventory/units/queries";
import type { Unit } from "@/modules/inventory/units/schemas";
import { Button } from "@/shared/components/ui/button";
import { getErrorMessage } from "@/shared/api/errors";
import {
  setFormValueFromQuickCreate,
  setFormValueWhenDefaulting,
} from "@/shared/lib/form-quick-create";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";
import { DecimalInput } from "@/shared/components/form/decimal-input";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { MasterSelect } from "@/shared/components/form/master-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCan } from "@/shared/providers/session-provider";

const MicronQuickFormSchema = z.object({
  product_id: z.string().uuid({ message: "Select a product" }),
  name: z.string().min(1, "Enter a name").max(200),
  price_per_unit: z.string(),
  price_unit_id: z.string().uuid({ message: "Select price unit" }),
  is_active: z.boolean(),
});

type MicronQuickFormValues = z.infer<typeof MicronQuickFormSchema>;

export function MicronQuickCreateDialog({
  open,
  onOpenChange,
  defaultProductId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProductId?: string;
  onCreated?: (micron: Micron) => void;
}) {
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canCreateUnit = can(unitPermissions.create);
  const createMicron = useCreateMicron();
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const categoriesQuery = useAllCategories();
  const unitsQuery = useAllUnits();
  const products = categoriesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MicronQuickFormValues>({
    resolver: zodResolver(MicronQuickFormSchema),
    defaultValues: {
      product_id: defaultProductId ?? "",
      name: "",
      price_per_unit: "",
      price_unit_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open && defaultProductId) {
      setFormValueWhenDefaulting(form, "product_id", defaultProductId);
    }
  }, [open, defaultProductId, form]);

  useEffect(() => {
    if (!open || units.length === 0) {
      return;
    }
    const kg = units.find((item) => item.code === "kg");
    if (kg && !form.getValues("price_unit_id")) {
      setFormValueWhenDefaulting(form, "price_unit_id", kg.id);
    }
  }, [open, units, form]);

  async function onSubmit(values: MicronQuickFormValues) {
    setFormError(null);
    try {
      const price = values.price_per_unit.trim();
      const created = await createMicron.mutateAsync({
        product_id: values.product_id,
        name: values.name.trim(),
        price_per_unit: canViewPrice && price !== "" ? price : null,
        price_unit_id: values.price_unit_id,
        is_active: values.is_active,
      });
      toast.success("Micron added");
      onCreated?.(created);
      const kgId = units.find((item) => item.code === "kg")?.id ?? "";
      form.reset({
        product_id: defaultProductId ?? "",
        name: "",
        price_per_unit: "",
        price_unit_id: kgId,
        is_active: true,
      });
      onOpenChange(false);
    } catch (error) {
      applyFieldErrors(error, form.setError);
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormDialogHeader title="New micron" entity="Micron" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <MasterSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select product"
                    options={products.map((item) => ({ value: item.id, label: item.name }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Micron</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 12 MIC" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canViewPrice ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <DecimalInput kind="money" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_unit_id"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per</FormLabel>
                    <FormControl>
                      <MasterSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Unit"
                        options={units.map((item) => ({
                          value: item.id,
                          label: item.code,
                        }))}
                        createLabel={canCreateUnit ? "New unit" : undefined}
                        onCreate={canCreateUnit ? () => setUnitDialogOpen(true) : undefined}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />
              </div>
            ) : null}
            <UnitQuickCreateDialog
              open={unitDialogOpen}
              onOpenChange={setUnitDialogOpen}
              onCreated={(unit: Unit) => {
                setFormValueFromQuickCreate(form, "price_unit_id", unit.id);
              }}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <FormDialogFooter
              pending={createMicron.isPending}
              canSubmit
              submitLabel="Add micron"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
