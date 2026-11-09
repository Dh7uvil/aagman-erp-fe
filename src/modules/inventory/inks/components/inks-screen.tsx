"use client";

import { FolderPlus, History, MinusCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {useMemo, useState, type ReactNode, useCallback} from "react";
import { toast } from "sonner";

import { InkHexSwatch } from "@/modules/inventory/ink-colors/components/ink-hex-swatch";
import { formatPricePerUnit } from "@/modules/inventory/format";
import { BrandQuickCreateDialog } from "@/modules/inventory/inks/components/brand-quick-create-dialog";
import { inksApi } from "@/modules/inventory/inks/api";
import { useDeleteInkSheet, useUpdateInkSheet } from "@/modules/inventory/inks/mutations";
import { useInks } from "@/modules/inventory/inks/queries";
import { inkRoutes } from "@/modules/inventory/inks/routes";
import { inkBrandRoutes } from "@/modules/inventory/ink-brands/routes";
import { inkLineRecordToUpsert, type InkLineListItem } from "@/modules/inventory/inks/schemas";
import { inkPermissions, inkPricePermissions } from "@/modules/inventory/permissions";
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
  inkSheetId: string;
  lineId: string;
  companyName: string;
  lineLabel: string;
};

export function InksScreen() {
  const router = useRouter();
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(inkPermissions);
  const canViewHistory = can(inkPermissions.history);
  const canViewPrice = can(inkPricePermissions.read);
  const deleteSheet = useDeleteInkSheet();
  const updateSheet = useUpdateInkSheet();
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const companyId = filters.company_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];

  const inksQuery = useInks({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canViewHistory);

  function sheetHref(row: InkLineListItem) {
    return inkRoutes.view(row.ink_sheet_id);
  }

  function stockOutHref(row: InkLineListItem) {
    return inkRoutes.stockOut({
      company_id: row.company_id,
      ink_sheet_id: row.ink_sheet_id,
      ink_line_id: row.id,
    });
  }

  function rowExtraActions(row: InkLineListItem): ReactNode | undefined {
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
          <Link href={historyHref("ink-lines", row.id, `${row.brand_name} · ${row.color_name}`)}>
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

  const rows = inksQuery.data?.data ?? [];
  const meta = inksQuery.data?.meta;
  const hasActiveFilters = Boolean(search || sortBy || companyId);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      const sheet = await inksApi.get(deleting.inkSheetId);
      const remaining = sheet.lines.filter((line) => line.id !== deleting.lineId);
      if (remaining.length === 0) {
        await deleteSheet.mutateAsync(deleting.inkSheetId);
        toast.success("Ink sheet deleted");
      } else {
        await updateSheet.mutateAsync({
          id: deleting.inkSheetId,
          values: {
            lines: remaining.map((line) => inkLineRecordToUpsert(line, canViewPrice)),
          },
        });
        toast.success("Ink line removed");
      }
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<InkLineListItem>> => {
    const cols: Array<DataTableColumn<InkLineListItem>> = [
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
            <Link href={inkBrandRoutes.view(row.brand_id)} className="hover:underline">
              {row.brand_name}
            </Link>
          ) : (
            row.brand_name
          ),
      },
      {
        id: "color",
        header: "Color",
        cell: (row) => row.color_name,
      },
      {
        id: "hex",
        header: "Hex",
        defaultVisible: false,
        cell: (row) => <InkHexSwatch hex={row.hex_code} />,
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
          id: "ink_rate",
          header: "Ink rate",
          defaultVisible: false,
          cell: (row) => formatPricePerUnit(row.ink_rate, row.drum_unit_code),
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
    cols.push(...auditTimestampColumns<InkLineListItem>());
    cols.push(
      ...actionsColumn<InkLineListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={`${row.company_name} ${row.brand_name}`}
          onView={canRead ? () => router.push(sheetHref(row)) : undefined}
          onEdit={canUpdate ? () => router.push(inkRoutes.edit(row.ink_sheet_id)) : undefined}
          onDelete={
            canDelete
              ? () =>
                  setDeleting({
                    inkSheetId: row.ink_sheet_id,
                    lineId: row.id,
                    companyName: row.company_name,
                    lineLabel: `${row.brand_name} · ${row.color_name}`,
                  })
              : undefined
          }
          extra={rowExtraActions(row)}
        />
      )),
    );
    return cols;
  }, [canDelete, canRead, canUpdate, canViewHistory, canViewPrice, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.inks", columnDefs);
  const listView = useListView("inventory.inks");
  const buildExportParams = useCallback(() => ({
    search: search ?? undefined,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
  }), [companyId, sortBy, sort_order, search]);

  const { exportDialog } = useReportExport({
    tableKey: "inventory.inks",
    columnDefs,
    exportPath: "/inventory/inks/export",
    buildParams: buildExportParams,
    filteredRowCount: meta?.total,
    enabled: canRead,
  });


  return (
    <ListPage>
      <PageHeader
        title="Inks"
        subtitle="Company ink inventory"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate ? (
              <Button variant="outline" className={stockOutButtonClassName} asChild>
                <Link href={inkRoutes.stockOut()}>
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
                <Link href={inkRoutes.new}>
                  <Plus className="size-4" />
                  Add ink sheet
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
          placeholder="Search company, brand, or color…"
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
        getRowLabel={(row) => `${row.company_name} · ${row.brand_name} · ${row.color_name}`}
        onRowClick={canRead ? (row) => router.push(sheetHref(row)) : undefined}
        isLoading={inksQuery.isLoading}
        isError={inksQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(inksQuery.error)}
            onRetry={() => inksQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No ink lines yet." />}
        columnTotals={meta?.column_totals ?? null}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <BrandQuickCreateDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Remove ink line"
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
