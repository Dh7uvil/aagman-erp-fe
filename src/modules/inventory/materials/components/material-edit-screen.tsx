"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  sizeLineToCreatePayload,
  sizeLineToUpdatePayload,
  toMicronPricePayload,
} from "@/modules/inventory/materials/api";
import { MaterialEditFormFields } from "@/modules/inventory/materials/components/material-edit-form-fields";
import { useCreateMaterial, useUpdateMaterial } from "@/modules/inventory/materials/mutations";
import { useUpdateMicron } from "@/modules/inventory/microns/mutations";
import { useAllMaterials, useMaterial } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import {
  MaterialEditFormSchema,
  emptyMaterialSizeLine,
  materialsToEditFormValues,
  type MaterialEditFormValues,
  type MaterialSizeLineValues,
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
import { useCan } from "@/shared/providers/session-provider";
import { useAllUnits } from "@/modules/inventory/units/queries";

function micronPriceFromEditValues(values: MaterialEditFormValues) {
  return toMicronPricePayload({
    product_id: values.product_id,
    parent_id: values.parent_id,
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

function lineToUpdatePayload(values: MaterialEditFormValues, line: MaterialSizeLineValues) {
  return {
    parent_id: values.parent_id,
    ...sizeLineToUpdatePayload(line),
  };
}

function lineToCreatePayload(values: MaterialEditFormValues, line: MaterialSizeLineValues) {
  return sizeLineToCreatePayload(values.parent_id, line);
}

export function MaterialEditScreen({ materialId }: { materialId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canUpdateCategory = can(categoryPermissions.update);
  const { canUpdate } = useCrudPermissions(materialPermissions);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const updateMicron = useUpdateMicron();
  const [formError, setFormError] = useState<string | null>(null);

  const materialQuery = useMaterial(materialId);
  const material = materialQuery.data;
  const micronFromQuery = searchParams.get("micron");
  const micronId = micronFromQuery || material?.micron_id || "";

  const variantsQuery = useAllMaterials({ parent_id: micronId || undefined }, Boolean(micronId));
  const unitsQuery = useAllUnits();
  const units = unitsQuery.data ?? [];
  const defaultSizeUnitId = units.find((item) => item.code === "mm")?.id ?? "";
  const defaultQuantityUnitId = units.find((item) => item.code === "kg")?.id ?? "";

  const form = useForm<MaterialEditFormValues>({
    resolver: zodResolver(MaterialEditFormSchema),
    defaultValues: materialsToEditFormValues([], null),
    values:
      material && variantsQuery.data !== undefined
        ? (() => {
            const next = materialsToEditFormValues(variantsQuery.data, material);
            if (micronId) {
              next.parent_id = micronId;
            }
            if (next.size_lines.length === 0) {
              next.size_lines = [emptyMaterialSizeLine(defaultSizeUnitId, defaultQuantityUnitId)];
            }
            return next;
          })()
        : undefined,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useDirtyFormGuard(canUpdate && form.formState.isDirty);

  const addSizeHandled = useRef(false);
  useEffect(() => {
    if (
      addSizeHandled.current ||
      searchParams.get("addSize") !== "1" ||
      !canUpdate ||
      !defaultSizeUnitId ||
      !variantsQuery.data
    ) {
      return;
    }
    addSizeHandled.current = true;
    const lines = form.getValues("size_lines");
    const hasEmpty = lines.some((line) => !line.size.trim() && !line.id);
    if (!hasEmpty) {
      form.setValue(
        "size_lines",
        [...lines, emptyMaterialSizeLine(defaultSizeUnitId, defaultQuantityUnitId)],
        {
        shouldDirty: true,
      });
    }
  }, [searchParams, canUpdate, defaultSizeUnitId, defaultQuantityUnitId, form, variantsQuery.data]);

  async function onSubmit(values: MaterialEditFormValues) {
    if (!canUpdate) {
      return;
    }
    setFormError(null);
    try {
      const micronPrice =
        canViewPrice && canUpdateCategory ? micronPriceFromEditValues(values) : null;
      let lastId = materialId;

      for (const line of values.size_lines) {
        if (line.id) {
          await updateMaterial.mutateAsync({
            id: line.id,
            values: lineToUpdatePayload(values, line),
          });
          lastId = line.id;
        } else {
          const created = await createMaterial.mutateAsync(lineToCreatePayload(values, line));
          lastId = created.id;
        }
      }

      if (micronPrice && values.parent_id) {
        await updateMicron.mutateAsync({ id: values.parent_id, values: micronPrice });
      }

      toast.success("Material updated");
      router.push(`${materialRoutes.view(lastId)}?micron=${values.parent_id}`);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending =
    createMaterial.isPending || updateMaterial.isPending || updateMicron.isPending;

  if (materialQuery.isLoading || variantsQuery.isLoading) {
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
        subtitle="Edit product, micron, price, and sizes"
        listHref={materialRoutes.list}
        viewHref={`${materialRoutes.view(materialId)}?micron=${micronId}`}
        mode="edit"
      />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={canUpdate ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <MaterialEditFormFields control={form.control} readOnly={!canUpdate} />
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
