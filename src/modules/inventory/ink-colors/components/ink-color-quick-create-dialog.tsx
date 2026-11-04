"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateInkColor } from "@/modules/inventory/ink-colors/mutations";
import { hexCodeToApiValue, type InkColor } from "@/modules/inventory/ink-colors/schemas";
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

const HexCodeSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || value === "#" || /^#[0-9A-Fa-f]{6}$/.test(value), {
    message: "Enter a valid hex code like #FF5733",
  });

const InkColorQuickFormSchema = z.object({
  name: z.string().min(1, "Enter color").max(200),
  hex_code: HexCodeSchema,
  is_active: z.boolean(),
});

type InkColorQuickFormValues = z.infer<typeof InkColorQuickFormSchema>;

export function InkColorQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (color: InkColor) => void;
}) {
  const createColor = useCreateInkColor();
  const [formError, setFormError] = useState<string | null>(null);

  const emptyValues = useMemo(
    (): InkColorQuickFormValues => ({
      name: "",
      hex_code: "#",
      is_active: true,
    }),
    [],
  );

  const form = useForm<InkColorQuickFormValues>({
    resolver: zodResolver(InkColorQuickFormSchema),
    defaultValues: emptyValues,
  });

  useFormResetOnDialogOpen(form, emptyValues, open, "ink-color-quick-create");

  async function onSubmit(values: InkColorQuickFormValues) {
    setFormError(null);
    try {
      const created = await createColor.mutateAsync({
        name: values.name.trim(),
        hex_code: hexCodeToApiValue(values.hex_code),
        is_active: values.is_active,
      });
      toast.success("Color added to master");
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
        <FormDialogHeader title="New color" entity="Ink master" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="flex flex-col gap-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hex_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hex code (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="#FF5733" autoComplete="off" />
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
              pending={createColor.isPending}
              canSubmit
              submitLabel="Add color"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
