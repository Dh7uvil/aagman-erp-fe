"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  buildInkStockOutFormSchema,
  type InkStockOutFormValues,
} from "@/modules/inventory/inks/components/ink-stock-out-schema";
import { useInkStockOut } from "@/modules/inventory/inks/mutations";
import { useInk, useInks } from "@/modules/inventory/inks/queries";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import { getErrorMessage } from "@/shared/api/errors";
import { InkStockOutFields } from "@/modules/inventory/inks/components/ink-stock-out-fields";
import { SearchableSelect } from "@/shared/components/form/searchable-select";
import { PageHeader } from "@/shared/components/layout/page-header";
import { BackLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useCompanies } from "@/modules/users-management/companies/queries";

function paramOrEmpty(value: string | null) {
  return value?.trim() ?? "";
}

export function InkStockOutScreen() {
  const searchParams = useSearchParams();
  const stockOut = useInkStockOut();
  const [formError, setFormError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");

  useEffect(() => {
    if (hydrated) {
      return;
    }
    setCompanyId(paramOrEmpty(searchParams.get("company_id")));
    setSheetId(paramOrEmpty(searchParams.get("ink_sheet_id")));
    setHydrated(true);
  }, [hydrated, searchParams]);

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const sheetsQuery = useInks({
    page: 1,
    page_size: 200,
    company_id: companyId || undefined,
  });
  const companyLines = useMemo(() => {
    const rows = sheetsQuery.data?.data ?? [];
    if (!companyId) {
      return rows;
    }
    return rows.filter((row) => row.company_id === companyId);
  }, [sheetsQuery.data?.data, companyId]);

  const brandOptions = useMemo(() => {
    const byBrand = new Map<string, { brand_id: string; brand_name: string; ink_sheet_id: string }>();
    for (const row of companyLines) {
      if (!byBrand.has(row.brand_id)) {
        byBrand.set(row.brand_id, {
          brand_id: row.brand_id,
          brand_name: row.brand_name,
          ink_sheet_id: row.ink_sheet_id,
        });
      }
    }
    return [...byBrand.values()].sort((a, b) => a.brand_name.localeCompare(b.brand_name));
  }, [companyLines]);

  const defaultLineId = paramOrEmpty(searchParams.get("ink_line_id"));

  useEffect(() => {
    if (!defaultLineId || companyLines.length === 0) {
      return;
    }
    const row = companyLines.find((line) => line.id === defaultLineId);
    if (!row) {
      return;
    }
    setSelectedBrandId(row.brand_id);
    setSheetId(row.ink_sheet_id);
  }, [companyLines, defaultLineId]);

  const sheetQuery = useInk(sheetId || null);
  const sheet = sheetQuery.data;
  const lines = sheet?.lines ?? [];

  const brandLines = useMemo(() => {
    if (!selectedBrandId) {
      return [];
    }
    return lines.filter((line) => line.brand_id === selectedBrandId);
  }, [lines, selectedBrandId]);

  const schema = useMemo(() => buildInkStockOutFormSchema(brandLines), [brandLines]);

  const form = useForm<InkStockOutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ink_line_id: "",
      drums: "0",
      quantity: "0",
      note: "",
    },
  });

  useEffect(() => {
    if (!sheet || brandLines.length === 0) {
      return;
    }
    const preferredLineId =
      defaultLineId && brandLines.some((l) => l.id === defaultLineId)
        ? defaultLineId
        : (brandLines[0]?.id ?? "");
    form.reset({
      ink_line_id: preferredLineId,
      drums: "0",
      quantity: "0",
      note: "",
    });
  }, [sheet, brandLines, defaultLineId, form]);

  async function onSubmit(values: InkStockOutFormValues) {
    if (!sheetId) {
      return;
    }
    setFormError(null);
    try {
      await stockOut.mutateAsync({
        sheetId,
        values: {
          ink_line_id: values.ink_line_id,
          drums: values.drums.trim() || "0",
          quantity: values.quantity.trim() || "0",
          note: values.note?.trim() || null,
        },
      });
      toast.success("Stock out recorded");
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ink stock out"
        subtitle="Remove drums or quantity from an ink line."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={inkRoutes.list}>
              <BackLabel />
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select company and brand</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Company</label>
            <SearchableSelect
              asFormControl={false}
              value={companyId}
              onValueChange={(value) => {
                setCompanyId(value);
                setSheetId("");
                setSelectedBrandId("");
              }}
              placeholder="Select company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Brand</label>
            <SearchableSelect
              asFormControl={false}
              value={selectedBrandId}
              onValueChange={(brandId) => {
                const option = brandOptions.find((b) => b.brand_id === brandId);
                setSelectedBrandId(brandId);
                setSheetId(option?.ink_sheet_id ?? "");
              }}
              disabled={!companyId || brandOptions.length === 0}
              placeholder={companyId ? "Select brand" : "Choose company first"}
              options={brandOptions.map((b) => ({
                value: b.brand_id,
                label: b.brand_name,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {sheetQuery.isLoading && sheetId ? <Skeleton className="h-64 w-full" /> : null}

      {sheet && selectedBrandId && brandLines.length > 0 ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Quantities to remove</CardTitle>
                <CardDescription>
                  Enter drums and/or quantity to stock out. At least one must be greater than zero.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InkStockOutFields
                  lines={brandLines}
                  form={form}
                  formError={formError}
                  pending={stockOut.isPending}
                  onClose={() => undefined}
                  onSubmitForm={onSubmit}
                  layout="page"
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      ) : sheetId && sheet && selectedBrandId && brandLines.length === 0 ? (
        <p className="text-muted-foreground text-sm">No lines found for this brand.</p>
      ) : null}
    </div>
  );
}
