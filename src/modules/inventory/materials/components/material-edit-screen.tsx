"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  sizeLineToCreatePayload,
  sizeLineToUpdatePayload,
  stockQuantity,
} from "@/modules/inventory/materials/api";
import { MaterialEditFormFields } from "@/modules/inventory/materials/components/material-edit-form-fields";
import {
  useCreateMaterial,
  useDeleteMaterial,
  useUpdateMaterial,
} from "@/modules/inventory/materials/mutations";
import { useCreateMovement } from "@/modules/inventory/movements/mutations";
import { useUpdateMicron } from "@/modules/inventory/microns/mutations";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import { useAllMaterials, useMaterial } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  MaterialEditFormSchema,
  buildExistingMaterialKeyMap,
  buildMaterialEditFormValues,
  consolidateMaterialSizeLines,
  materialSizeLineDirectStockIncrease,
  materialSizeLineHasStockIn,
  materialSizeLineKey,
  materialSizeLineStockOmitFlags,
  micronPricePayloadsFromSizeLines,
  stockInMovementPriceFields,
  resolveMaterialEditSizeLines,
  uniqueMicronIdsFromSizeLines,
  type MaterialEditFormValues,
} from "@/modules/inventory/materials/schemas";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";
import { useCan } from "@/shared/providers/session-provider";
import { useAllUnits } from "@/modules/inventory/units/queries";

export function MaterialEditScreen({ materialId }: { materialId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canUpdateCategory = can(categoryPermissions.update);
  const { canUpdate, canDelete } = useCrudPermissions(materialPermissions);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const updateMicron = useUpdateMicron();
  const createMovement = useCreateMovement();
  const [formError, setFormError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  const materialQuery = useMaterial(materialId);
  const material = materialQuery.data;
  const productId = material?.product_id ?? "";
  const micronFromQuery = searchParams.get("micron");
  const micronId = micronFromQuery || material?.micron_id || "";

  const micronsQuery = useAllMicrons(productId || undefined, Boolean(productId));
  const selectedMicron = micronsQuery.data?.find((item) => item.id === micronId);

  const variantsQuery = useAllMaterials(
    { product_id: productId || undefined, is_active: true },
    Boolean(productId),
  );
  const unitsQuery = useAllUnits();
  const units = unitsQuery.data ?? [];
  const defaultSizeUnitId = units.find((item) => item.code === "mm")?.id ?? "";
  const defaultQuantityUnitId = units.find((item) => item.code === "kg")?.id ?? "";

  const formValuesReady =
    Boolean(material) && variantsQuery.isSuccess && micronsQuery.isSuccess;

  const form = useForm<MaterialEditFormValues>({
    resolver: zodResolver(MaterialEditFormSchema),
    defaultValues: buildMaterialEditFormValues([], {
      productId: "",
      defaultMicronId: "",
      defaultSizeUnitId,
      defaultQuantityUnitId,
    }),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const editFormValues = useMemo(
    () =>
      formValuesReady && material
        ? buildMaterialEditFormValues(variantsQuery.data ?? [], {
            productId: material.product_id,
            companyId: material.company_id ?? undefined,
            defaultMicronId: micronId || material.micron_id,
            defaultSizeUnitId,
            defaultQuantityUnitId,
          })
        : undefined,
    [
      formValuesReady,
      material,
      variantsQuery.data,
      micronId,
      defaultSizeUnitId,
      defaultQuantityUnitId,
    ],
  );

  useFormResetOnRouteEntry(
    form,
    editFormValues,
    formValuesReady,
    `${materialId}|${micronId}`,
  );

  useDirtyFormGuard(canUpdate && form.formState.isDirty);

  const addSizeHandled = useRef(false);
  useEffect(() => {
    addSizeHandled.current = false;
  }, [productId]);

  useEffect(() => {
    if (
      addSizeHandled.current ||
      searchParams.get("addSize") !== "1" ||
      !canUpdate ||
      !defaultSizeUnitId ||
      !formValuesReady
    ) {
      return;
    }
    addSizeHandled.current = true;
    const lines = form.getValues("size_lines");
    const hasEmpty = lines.some((line) => !line.size.trim() && !line.id);
    if (!hasEmpty) {
      form.setValue(
        "size_lines",
        [
          ...lines,
          {
            parent_id: micronId,
            price_per_unit: selectedMicron?.price_per_unit ?? "",
            price_unit_id: selectedMicron?.price_unit_id ?? "",
            size: "0",
            size_unit_id: defaultSizeUnitId,
            quantity_available: "0",
            unit_id: defaultQuantityUnitId,
            opening_rolls: "0",
            stock_in_rolls: "0",
            stock_in_kg: "0",
            is_active: true,
          },
        ],
        {
          shouldDirty: true,
        },
      );
    }
  }, [
    searchParams,
    canUpdate,
    defaultSizeUnitId,
    defaultQuantityUnitId,
    form,
    formValuesReady,
    micronId,
    selectedMicron?.price_per_unit,
    selectedMicron?.price_unit_id,
  ]);

  async function onSubmit(values: MaterialEditFormValues) {
    if (!canUpdate || submitInFlight.current) {
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
      let lastId = materialId;
      let lastMicronId = micronIds[0] ?? micronId;

      const existingByKey = buildExistingMaterialKeyMap(
        variantsQuery.data ?? [],
        values.product_id,
      );
      const { lines: sizeLines, removedIds } = consolidateMaterialSizeLines(
        resolvedLines,
        existingByKey,
      );
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
          lastId = line.id;
          lastMicronId = line.parent_id;
        } else {
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
      }

      if (canDelete) {
        for (const duplicateId of removedIds) {
          await deleteMaterial.mutateAsync(duplicateId);
        }
      }

      for (const { id, ...micronValues } of micronPrices) {
        await updateMicron.mutateAsync({ id, values: micronValues });
      }

      toast.success("Material updated");
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
    deleteMaterial.isPending ||
    createMovement.isPending ||
    updateMicron.isPending ||
    form.formState.isSubmitting;

  if (
    materialQuery.isLoading ||
    variantsQuery.isLoading ||
    micronsQuery.isLoading ||
    !formValuesReady
  ) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (materialQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(materialQuery.error)}
        onRetry={() => materialQuery.refetch()}
      />
    );
  }

  if (!material) {
    return <p className="text-muted-foreground text-sm">Material not found.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={material.product_name}
        subtitle="Edit product, sizes, and micron prices per line"
        listHref={materialRoutes.list}
        viewHref={`${materialRoutes.view(materialId)}?micron=${micronId}`}
        mode="edit"
      />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={
                canUpdate
                  ? form.handleSubmit(onSubmit, () => {
                      toast.error("Fix the highlighted fields before saving.");
                    })
                  : (event) => event.preventDefault()
              }
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <MaterialEditFormFields
                control={form.control}
                readOnly={!canUpdate}
                editProductId={productId || undefined}
              />
              {canUpdate ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>Save changes</SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
