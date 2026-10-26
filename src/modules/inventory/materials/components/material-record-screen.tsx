"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { toCreatePayload, toMicronPricePayload } from "@/modules/inventory/materials/api";
import { useUpdateMicron } from "@/modules/inventory/microns/mutations";
import { MaterialFormFields } from "@/modules/inventory/materials/components/material-form-fields";
import { useCreateMaterial } from "@/modules/inventory/materials/mutations";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  MaterialFormSchema,
  materialToFormValues,
  type MaterialFormValues,
} from "@/modules/inventory/materials/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

export function MaterialRecordScreen() {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canUpdateCategory = can(categoryPermissions.update);
  const { canCreate } = useCrudPermissions(materialPermissions);
  const createMaterial = useCreateMaterial();
  const updateMicron = useUpdateMicron();
  const [formError, setFormError] = useState<string | null>(null);

  const readOnly = !canCreate;
  const canSubmit = canCreate;

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(MaterialFormSchema),
    defaultValues: materialToFormValues(null),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: MaterialFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      const micronPrice =
        canViewPrice && canUpdateCategory ? toMicronPricePayload(values) : null;

      const created = await createMaterial.mutateAsync(toCreatePayload(values));
      if (micronPrice && values.parent_id) {
        await updateMicron.mutateAsync({ id: values.parent_id, values: micronPrice });
      }
      toast.success("Material created");
      router.push(`${materialRoutes.view(created.id)}?micron=${values.parent_id}`);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createMaterial.isPending || updateMicron.isPending;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title="New material"
        subtitle="Create a SKU under a product micron with optional opening stock"
        listHref={materialRoutes.list}
        viewHref={materialRoutes.list}
        mode="view"
      />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <MaterialFormFields control={form.control} readOnly={readOnly} isCreate />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>Create material</SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
