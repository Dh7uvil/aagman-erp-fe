"use client";

import { FolderPlus, History, MinusCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {useMemo, useState, type ReactNode, useCallback} from "react";
import { toast } from "sonner";

import { formatPricePerUnit } from "@/modules/inventory/format";
import { AdhesiveBrandQuickCreateDialog } from "@/modules/inventory/adhesives/components/adhesive-brand-quick-create-dialog";
import { adhesivesApi } from "@/modules/inventory/adhesives/api";
import { useDeleteAdhesiveSheet, useUpdateAdhesiveSheet } from "@/modules/inventory/adhesives/mutations";
import { useAdhesives } from "@/modules/inventory/adhesives/queries";
import { adhesiveRoutes } from "@/modules/inventory/adhesives/routes";
import { adhesiveBrandRoutes } from "@/modules/inventory/adhesive-brands/routes";
import {
  adhesiveLineRecordToUpsert,
  type AdhesiveLineListItem,
} from "@/modules/inventory/adhesives/schemas";
import { adhesivePermissions, adhesivePricePermissions } from "@/modules/inventory/permissions";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { ListView } from "@/shared/components/data-table/list-view";
import { ListViewToolbarControls } from "@/shared/components/data-table/list-view-toggle";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import type { SortFieldOption } from "@/shared/components/data-table/sort";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  stockOutButtonClassName,
  stockOutIconButtonClassName,
} from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { Button } from "@/shared/components/ui/button";
import { useListView } from "@/shared/hooks/use-list-view";
import { useReportExport } from "@/shared/hooks/use-report-export";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { historyHref } from "@/shared/lib/history";
import { formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const SORT_FIELDS: SortFieldOption[] = [
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

type DeleteTarget = {
  adhesiveSheetId: string;
  lineId: string;
  companyName: string;
  lineLabel: string;
};

export function AdhesivesScreen() {
  const router = useRouter();
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(adhesivePermissions);
  const canViewHistory = can(adhesivePermissions.history);
  const canViewPrice = can(adhesivePricePermissions.read);
  const deleteSheet = useDeleteAdhesiveSheet();
  const updateSheet = useUpdateAdhesiveSheet();
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const companyId = filters.company_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];

  const adhesivesQuery = useAdhesives({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canViewHistory);

  function sheetHref(row: AdhesiveLineListItem) {
    return adhesiveRoutes.view(row.adhesive_sheet_id);
  }

  function stockOutHref(row: AdhesiveLineListItem) {
    return adhesiveRoutes.stockOut({
      company_id: row.company_id,
      adhesive_sheet_id: row.adhesive_sheet_id,
      adhesive_line_id: row.id,
    });
  }

  function rowExtraActions(row: AdhesiveLineListItem): ReactNode | undefined {
    const actions: ReactNode[] = [];
    if (canUpdate) {
      actions.push(
        <Button
          key="stock-out"
          type="button"
          variant="ghost"
          size="icon-sm"
          className={stockOutIconButtonClassName}
          aria-label="Stock out"
          asChild
        >
          <Link href={stockOutHref(row)}>
            <MinusCircle className="size-3.5" />
          </Link>
        </Button>,
      );
    }
    if (canViewHistory) {
      actions.push(
        <Button key="history" type="button" variant="ghost" size="icon-sm" aria-label="History" asChild>
          <Link href={historyHref("adhesive-lines", row.id, `${row.brand_name} · ${row.code}`)}>
            <History className="size-3.5" />
          </Link>
        </Button>,
      );
    }
    if (actions.length === 0) {
      return undefined;
    }
    return <div className="flex items-center gap-0.5">{actions}</div>;
  }

  const rows = adhesivesQuery.data?.data ?? [];
  const meta = adhesivesQuery.data?.meta;
  const hasActiveFilters = Boolean(search || sortBy || companyId);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      const sheet = await adhesivesApi.get(deleting.adhesiveSheetId);
      const remaining = sheet.lines.filter((line) => line.id !== deleting.lineId);
      if (remaining.length === 0) {
        await deleteSheet.mutateAsync(deleting.adhesiveSheetId);
        toast.success("Adhesive sheet deleted");
      } else {
        await updateSheet.mutateAsync({
          id: deleting.adhesiveSheetId,
          values: {
            lines: remaining.map((line) => adhesiveLineRecordToUpsert(line, canViewPrice)),
          },
        });
        toast.success("Adhesive line removed");
      }
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<AdhesiveLineListItem>> => {
    const cols: Array<DataTableColumn<AdhesiveLineListItem>> = [
      {
        id: "company",
        header: "Company",
        cell: (row) =>
          canRead ? (
            <Link href={sheetHref(row)} className="font-medium hover:underline">
              {row.company_name}
            </Link>
          ) : (
            <span className="font-medium">{row.company_name}</span>
          ),
      },
      {
        id: "brand",
        header: "Brand",
        cell: (row) =>
          canRead ? (
            <Link href={adhesiveBrandRoutes.view(row.brand_id)} className="hover:underline">
              {row.brand_name}
            </Link>
          ) : (
            row.brand_name
          ),
      },
      {
        id: "code",
        header: "Code",
        cell: (row) => row.code,
      },
      {
        id: "drum_count",
        header: "No. of drums",
        numeric: true,
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
        numeric: true,
        cell: (row) => `${formatDecimal(row.total_qty)} ${row.drum_unit_code}`,
      },
    ];
    if (canViewPrice) {
      cols.push(
        {
          id: "adhesive_rate",
          header: "Adhesive rate",
          defaultVisible: false,
          cell: (row) => formatPricePerUnit(row.adhesive_rate, row.drum_unit_code),
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
        numeric: true,
          defaultVisible: false,
          cell: (row) =>
            row.total_rate != null ? formatDecimal(row.total_rate) : "—",
        },
      );
    }
    cols.push(...auditTimestampColumns<AdhesiveLineListItem>());
    cols.push(
      ...actionsColumn<AdhesiveLineListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={`${row.company_name} ${row.brand_name}`}
          onView={canRead ? () => router.push(sheetHref(row)) : undefined}
          onEdit={canUpdate ? () => router.push(adhesiveRoutes.edit(row.adhesive_sheet_id)) : undefined}
          onDelete={
            canDelete
              ? () =>
                  setDeleting({
                    adhesiveSheetId: row.adhesive_sheet_id,
                    lineId: row.id,
                    companyName: row.company_name,
                    lineLabel: `${row.brand_name} · ${row.code}`,
                  })
              : undefined
          }
          extra={rowExtraActions(row)}
        />
      )),
    );
    return cols;
  }, [canDelete, canRead, canUpdate, canViewHistory, canViewPrice, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.adhesives", columnDefs);
  const listView = useListView("inventory.adhesives");
  const buildExportParams = useCallback(() => ({
    search: search ?? undefined,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
  }), [companyId, sortBy, sort_order, search]);

  const { exportDialog } = useReportExport({
    tableKey: "inventory.adhesives",
    columnDefs,
    exportPath: "/inventory/adhesives/export",
    buildParams: buildExportParams,
    filteredRowCount: meta?.total,
    enabled: canRead,
  });


  return (
    <ListPage>
      <PageHeader
        title="Adhesives"
        subtitle="Company adhesive inventory"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate ? (
              <Button variant="outline" className={stockOutButtonClassName} asChild>
                <Link href={adhesiveRoutes.stockOut()}>
                  <MinusCircle className="size-4" />
                  Stock out
                </Link>
              </Button>
            ) : null}
            {canCreate ? (
              <Button variant="outline" type="button" onClick={() => setBrandDialogOpen(true)}>
                <FolderPlus className="size-4" />
                Add brand
              </Button>
            ) : null}
            {canCreate ? (
              <Button asChild>
                <Link href={adhesiveRoutes.new}>
                  <Plus className="size-4" />
                  Add adhesive
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search company, brand, or code…"
        />
        <FilterSelect
          label="Company"
          className="w-full sm:w-48"
          placeholder="All companies"
          value={companyId ?? ALL}
          onValueChange={(value) =>
            setParams({
              filters: { company_id: value === ALL ? null : value },
            })
          }
          options={[
            { value: ALL, label: "All companies" },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SortDialog fields={SORT_FIELDS} sortBy={sortBy} sortOrder={sort_order} onApply={setParams} />
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} exportDialog={exportDialog} />
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({ search: null, sort_by: null, sort_order: null, filters: { company_id: null } })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={rows}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => `${row.company_name} · ${row.brand_name} · ${row.code}`}
        onRowClick={canRead ? (row) => router.push(sheetHref(row)) : undefined}
        isLoading={adhesivesQuery.isLoading}
        isError={adhesivesQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(adhesivesQuery.error)}
            onRetry={() => adhesivesQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No adhesive lines yet." />}
        columnTotals={meta?.column_totals ?? null}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <AdhesiveBrandQuickCreateDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Remove adhesive line"
        description={
          deleting
            ? `Remove "${deleting.lineLabel}" for ${deleting.companyName}? Other lines on this company sheet are kept. If this is the only line, the whole sheet is deleted. Lines with stock must be stocked out first.`
            : undefined
        }
        confirmLabel="Remove line"
        pending={deleteSheet.isPending || updateSheet.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
