"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import { stockQuantity } from "@/modules/inventory/materials/api";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import {
  buildStockOutFormSchema,
  type StockOutFormValues,
} from "@/modules/inventory/materials/components/material-stock-out-schema";
import { useAllMaterials } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import { useCreateMovement } from "@/modules/inventory/movements/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { PageHeader } from "@/shared/components/layout/page-header";
import { BackLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDecimal } from "@/shared/lib/format";
import { useCompanies } from "@/modules/users-management/companies/queries";

function paramOrEmpty(value: string | null) {
  return value?.trim() ?? "";
}

export function MaterialStockOutScreen() {
  const searchParams = useSearchParams();
  const createMovement = useCreateMovement();
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [companyId, setCompanyId] = useState("");
  const [productId, setProductId] = useState("");
  const [micronId, setMicronId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");

  useEffect(() => {
    if (hydrated) {
      return;
    }
    setCompanyId(paramOrEmpty(searchParams.get("company_id")));
    setProductId(paramOrEmpty(searchParams.get("product_id")));
    setMicronId(paramOrEmpty(searchParams.get("parent_id")));
    setSelectedMaterialId(paramOrEmpty(searchParams.get("material_id")));
    setHydrated(true);
  }, [hydrated, searchParams]);

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const categoriesQuery = useAllCategories(companyId || undefined, Boolean(companyId));
  const categories = categoriesQuery.data ?? [];
  const micronsQuery = useAllMicrons(productId || undefined, Boolean(productId));
  const microns = micronsQuery.data ?? [];
  const widthsQuery = useAllMaterials(
    { parent_id: micronId, is_active: true },
    Boolean(micronId),
  );
  const activeMaterials = useMemo(
    () => (widthsQuery.data ?? []).filter((row) => row.is_active),
    [widthsQuery.data],
  );

  const selectedMaterial =
    activeMaterials.find((row) => row.id === selectedMaterialId) ?? activeMaterials[0];

  const schema = useMemo(() => buildStockOutFormSchema(activeMaterials), [activeMaterials]);
  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { material_id: "", rolls: "", kilograms: "", note: "" },
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    form.reset({
      material_id: selectedMaterialId,
      rolls: "",
      kilograms: "",
      note: "",
    });
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps -- initial hydrate only

  useEffect(() => {
    if (!micronId || widthsQuery.isLoading) {
      return;
    }
    if (activeMaterials.length === 0) {
      setSelectedMaterialId("");
      form.setValue("material_id", "");
      return;
    }
    const validId =
      selectedMaterialId && activeMaterials.some((row) => row.id === selectedMaterialId)
        ? selectedMaterialId
        : activeMaterials[0]!.id;
    if (validId !== selectedMaterialId) {
      setSelectedMaterialId(validId);
    }
    form.setValue("material_id", validId, { shouldValidate: false });
  }, [
    activeMaterials,
    form,
    micronId,
    selectedMaterialId,
    widthsQuery.isLoading,
  ]);

  async function onSubmit(values: StockOutFormValues) {
    if (!selectedMaterial) {
      setFormError("Select a width to stock out");
      return;
    }
    setFormError(null);
    try {
      await createMovement.mutateAsync({
        category_id: selectedMaterial.id,
        movement_date: new Date().toISOString().slice(0, 10),
        direction: "OUT",
        rolls: stockQuantity(values.rolls),
        kilograms: stockQuantity(values.kilograms),
        note: values.note?.trim() ? values.note.trim() : "Stock out",
      });
      toast.success("Stock out recorded — enter the next or change width");
      form.reset({
        material_id: selectedMaterial.id,
        rolls: "",
        kilograms: "",
        note: "",
      });
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Stock out"
        subtitle="Remove rolls and kg from on-hand stock. This creates a stock-out movement in history."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={materialRoutes.list}>
              <BackLabel>Back to materials</BackLabel>
            </Link>
          </Button>
        }
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Select material</CardTitle>
              <CardDescription>
                Choose company, product, micron, and width. Quantities below apply to the selected
                width only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="stock-out-company">Company</Label>
                <Select
                  value={companyId || undefined}
                  onValueChange={(value) => {
                    setCompanyId(value);
                    setProductId("");
                    setMicronId("");
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                >
                  <SelectTrigger id="stock-out-company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="stock-out-product">Product</Label>
                <Select
                  value={productId || undefined}
                  disabled={!companyId}
                  onValueChange={(value) => {
                    setProductId(value);
                    setMicronId("");
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                >
                  <SelectTrigger id="stock-out-product">
                    <SelectValue
                      placeholder={companyId ? "Select product" : "Select company first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="stock-out-micron">Micron</Label>
                <Select
                  value={micronId || undefined}
                  disabled={!productId}
                  onValueChange={(value) => {
                    setMicronId(value);
                    setSelectedMaterialId("");
                    form.setValue("material_id", "");
                  }}
                >
                  <SelectTrigger id="stock-out-micron">
                    <SelectValue
                      placeholder={productId ? "Select micron" : "Select product first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {microns.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="stock-out-width">Width</Label>
                {micronId && widthsQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <FormField
                    control={form.control}
                    name="material_id"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <Select
                          value={field.value || undefined}
                          disabled={!micronId || activeMaterials.length === 0}
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedMaterialId(value);
                            form.clearErrors(["rolls", "kilograms"]);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger id="stock-out-width">
                              <SelectValue
                                placeholder={
                                  !micronId
                                    ? "Select micron first"
                                    : activeMaterials.length === 0
                                      ? "No widths for this micron"
                                      : "Select width"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeMaterials.map((row) => (
                              <SelectItem key={row.id} value={row.id}>
                                {row.size_label || formatDecimal(row.size)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {selectedMaterial ? (
                <p className="text-foreground sm:col-span-2 text-sm font-bold tabular-nums sm:text-base">
                  On hand: {formatDecimal(selectedMaterial.rolls_on_hand)} rolls ·{" "}
                  {formatDecimal(selectedMaterial.total_kg)}{" "}
                  {selectedMaterial.unit_code || "kg"}
                </p>
              ) : micronId && !widthsQuery.isLoading && activeMaterials.length === 0 ? (
                <p className="text-muted-foreground sm:col-span-2 text-sm">
                  No active widths stocked for this micron. Add a size from the product view first.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quantities to remove</CardTitle>
              <CardDescription>
                Enter rolls and/or kg to stock out. At least one must be greater than zero.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rolls"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rolls out</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder="0"
                          autoComplete="off"
                          disabled={!selectedMaterial}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kilograms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kg out</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder="0"
                          autoComplete="off"
                          disabled={!selectedMaterial}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="e.g. Issued to production"
                        className="resize-none"
                        disabled={!selectedMaterial}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <SubmitButton
                  isPending={createMovement.isPending}
                  disabled={!selectedMaterial}
                  variant="outline"
                  className={stockOutButtonClassName}
                >
                  Record stock out
                </SubmitButton>
                <Button type="button" variant="outline" asChild>
                  <Link href={materialRoutes.list}>Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
