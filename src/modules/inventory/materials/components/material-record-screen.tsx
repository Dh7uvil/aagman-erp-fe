"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sizeLineToCreatePayload, toMicronPricePayload } from "@/modules/inventory/materials/api";
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
  emptyMaterialSizeLine,
  materialSizeLineKey,
  materialsToEditFormValues,
  resolveMaterialEditSizeLines,
  uniqueMicronIdsFromEditValues,
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
import { useCan } from "@/shared/providers/session-provider";

function micronPriceFromEditValues(values: MaterialEditFormValues, micronId: string) {
  return toMicronPricePayload({
    product_id: values.product_id,
    parent_id: micronId,
    size: "",
    size_unit_id: values.size_lines[0]?.size_unit_id ?? "",
    quantity_available: "0",
    unit_id: values.size_lines[0]?.unit_id ?? "",
    opening_rolls: "0",
    price_per_unit: values.price_per_unit,
    price_unit_id: values.price_unit_id,
    is_active: true,
  });
}

export function MaterialRecordScreen() {
  const router = useRouter();
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
    defaultValues: materialsToEditFormValues([], null),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

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
      const micronIds = uniqueMicronIdsFromEditValues(values);
      const micronPrice =
        canViewPrice && canUpdateCategory && micronIds.length === 1
          ? micronPriceFromEditValues(values, micronIds[0]!)
          : null;

      let lastId = "";
      let lastMicronId = micronIds[0] ?? "";
      const { lines: sizeLines } = consolidateMaterialSizeLines(resolvedLines);
      for (const line of sizeLines) {
        if (line.id) {
          lastId = line.id;
          lastMicronId = line.parent_id;
          continue;
        }
        const created = await createMaterial.mutateAsync(sizeLineToCreatePayload(line));
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

      if (micronPrice && micronIds.length === 1) {
        await updateMicron.mutateAsync({ id: micronIds[0]!, values: micronPrice });
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
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
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
