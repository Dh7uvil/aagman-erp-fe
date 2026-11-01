"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  sizeLineToCreatePayload,
  sizeLineToUpdatePayload,
  stockQuantity,
} from "@/modules/inventory/materials/api";
import { MaterialEditFormFields } from "@/modules/inventory/materials/components/material-edit-form-fields";
import { useCreateMaterial, useUpdateMaterial } from "@/modules/inventory/materials/mutations";
import { useCreateMovement } from "@/modules/inventory/movements/mutations";
import { useUpdateMicron } from "@/modules/inventory/microns/mutations";
import { useAllMaterials } from "@/modules/inventory/materials/queries";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  MaterialCreateFormSchema,
  buildExistingMaterialKeyMap,
  consolidateMaterialSizeLines,
  emptyMaterialCreateFormValues,
  emptyMaterialSizeLine,
  materialSizeLineDirectStockIncrease,
  materialSizeLineHasStockIn,
  materialSizeLineKey,
  materialSizeLineStockOmitFlags,
  micronPricePayloadsFromSizeLines,
  stockInMovementPriceFields,
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
  const updateMaterial = useUpdateMaterial();
  const createMovement = useCreateMovement();
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

  const productId = useWatch({ control: form.control, name: "product_id" });
  const variantsQuery = useAllMaterials(
    { product_id: productId || undefined, is_active: true },
    Boolean(productId),
  );

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
      let persistedCount = 0;
      const existingByKey = buildExistingMaterialKeyMap(
        variantsQuery.data ?? [],
        values.product_id,
      );
      const { lines: sizeLines } = consolidateMaterialSizeLines(resolvedLines, existingByKey);
      const movementDate = new Date().toISOString().slice(0, 10);
      const stockBaselineById = new Map(
        (variantsQuery.data ?? []).map((row) => [
          row.id,
          {
            rollsOnHand: String(row.rolls_on_hand ?? "0"),
            totalKg: String(row.total_kg ?? "0"),
          },
        ]),
      );

      async function recordStockReceived(
        line: (typeof sizeLines)[number],
        rolls: string,
        kilograms: string,
      ) {
        if (!line.id) {
          return;
        }
        const rollQty = stockQuantity(rolls);
        const kgQty = stockQuantity(kilograms);
        if (Number(rollQty) === 0 && Number(kgQty) === 0) {
          return;
        }
        await createMovement.mutateAsync({
          category_id: line.id,
          movement_date: movementDate,
          direction: "IN",
          rolls: rollQty,
          kilograms: kgQty,
          note: "Stock received",
          ...stockInMovementPriceFields(line, canViewPrice),
        });
      }

      for (const line of sizeLines) {
        if (!line.id) {
          continue;
        }
        if (materialSizeLineHasStockIn(line)) {
          await recordStockReceived(line, line.stock_in_rolls, line.stock_in_kg);
        }
        const baseline = stockBaselineById.get(line.id);
        if (baseline) {
          const direct = materialSizeLineDirectStockIncrease(line, baseline);
          await recordStockReceived(line, direct.rolls, direct.kilograms);
        }
      }

      for (const line of sizeLines) {
        if (line.id) {
          const stockOmit = materialSizeLineStockOmitFlags(line);
          await updateMaterial.mutateAsync({
            id: line.id,
            values: sizeLineToUpdatePayload(line, stockOmit),
          });
          persistedCount += 1;
          lastId = line.id;
          lastMicronId = line.parent_id;
        } else {
          const created = await createMaterial.mutateAsync(sizeLineToCreatePayload(line));
          persistedCount += 1;
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
      }

      if (persistedCount === 0) {
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
    createMaterial.isPending ||
    updateMaterial.isPending ||
    createMovement.isPending ||
    updateMicron.isPending ||
    form.formState.isSubmitting;

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
