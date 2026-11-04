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
  const sheets = useMemo(() => {
    const bySheetId = new Map<
      string,
      { id: string; company_name: string; line_count: number }
    >();
    for (const row of sheetsQuery.data?.data ?? []) {
      const existing = bySheetId.get(row.ink_sheet_id);
      if (existing) {
        existing.line_count += 1;
      } else {
        bySheetId.set(row.ink_sheet_id, {
          id: row.ink_sheet_id,
          company_name: row.company_name,
          line_count: 1,
        });
      }
    }
    return [...bySheetId.values()];
  }, [sheetsQuery.data?.data]);
  const sheetQuery = useInk(sheetId || null);
  const sheet = sheetQuery.data;
  const lines = sheet?.lines ?? [];

  const defaultLineId = paramOrEmpty(searchParams.get("ink_line_id"));
  const schema = useMemo(() => buildInkStockOutFormSchema(lines), [lines]);

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
    if (!sheet) {
      return;
    }
    const lineId =
      defaultLineId && lines.some((l) => l.id === defaultLineId)
        ? defaultLineId
        : (lines[0]?.id ?? "");
    form.reset({
      ink_line_id: lineId,
      drums: "0",
      quantity: "0",
      note: "",
    });
  }, [sheet, lines, defaultLineId, form]);

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
          <CardTitle className="text-base">Select ink sheet</CardTitle>
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
              }}
              placeholder="Select company"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Ink sheet</label>
            <SearchableSelect
              asFormControl={false}
              value={sheetId}
              onValueChange={setSheetId}
              disabled={!companyId || sheets.length === 0}
              placeholder={companyId ? "Select sheet" : "Choose company first"}
              options={sheets.map((s) => ({
                value: s.id,
                label: `${s.company_name} (${s.line_count} lines)`,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {sheetQuery.isLoading && sheetId ? <Skeleton className="h-64 w-full" /> : null}

      {sheet && lines.length > 0 ? (
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
                  lines={lines}
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
      ) : sheetId && sheet && lines.length === 0 ? (
        <p className="text-muted-foreground text-sm">This sheet has no ink lines.</p>
      ) : null}
    </div>
  );
}
