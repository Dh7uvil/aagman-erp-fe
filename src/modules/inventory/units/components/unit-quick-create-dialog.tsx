"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateUnit } from "@/modules/inventory/units/mutations";
import {
  UnitFormSchema,
  unitToFormValues,
  type Unit,
  type UnitFormValues,
} from "@/modules/inventory/units/schemas";
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
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";

export function UnitQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (unit: Unit) => void;
}) {
  const createUnit = useCreateUnit();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(UnitFormSchema),
    defaultValues: unitToFormValues(null),
  });

  async function onSubmit(values: UnitFormValues) {
    setFormError(null);
    try {
      const created = await createUnit.mutateAsync({
        code: values.code.trim(),
        name: values.name.trim(),
        is_active: values.is_active,
      });
      toast.success("Unit added");
      onCreated?.(created);
      form.reset(unitToFormValues(null));
      onOpenChange(false);
    } catch (error) {
      applyFieldErrors(error, form.setError);
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormDialogHeader title="New unit" entity="Unit" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. mm, kg" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Millimeter" />
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
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <FormDialogFooter
              pending={createUnit.isPending}
              canSubmit
              submitLabel="Add unit"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
