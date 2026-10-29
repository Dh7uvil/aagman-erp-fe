"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { companyFormToCreateRequest } from "@/modules/users-management/companies/company-payload";
import { useCreateCompany } from "@/modules/users-management/companies/mutations";
import {
  companyToFormValues,
  type Company,
} from "@/modules/users-management/companies/schemas";
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
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";

const CompanyQuickCreateSchema = z.object({
  name: z.string().min(1, "Enter a company name").max(200),
});

type CompanyQuickCreateValues = z.infer<typeof CompanyQuickCreateSchema>;

export function CompanyQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (company: Company) => void;
}) {
  const createCompany = useCreateCompany();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CompanyQuickCreateValues>({
    resolver: zodResolver(CompanyQuickCreateSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CompanyQuickCreateValues) {
    setFormError(null);
    try {
      const payload = companyFormToCreateRequest({
        ...companyToFormValues(null),
        name: values.name.trim(),
      });
      const created = await createCompany.mutateAsync(payload);
      toast.success("Company added");
      onCreated?.(created);
      form.reset({ name: "" });
      onOpenChange(false);
    } catch (error) {
      applyFieldErrors(error, form.setError);
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <FormDialogHeader title="New company" entity="Company" />
        <Form {...form}>
          <form onSubmit={isolatedFormSubmitHandler(form, onSubmit)} className="space-y-4">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Acme Corp" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDialogFooter
              pending={createCompany.isPending}
              canSubmit
              submitLabel="Add company"
              onClose={() => onOpenChange(false)}
              onSubmit={() => void form.handleSubmit(onSubmit)()}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
