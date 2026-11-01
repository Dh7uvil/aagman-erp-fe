"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sizeLineToCreatePayload } from "@/modules/inventory/materials/api";
import { MaterialEditFormFields } from "@/modules/inventory/materials/components/material-edit-form-fields";
import { useCreateMaterial } from "@/modules/inventory/materials/mutations";
import { useUpdateMicron } from "@/modules/inventory/microns/mutations";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  MaterialCreateFormSchema,
  consolidateMaterialSizeLines,
  emptyMaterialCreateFormValues,
  emptyMaterialSizeLine,
  materialSizeLineKey,
  micronPricePayloadsFromSizeLines,
  resolveMaterialEditSizeLines,
  uniqueMicronIdsFromSizeLines,
  type MaterialCreateFormValues,
  type MaterialEditFormValues,
} from "@/modules/inventory/materials/schemas";
import { useAllUnits } from "@/modules/inventory/units/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";
import { useCan } from "@/shared/providers/session-provider";

export function MaterialRecordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("reset") ?? "initial";
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canUpdateCategory = can(categoryPermissions.update);
  const { canCreate } = useCrudPermissions(materialPermissions);
  const createMaterial = useCreateMaterial();
  const updateMicron = useUpdateMicron();
  const [formError, setFormError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  const unitsQuery = useAllUnits();
  const units = unitsQuery.data ?? [];
  const defaultSizeUnitId = units.find((item) => item.code === "mm")?.id ?? "";
  const defaultQuantityUnitId = units.find((item) => item.code === "kg")?.id ?? "";

  const readOnly = !canCreate;
  const canSubmit = canCreate;

  const form = useForm<MaterialCreateFormValues>({
    resolver: zodResolver(MaterialCreateFormSchema),
    defaultValues: emptyMaterialCreateFormValues(),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const createFormValues = emptyMaterialCreateFormValues(
    defaultSizeUnitId,
    defaultQuantityUnitId,
  );

  useFormResetOnRouteEntry(
    form,
    createFormValues,
    Boolean(defaultSizeUnitId || defaultQuantityUnitId),
    resetToken,
  );

  useEffect(() => {
    setFormError(null);
    submitInFlight.current = false;
  }, [resetToken]);

  useEffect(() => {
    if (!defaultSizeUnitId && !defaultQuantityUnitId) {
      return;
    }
    const lines = form.getValues("size_lines");
    if (lines.length === 0) {
      form.setValue(
        "size_lines",
        [emptyMaterialSizeLine("", defaultSizeUnitId, defaultQuantityUnitId)],
        { shouldValidate: false },
      );
      return;
    }
    lines.forEach((line, index) => {
      if (!line.size_unit_id && defaultSizeUnitId) {
        form.setValue(`size_lines.${index}.size_unit_id`, defaultSizeUnitId, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
      if (!line.unit_id && defaultQuantityUnitId) {
        form.setValue(`size_lines.${index}.unit_id`, defaultQuantityUnitId, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
    });
  }, [defaultSizeUnitId, defaultQuantityUnitId, form]);

  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: MaterialEditFormValues) {
    if (!canSubmit || submitInFlight.current) {
      return;
    }
    submitInFlight.current = true;
    setFormError(null);
    try {
      const resolvedLines = resolveMaterialEditSizeLines(values);
      const micronIds = uniqueMicronIdsFromSizeLines(resolvedLines);
      const micronPrices =
        canViewPrice && canUpdateCategory
          ? micronPricePayloadsFromSizeLines(resolvedLines)
          : [];

      let lastId = "";
      let lastMicronId = micronIds[0] ?? "";
      let createdCount = 0;
      const { lines: sizeLines } = consolidateMaterialSizeLines(resolvedLines);
      for (const line of sizeLines) {
        if (line.id) {
          lastId = line.id;
          lastMicronId = line.parent_id;
          continue;
        }
        const created = await createMaterial.mutateAsync(sizeLineToCreatePayload(line));
        createdCount += 1;
        const key = materialSizeLineKey(line);
        values.size_lines.forEach((formLine, index) => {
          if (materialSizeLineKey(formLine) === key) {
            form.setValue(`size_lines.${index}.id`, created.id, {
              shouldDirty: false,
              shouldValidate: false,
            });
          }
        });
        lastId = created.id;
        lastMicronId = line.parent_id;
      }

      if (createdCount === 0) {
        setFormError("Enter at least one size with a micron before saving.");
        return;
      }

      for (const { id, ...micronValues } of micronPrices) {
        await updateMicron.mutateAsync({ id, values: micronValues });
      }
      toast.success("Material created");
      router.push(`${materialRoutes.view(lastId)}?micron=${lastMicronId}`);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    } finally {
      submitInFlight.current = false;
    }
  }

  const pending =
    createMaterial.isPending || updateMicron.isPending || form.formState.isSubmitting;

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
              onSubmit={
                canSubmit
                  ? form.handleSubmit(onSubmit, () => {
                      toast.error("Fix the highlighted fields before saving.");
                    })
                  : (event) => event.preventDefault()
              }
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <MaterialEditFormFields control={form.control} readOnly={readOnly} />
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
