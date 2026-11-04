"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateInkBrand } from "@/modules/inventory/inks/mutations";
import type { InkBrand } from "@/modules/inventory/inks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
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
import { Switch } from "@/shared/components/ui/switch";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useFormResetOnDialogOpen } from "@/shared/hooks/use-form-reset-on-dialog-open";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";

const BrandQuickFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  is_active: z.boolean(),
});

type BrandQuickFormValues = z.infer<typeof BrandQuickFormSchema>;

export function BrandQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (brand: InkBrand) => void;
}) {
  const createBrand = useCreateInkBrand();
  const [formError, setFormError] = useState<string | null>(null);

  const emptyValues = useMemo(
    (): BrandQuickFormValues => ({
      name: "",
      is_active: true,
    }),
    [],
  );

  const form = useForm<BrandQuickFormValues>({
    resolver: zodResolver(BrandQuickFormSchema),
    defaultValues: emptyValues,
  });

  useFormResetOnDialogOpen(form, emptyValues, open, "ink-brand-quick-create");

  async function onSubmit(values: BrandQuickFormValues) {
    setFormError(null);
    try {
      const created = await createBrand.mutateAsync({
        name: values.name.trim(),
        is_active: values.is_active,
      });
      toast.success("Brand created");
      onCreated?.(created);
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
        <FormDialogHeader title="New ink brand" entity="Brand" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="flex flex-col gap-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
            <FormDialogFooter
              pending={createBrand.isPending}
              canSubmit
              submitLabel="Create brand"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
