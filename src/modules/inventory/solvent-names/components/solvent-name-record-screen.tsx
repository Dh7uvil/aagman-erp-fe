"use client";

import { zodResolver } from "@/shared/lib/zod-resolver";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { SolventNameFormFields } from "@/modules/inventory/solvent-names/components/solvent-name-form-fields";
import { useCreateSolventName, useUpdateSolventName } from "@/modules/inventory/solvent-names/mutations";
import { useSolventName, useSolventNameUsage } from "@/modules/inventory/solvent-names/queries";
import { solventNameRoutes } from "@/modules/inventory/solvent-names/routes";
import {
  SolventNameFormSchema,
  solventNameToFormValues,
  type SolventNameCreateRequest,
  type SolventNameFormValues,
  type SolventNameUpdateRequest,
} from "@/modules/inventory/solvent-names/schemas";
import { useAllSolventBrands } from "@/modules/inventory/solvents/queries";
import { solventRoutes } from "@/modules/inventory/solvents/routes";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { solventNamePermissions, solventPricePermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { ListView } from "@/shared/components/data-table/list-view";
import { ListViewToolbarControls } from "@/shared/components/data-table/list-view-toggle";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
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
import type { SolventNameUsageLine } from "@/modules/inventory/solvent-names/schemas";

const ALL = "all";

export type SolventNameRecordMode = "create" | "view" | "edit";

function filterSolventNameUsageLines(
  lines: SolventNameUsageLine[],
  {
    search,
    companyId,
    brandId,
  }: { search: string; companyId?: string; brandId?: string },
): SolventNameUsageLine[] {
  const query = search.trim().toLowerCase();
  return lines.filter((row) => {
    if (companyId && row.company_id !== companyId) {
      return false;
    }
    if (brandId && row.brand_id !== brandId) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [row.company_name, row.brand_name, row.drum_unit_code].some((value) =>
      value.toLowerCase().includes(query),
    );
  });
}

export function SolventNameRecordScreen({
  mode,
  codeId,
}: {
  mode: SolventNameRecordMode;
  codeId?: string;
}) {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(solventPricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(solventNamePermissions);
  const canViewHistory = can(solventNamePermissions.history);
  const createSolventName = useCreateSolventName();
  const updateSolventName = useUpdateSolventName();
  const [formError, setFormError] = useState<string | null>(null);
  const [usageSearch, setUsageSearch] = useState("");
  const [usageCompanyId, setUsageCompanyId] = useState<string | undefined>();
  const [usageBrandId, setUsageBrandId] = useState<string | undefined>();

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const brandsQuery = useAllSolventBrands();
  const brands = brandsQuery.data ?? [];

  const codeQuery = useSolventName(mode === "create" ? null : (codeId ?? null));
  const code = codeQuery.data;
  const usageQuery = useSolventNameUsage(codeId ?? null, mode === "view");
  const readOnly = mode === "view" || (mode === "create" ? !canCreate : !canUpdate);
  const canSubmit = mode === "create" ? canCreate : mode === "edit" && canUpdate;

  const formValues =
    mode === "create" ? solventNameToFormValues(null) : code ? solventNameToFormValues(code) : undefined;
  const formValuesReady = mode === "create" || Boolean(code);

  const form = useForm<SolventNameFormValues>({
    resolver: zodResolver(SolventNameFormSchema),
    values: formValues,
  });

  useFormResetOnRouteEntry(form, formValues, formValuesReady, `${mode}-${codeId ?? "new"}`);
  useDirtyFormGuard(Boolean(canSubmit) && form.formState.isDirty);

  async function onSubmit(values: SolventNameFormValues) {
    if (!canSubmit) {
      return;
    }
    setFormError(null);
    try {
      if (mode === "create") {
        const payload: SolventNameCreateRequest = {
          name: values.name.trim(),
          is_active: values.is_active,
        };
        const created = await createSolventName.mutateAsync(payload);
        toast.success("Solvent name added to master");
        router.push(solventNameRoutes.view(created.id));
        return;
      }
      if (!codeId) {
        return;
      }
      const payload: SolventNameUpdateRequest = {
        name: values.name.trim(),
        is_active: values.is_active,
      };
      await updateSolventName.mutateAsync({ id: codeId, values: payload });
      toast.success("Solvent name updated");
      router.push(solventNameRoutes.view(codeId));
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      setFormError(getErrorMessage(error));
    }
  }

  const usageColumnDefs = useMemo((): Array<DataTableColumn<SolventNameUsageLine>> => {
    const cols: Array<DataTableColumn<SolventNameUsageLine>> = [
      { id: "company", header: "Company", cell: (row) => row.company_name },
      { id: "brand", header: "Brand", cell: (row) => row.brand_name },
      {
        id: "drum_count",
        header: "No. of drums",
        cell: (row) => formatDecimal(row.drum_count),
      },
      {
        id: "drum_qty",
        header: "Drum qty",
        defaultVisible: false,
        cell: (row) => formatDecimal(row.drum_qty),
      },
      {
        id: "unit",
        header: "Unit",
        defaultVisible: false,
        cell: (row) => row.drum_unit_code,
      },
      {
        id: "total_qty",
        header: "Total kg",
        cell: (row) => `${formatDecimal(row.total_qty)} ${row.drum_unit_code}`,
      },
    ];
    if (canViewPrice) {
      cols.push(
        {
          id: "solvent_rate",
          header: "Solvent rate",
          defaultVisible: false,
          cell: (row) => formatPricePerUnit(row.solvent_rate, row.drum_unit_code),
        },
        {
          id: "avg_price_per_unit",
          header: "Avg. rate",
          defaultVisible: false,
          cell: (row) =>
            formatPricePerUnit(row.avg_price_per_unit ?? null, row.price_unit_code ?? row.drum_unit_code),
        },
        {
          id: "total_rate",
          header: "Total rate",
          defaultVisible: false,
          cell: (row) =>
            row.total_rate != null ? formatDecimal(row.total_rate) : "—",
        },
      );
    }
    cols.push({
      id: "sheet",
      header: "Solvent sheet",
      cell: (row) => (
        <Link href={solventRoutes.view(row.solvent_sheet_id)} className="text-primary hover:underline">
          View
        </Link>
      ),
    });
    return cols;
  }, [canViewPrice]);

  const {
    columns: usageColumns,
    columnsDialog: usageColumnsDialog,
    colSpan: usageColSpan,
  } = useTableColumns("inventory.solvent_name_usage", usageColumnDefs, { pinnedCount: 0 });
  const usageListView = useListView("inventory.solvent_name_usage");

  const usageLines = useMemo(() => {
    const lines = usageQuery.data?.lines ?? [];
    return filterSolventNameUsageLines(lines, {
      search: usageSearch,
      companyId: usageCompanyId,
      brandId: usageBrandId,
    });
  }, [usageQuery.data?.lines, usageSearch, usageCompanyId, usageBrandId]);

  const usageHasActiveFilters = Boolean(usageSearch.trim() || usageCompanyId || usageBrandId);

  const pending = createSolventName.isPending || updateSolventName.isPending;

  if (mode !== "create" && codeQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (mode !== "create" && codeQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(codeQuery.error)}
        onRetry={() => codeQuery.refetch()}
      />
    );
  }

  if (mode !== "create" && !code) {
    return <p className="text-muted-foreground text-sm">Solvent name not found.</p>;
  }

  const title =
    mode === "create"
      ? "New solvent"
      : mode === "edit"
        ? "Edit solvent name"
        : (code?.name ?? "Solvent name");

  const usage = usageQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={
          mode === "view"
            ? "View code and where it is used on sheets"
            : mode === "edit"
              ? "Update code"
              : "Add a name to solvent master"
        }
        listHref={solventNameRoutes.list}
        viewHref={codeId ? solventNameRoutes.view(codeId) : solventNameRoutes.list}
        editHref={codeId ? solventNameRoutes.edit(codeId) : undefined}
        canUpdate={canUpdate}
        mode={mode === "edit" ? "edit" : "view"}
      />
      <Card>
        {mode === "view" && codeId && canViewHistory ? (
          <CardHeader className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base">Solvent name</CardTitle>
            <HistoryHeaderButton href={historyHref("solvent-names", codeId, code?.name ?? null)} />
          </CardHeader>
        ) : null}
        <CardContent className={mode === "view" && codeId && canViewHistory ? undefined : "pt-6"}>
          <Form {...form}>
            <form
              onSubmit={canSubmit ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()}
              className="flex w-full flex-col gap-4"
            >
              {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
              <SolventNameFormFields control={form.control} readOnly={readOnly} />
              {canSubmit ? (
                <div className="flex justify-end">
                  <SubmitButton isPending={pending}>
                    {mode === "create" ? "Add solvent" : "Save changes"}
                  </SubmitButton>
                </div>
              ) : null}
            </form>
          </Form>
        </CardContent>
      </Card>
      {mode === "view" && codeId ? (
        <Card>
          <CardHeader className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-4">
            <CardTitle className="min-w-0 text-base">Usage across companies</CardTitle>
            <p className="text-muted-foreground min-w-0 shrink-0 text-sm">
              Total Companies with stock :{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {usageQuery.isLoading ? "…" : (usage?.companies_with_stock ?? "—")}
              </span>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DataTableToolbar>
              <ListSearch
                value={usageSearch}
                onChange={setUsageSearch}
                placeholder="Search company or brand…"
              />
              <FilterSelect
                label="Company"
                className="w-full sm:w-48"
                placeholder="All companies"
                value={usageCompanyId ?? ALL}
                onValueChange={(value) =>
                  setUsageCompanyId(value === ALL ? undefined : value)
                }
                options={[
                  { value: ALL, label: "All companies" },
                  ...companies.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              <FilterSelect
                label="Brand"
                className="w-full sm:w-48"
                placeholder="All brands"
                value={usageBrandId ?? ALL}
                onValueChange={(value) => setUsageBrandId(value === ALL ? undefined : value)}
                options={[
                  { value: ALL, label: "All brands" },
                  ...brands.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
              <ListViewToolbarControls
                listView={usageListView}
                columnsDialog={usageColumnsDialog}
              />
              {usageHasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUsageSearch("");
                    setUsageCompanyId(undefined);
                    setUsageBrandId(undefined);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </DataTableToolbar>
            <ListView
              columns={usageColumns}
              colSpan={usageColSpan}
              rows={usageLines}
              getRowKey={(row) => row.solvent_line_id}
              getRowLabel={(row) => row.company_name}
              isLoading={usageQuery.isLoading}
              isError={usageQuery.isError}
              error={
                <DataTableError
                  message={getErrorMessage(usageQuery.error)}
                  onRetry={() => usageQuery.refetch()}
                />
              }
              empty={
                usageHasActiveFilters && (usage?.lines.length ?? 0) > 0 ? (
                  <p className="text-muted-foreground text-sm">No usage rows match your filters.</p>
                ) : (
                  <p className="text-muted-foreground text-sm">This code is not on any sheet yet.</p>
                )
              }
              listView={usageListView}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
