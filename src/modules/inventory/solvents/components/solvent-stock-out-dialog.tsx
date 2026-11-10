"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SolventStockOutFields } from "@/modules/inventory/solvents/components/solvent-stock-out-fields";
import {
  buildSolventStockOutFormSchema,
  type SolventStockOutFormValues,
} from "@/modules/inventory/solvents/components/solvent-stock-out-schema";
import { useSolventStockOut } from "@/modules/inventory/solvents/mutations";
import type { SolventSheet } from "@/modules/inventory/solvents/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Form } from "@/shared/components/ui/form";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";

export function SolventStockOutDialog({
  open,
  onOpenChange,
  sheet,
  defaultLineId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheet: SolventSheet;
  defaultLineId?: string;
}) {
  const stockOut = useSolventStockOut();
  const [formError, setFormError] = useState<string | null>(null);
  const lines = sheet.lines;
  const schema = useMemo(() => buildSolventStockOutFormSchema(lines), [lines]);

  const defaultValues = useMemo(
    (): SolventStockOutFormValues => ({
      solvent_line_id: defaultLineId && lines.some((l) => l.id === defaultLineId)
        ? defaultLineId
        : (lines[0]?.id ?? ""),
      drums: "0",
      quantity: "0",
      note: "",
    }),
    [defaultLineId, lines],
  );

  const form = useForm<SolventStockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setFormError(null);
    }
  }, [open, defaultValues, form]);

  async function onSubmit(values: SolventStockOutFormValues) {
    setFormError(null);
    try {
      await stockOut.mutateAsync({
        sheetId: sheet.id,
        values: {
          solvent_line_id: values.solvent_line_id,
          drums: values.drums.trim() || "0",
          quantity: values.quantity.trim() || "0",
          note: values.note?.trim() || null,
        },
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
      <DialogContent className="max-w-[min(28rem,calc(100vw-1.5rem))]">
        <FormDialogHeader title="Stock out" entity={sheet.company_name} />
        <Form {...form}>
          <form
            onSubmit={isolatedFormSubmitHandler(form, onSubmit)}
            className="space-y-4"
          >
            <SolventStockOutFields
              lines={lines}
              form={form}
              formError={formError}
              pending={stockOut.isPending}
              onClose={() => onOpenChange(false)}
              onSubmitForm={onSubmit}
              layout="dialog"
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
