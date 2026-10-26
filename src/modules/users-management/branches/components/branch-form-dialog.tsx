"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateBranch, useUpdateBranch } from "@/modules/users-management/branches/mutations";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import {
  BranchFormSchema,
  type Branch,
  type BranchCreateRequest,
  type BranchFormValues,
  type BranchUpdateRequest,
} from "@/modules/users-management/branches/schemas";
import {
  addressToFormValues,
  emptyToNull,
  toAddressPayload,
} from "@/modules/users-management/organization/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { AddressFields } from "@/shared/components/form/address-fields";
import { FormDialogFooter } from "@/shared/components/form/form-dialog-footer";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { TimezoneSelect } from "@/shared/components/form/timezone-select";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { isolatedFormSubmitHandler } from "@/shared/lib/isolated-form-submit";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";

function toFormValues(branch: Branch | null): BranchFormValues {
  return {
    name: branch?.name ?? "",
    code: branch?.code ?? "",
    status: branch?.status ?? "ACTIVE",
    phone: branch?.phone ?? "",
    timezone: branch?.timezone ?? "",
    address: addressToFormValues(branch?.address),
  };
}

function toCreateRequest(values: BranchFormValues): BranchCreateRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    status: values.status,
    phone: emptyToNull(values.phone),
    timezone: emptyToNull(values.timezone),
    address: toAddressPayload(values.address),
  };
}

export function BranchFormDialog({
  open,
  branch,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(branchPermissions);
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const [formError, setFormError] = useState<string | null>(null);
  const hasRecord = Boolean(branch);
  const { mode, readOnly, canSubmit } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(BranchFormSchema),
    values: toFormValues(branch),
  });
  useDirtyFormGuard(open && canSubmit && form.formState.isDirty);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFormError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(values: BranchFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (branch) {
        const payload: BranchUpdateRequest = {
          name: values.name.trim(),
          code: values.code.trim(),
          status: values.status,
          phone: emptyToNull(values.phone),
          timezone: emptyToNull(values.timezone),
          address: toAddressPayload(values.address),
        };
        await updateBranch.mutateAsync({ id: branch.id, values: payload });
        toast.success("Branch updated");
      } else {
        const created = await createBranch.mutateAsync(toCreateRequest(values));
        toast.success("Branch created");
        onCreated?.(created);
      }
      handleOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createBranch.isPending || updateBranch.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <FormDialogHeader
          title={formDialogTitle("Branch", mode)}
          entity="Branch"
          code={branch?.code}
        />
        <Form {...form}>
          <form
            onSubmit={
              canSubmit
                ? isolatedFormSubmitHandler(form, onSubmit)
                : (event) => event.preventDefault()
            }
            className="flex flex-col gap-3"
          >
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. West Coast Office" disabled={readOnly} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="WCO" disabled={readOnly || hasRecord} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1-555-0000" disabled={readOnly} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <TimezoneSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      allowEmpty
                      disabled={readOnly}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AddressFields control={form.control} name="address" disabled={readOnly} />
            </div>
            <FormDialogFooter
              pending={pending}
              canSubmit={canSubmit}
              submitLabel={hasRecord ? "Save Changes" : "Create Branch"}
              onClose={() => handleOpenChange(false)}
              onSubmit={() => {
                if (canSubmit) {
                  void form.handleSubmit(onSubmit)();
                }
              }}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
