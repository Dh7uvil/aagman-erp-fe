"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateAdhesiveCode } from "@/modules/inventory/adhesive-codes/mutations";
import type { AdhesiveCode } from "@/modules/inventory/adhesive-codes/schemas";
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

const AdhesiveCodeQuickFormSchema = z.object({
  code: z.string().min(1, "Enter code").max(200),
  is_active: z.boolean(),
});

type AdhesiveCodeQuickFormValues = z.infer<typeof AdhesiveCodeQuickFormSchema>;

export function AdhesiveCodeQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (code: AdhesiveCode) => void;
}) {
  const createCode = useCreateAdhesiveCode();
  const [formError, setFormError] = useState<string | null>(null);

  const emptyValues = useMemo(
    (): AdhesiveCodeQuickFormValues => ({
      code: "",
      is_active: true,
    }),
    [],
  );

  const form = useForm<AdhesiveCodeQuickFormValues>({
    resolver: zodResolver(AdhesiveCodeQuickFormSchema),
    defaultValues: emptyValues,
  });

  useFormResetOnDialogOpen(form, emptyValues, open, "adhesive-code-quick-create");

  async function onSubmit(values: AdhesiveCodeQuickFormValues) {
    setFormError(null);
    try {
      const created = await createCode.mutateAsync({
        code: values.code.trim(),
        is_active: values.is_active,
      });
      toast.success("Code added to master");
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
      <DialogContent className="max-w-[min(28rem,calc(100vw-1.5rem))]">
        <FormDialogHeader title="New adhesive" entity="Adhesive master" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="flex flex-col gap-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
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
              pending={createCode.isPending}
              canSubmit
              submitLabel="Add adhesive"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
