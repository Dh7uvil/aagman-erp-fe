"use client";

import { FolderPlus, History, MinusCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { formatPricePerUnit } from "@/modules/inventory/format";
import { SolventBrandQuickCreateDialog } from "@/modules/inventory/solvents/components/solvent-brand-quick-create-dialog";
import { solventsApi } from "@/modules/inventory/solvents/api";
import { useDeleteSolventSheet, useUpdateSolventSheet } from "@/modules/inventory/solvents/mutations";
import { useSolvents } from "@/modules/inventory/solvents/queries";
import { solventRoutes } from "@/modules/inventory/solvents/routes";
import { solventBrandRoutes } from "@/modules/inventory/solvent-brands/routes";
import {
  solventLineRecordToUpsert,
  type SolventLineListItem,
} from "@/modules/inventory/solvents/schemas";
import { solventPermissions, solventPricePermissions } from "@/modules/inventory/permissions";
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
  solventSheetId: string;
  lineId: string;
  companyName: string;
  lineLabel: string;
};

export function SolventsScreen() {
  const router = useRouter();
  const can = useCan();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(solventPermissions);
  const canViewHistory = can(solventPermissions.history);
  const canViewPrice = can(solventPricePermissions.read);
  const deleteSheet = useDeleteSolventSheet();
  const updateSheet = useUpdateSolventSheet();
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const companyId = filters.company_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;

  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];

  const solventsQuery = useSolvents({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canViewHistory);

  function sheetHref(row: SolventLineListItem) {
    return solventRoutes.view(row.solvent_sheet_id);
  }

  function stockOutHref(row: SolventLineListItem) {
    return solventRoutes.stockOut({
      company_id: row.company_id,
      solvent_sheet_id: row.solvent_sheet_id,
      solvent_line_id: row.id,
    });
  }

  function rowExtraActions(row: SolventLineListItem): ReactNode | undefined {
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
          <Link href={historyHref("solvent-lines", row.id, `${row.brand_name} · ${row.name}`)}>
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

  const rows = solventsQuery.data?.data ?? [];
  const meta = solventsQuery.data?.meta;
  const hasActiveFilters = Boolean(search || sortBy || companyId);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      const sheet = await solventsApi.get(deleting.solventSheetId);
      const remaining = sheet.lines.filter((line) => line.id !== deleting.lineId);
      if (remaining.length === 0) {
        await deleteSheet.mutateAsync(deleting.solventSheetId);
        toast.success("Solvent sheet deleted");
      } else {
        await updateSheet.mutateAsync({
          id: deleting.solventSheetId,
          values: {
            lines: remaining.map((line) => solventLineRecordToUpsert(line, canViewPrice)),
          },
        });
        toast.success("Solvent line removed");
      }
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<SolventLineListItem>> => {
    const cols: Array<DataTableColumn<SolventLineListItem>> = [
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
            <Link href={solventBrandRoutes.view(row.brand_id)} className="hover:underline">
              {row.brand_name}
            </Link>
          ) : (
            row.brand_name
          ),
      },
      {
        id: "name",
        header: "Name",
        cell: (row) => row.name,
      },
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
    cols.push(...auditTimestampColumns<SolventLineListItem>());
    cols.push(
      ...actionsColumn<SolventLineListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={`${row.company_name} ${row.brand_name}`}
          onView={canRead ? () => router.push(sheetHref(row)) : undefined}
          onEdit={canUpdate ? () => router.push(solventRoutes.edit(row.solvent_sheet_id)) : undefined}
          onDelete={
            canDelete
              ? () =>
                  setDeleting({
                    solventSheetId: row.solvent_sheet_id,
                    lineId: row.id,
                    companyName: row.company_name,
                    lineLabel: `${row.brand_name} · ${row.name}`,
                  })
              : undefined
          }
          extra={rowExtraActions(row)}
        />
      )),
    );
    return cols;
  }, [canDelete, canRead, canUpdate, canViewHistory, canViewPrice, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.solvents", columnDefs);
  const listView = useListView("inventory.solvents");

  return (
    <ListPage>
      <PageHeader
        title="Solvents"
        subtitle="Company solvent inventory"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate ? (
              <Button variant="outline" className={stockOutButtonClassName} asChild>
                <Link href={solventRoutes.stockOut()}>
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
                <Link href={solventRoutes.new}>
                  <Plus className="size-4" />
                  Add solvent
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
          placeholder="Search company, brand, or name…"
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
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
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
        getRowLabel={(row) => `${row.company_name} · ${row.brand_name} · ${row.name}`}
        onRowClick={canRead ? (row) => router.push(sheetHref(row)) : undefined}
        isLoading={solventsQuery.isLoading}
        isError={solventsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(solventsQuery.error)}
            onRetry={() => solventsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No solvent lines yet." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <SolventBrandQuickCreateDialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Remove solvent line"
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
