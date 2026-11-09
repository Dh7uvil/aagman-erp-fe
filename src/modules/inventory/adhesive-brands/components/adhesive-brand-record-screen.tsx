"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdhesiveBrandFormFields } from "@/modules/inventory/adhesive-brands/components/adhesive-brand-form-fields";
import { adhesiveBrandRoutes } from "@/modules/inventory/adhesive-brands/routes";
import { useCreateAdhesiveBrand, useUpdateAdhesiveBrand } from "@/modules/inventory/adhesives/mutations";
import { useAdhesiveBrand } from "@/modules/inventory/adhesives/queries";
import {
  AdhesiveBrandFormSchema,
  adhesiveBrandToFormValues,
  type AdhesiveBrandCreateRequest,
  type AdhesiveBrandFormValues,
  type AdhesiveBrandUpdateRequest,
} from "@/modules/inventory/adhesives/schemas";
import { adhesivePermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { DataTableError } from "@/shared/components/data-table/states";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";

export type AdhesiveBrandRecordMode = "create" | "view" | "edit";

export function AdhesiveBrandRecordScreen({
  mode,
  brandId,
}: {
  mode: AdhesiveBrandRecordMode;
  brandId?: string;
}) {
  const router = useRouter();
  const { canCreate, canUpdate } = useCrudPermissions(adhesivePermissions);
  const createBrand = useCreateAdhesiveBrand();
  const updateBrand = useUpdateAdhesiveBrand();
  const [formError, setFormError] = useState<string | null>(null);

  const brandQuery = useAdhesiveBrand(mode === "create" ? null : (brandId ?? null));
  const brand = brandQuery.data;
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const formValues =
    mode === "create"
      ? adhesiveBrandToFormValues(null)
      : brand
        ? adhesiveBrandToFormValues(brand)
        : undefined;
  const formValuesReady = mode === "create" || Boolean(brand);

  const form = useForm<AdhesiveBrandFormValues>({
    resolver: zodResolver(AdhesiveBrandFormSchema),
    values: formValues,
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${brandId ?? "new"}`);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  const title = useMemo(() => {
    if (mode === "create") {
      return "New adhesive brand";
    }
    if (mode === "edit") {
      return "Edit adhesive brand";
    }
    return brand?.name ?? "Adhesive brand";
  }, [mode, brand?.name]);

  async function onSubmit(values: AdhesiveBrandFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const payload: AdhesiveBrandCreateRequest = {
          name: values.name.trim(),
          is_active: values.is_active,
        };
        const created = await createBrand.mutateAsync(payload);
        toast.success("Brand added to master");
        router.push(adhesiveBrandRoutes.view(created.id));
        return;
      }
      if (!brandId) {
        return;
      }
      const payload: AdhesiveBrandUpdateRequest = {
        name: values.name.trim(),
        is_active: values.is_active,
      };
      await updateBrand.mutateAsync({ id: brandId, values: payload });
      toast.success("Brand updated");
      router.push(adhesiveBrandRoutes.view(brandId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const pending = createBrand.isPending || updateBrand.isPending;

  if (mode !== "create" && brandQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (mode !== "create" && brandQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(brandQuery.error)}
        onRetry={() => brandQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !brand) {
    return <p className="text-muted-foreground text-sm">Brand not found.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={
          mode === "create"
            ? "Add a brand for adhesive sheet lines"
            : mode === "edit"
              ? "Update brand name or status"
              : "Adhesive brand master record"
        }
        listHref={adhesiveBrandRoutes.list}
        viewHref={brandId ? adhesiveBrandRoutes.view(brandId) : adhesiveBrandRoutes.list}
        editHref={brandId ? adhesiveBrandRoutes.edit(brandId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
              <AdhesiveBrandFormFields control={form.control} readOnly={readOnly} />
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Create brand" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
