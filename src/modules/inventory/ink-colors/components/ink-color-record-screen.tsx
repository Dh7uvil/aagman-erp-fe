"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { InkColorFormFields } from "@/modules/inventory/ink-colors/components/ink-color-form-fields";
import { useCreateInkColor, useUpdateInkColor } from "@/modules/inventory/ink-colors/mutations";
import { useInkColor, useInkColorUsage } from "@/modules/inventory/ink-colors/queries";
import { inkColorRoutes } from "@/modules/inventory/ink-colors/routes";
import {
  InkColorFormSchema,
  hexCodeToApiValue,
  inkColorToFormValues,
  type InkColorCreateRequest,
  type InkColorFormValues,
  type InkColorUpdateRequest,
} from "@/modules/inventory/ink-colors/schemas";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { inkColorPermissions, inkPricePermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { ListView } from "@/shared/components/data-table/list-view";
import { DataTableError } from "@/shared/components/data-table/states";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { historyHref } from "@/shared/lib/history";
import { Form } from "@/shared/components/ui/form";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { formatDecimal } from "@/shared/lib/format";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useFormResetOnRouteEntry } from "@/shared/hooks/use-form-reset-on-route-entry";
import { useListView } from "@/shared/hooks/use-list-view";
import { useCan } from "@/shared/providers/session-provider";
import type { InkColorUsageLine } from "@/modules/inventory/ink-colors/schemas";

export type InkColorRecordMode = "create" | "view" | "edit";

export function InkColorRecordScreen({
  mode,
  colorId,
}: {
  mode: InkColorRecordMode;
  colorId?: string;
}) {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(inkPricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(inkColorPermissions);
  const canViewHistory = can(inkColorPermissions.history);
  const createInkColor = useCreateInkColor();
  const updateInkColor = useUpdateInkColor();
  const [formError, setFormError] = useState<string | null>(null);

  const colorQuery = useInkColor(mode === "create" ? null : (colorId ?? null));
  const color = colorQuery.data;
  const usageQuery = useInkColorUsage(colorId ?? null, mode === "view");
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const formValues =
    mode === "create" ? inkColorToFormValues(null) : color ? inkColorToFormValues(color) : undefined;
  const formValuesReady = mode === "create" || Boolean(color);

  const form = useForm<InkColorFormValues>({
    resolver: zodResolver(InkColorFormSchema),
    values: formValues,
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${colorId ?? "new"}`);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: InkColorFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    const hexCode = hexCodeToApiValue(values.hex_code);
    try {
      if (mode === "create") {
        const payload: InkColorCreateRequest = {
          name: values.name.trim(),
          hex_code: hexCode,
          is_active: values.is_active,
        };
        const created = await createInkColor.mutateAsync(payload);
        toast.success("Ink added to master");
        router.push(inkColorRoutes.view(created.id));
        return;
      }
      if (!colorId) {
        return;
      }
      const payload: InkColorUpdateRequest = {
        name: values.name.trim(),
        hex_code: hexCode,
        is_active: values.is_active,
      };
      await updateInkColor.mutateAsync({ id: colorId, values: payload });
      toast.success("Ink updated");
      router.push(inkColorRoutes.view(colorId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const usageColumnDefs = useMemo((): Array<DataTableColumn<InkColorUsageLine>> => {
    const cols: Array<DataTableColumn<InkColorUsageLine>> = [
      { id: "company", header: "Company", cell: (row) => row.company_name },
      { id: "brand", header: "Brand", cell: (row) => row.brand_name },
      {
        id: "drums",
        header: "Drums",
        cell: (row) => formatDecimal(row.drum_count),
      },
      {
        id: "per_drum",
        header: "Qty / drum",
        cell: (row) =>
          `${formatDecimal(row.drum_qty)} ${row.drum_unit_code}`,
      },
      {
        id: "total_qty",
        header: "Total qty",
        cell: (row) => `${formatDecimal(row.total_qty)} ${row.drum_unit_code}`,
      },
    ];
    if (canViewPrice) {
      cols.push({
        id: "ink_rate",
        header: "Ink rate",
        cell: (row) => formatPricePerUnit(row.ink_rate, row.drum_unit_code),
      });
      cols.push({
        id: "total_rate",
        header: "Total rate",
        cell: (row) =>
          row.total_rate != null ? formatDecimal(row.total_rate) : "—",
      });
    }
    cols.push({
      id: "sheet",
      header: "Ink sheet",
      cell: (row) => (
        <Link href={inkRoutes.view(row.ink_sheet_id)} className="text-primary hover:underline">
          View
        </Link>
      ),
    });
    return cols;
  }, [canViewPrice]);

  const { columns: usageColumns, colSpan: usageColSpan } = useTableColumns(
    "inventory.ink_color_usage",
    usageColumnDefs,
    { pinnedCount: 0 },
  );
  const usageListView = useListView("inventory.ink_color_usage");

  const pending = createInkColor.isPending || updateInkColor.isPending;

  if (mode !== "create" && colorQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && colorQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(colorQuery.error)}
        onRetry={() => colorQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !color) {
    return <p className="text-muted-foreground text-sm">Ink not found.</p>;
  }

  const title =
    mode === "create"
      ? "New ink"
      : mode === "edit"
        ? "Edit ink"
        : (color?.name ?? "Ink");

  const usage = usageQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={
          mode === "view"
            ? "View ink and where it is used on sheets"
            : mode === "edit"
              ? "Update color or hex"
              : "Add an ink to master"
        }
        listHref={inkColorRoutes.list}
        viewHref={colorId ? inkColorRoutes.view(colorId) : inkColorRoutes.list}
        editHref={colorId ? inkColorRoutes.edit(colorId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        {mode === "view" && colorId && canViewHistory ? (
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Ink</CardTitle>
            <HistoryHeaderButton href={historyHref("ink-colors", colorId, color?.name ?? null)} />
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && colorId && canViewHistory ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <InkColorFormFields control={form.control} readOnly={readOnly} />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Add ink" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      {mode === "view" && colorId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Usage across companies</CardTitle>
            <p className="text-muted-foreground shrink-0 text-sm">
              Total Companies with stock :{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {usageQuery.isLoading ? "…" : (usage?.companies_with_stock ?? "—")}
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <ListView
              columns={usageColumns}
              colSpan={usageColSpan}
              rows={usage?.lines ?? []}
              getRowKey={(row) => row.ink_line_id}
              getRowLabel={(row) => row.company_name}
              isLoading={usageQuery.isLoading}
              isError={usageQuery.isError}
              error={
                <DataTableError
                  message={getErrorMessage(usageQuery.error)}
                  onRetry={() => usageQuery.refetch()}
                />
              }
              empty={<p className="text-muted-foreground text-sm">This ink is not on any sheet yet.</p>}
              listView={usageListView}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
