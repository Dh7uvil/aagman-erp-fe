"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteAdhesiveCode } from "@/modules/inventory/adhesive-codes/mutations";
import { useAdhesiveCodes } from "@/modules/inventory/adhesive-codes/queries";
import { adhesiveCodeRoutes } from "@/modules/inventory/adhesive-codes/routes";
import type { AdhesiveCode } from "@/modules/inventory/adhesive-codes/schemas";
import { adhesiveCodePermissions } from "@/modules/inventory/permissions";
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
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { useListView } from "@/shared/hooks/use-list-view";
import { useReportExport } from "@/shared/hooks/use-report-export";
import { useTableParams } from "@/shared/hooks/use-table-params";
import {
  LIST_ACTIVE_ALL,
  LIST_ACTIVE_ACTIVE,
  LIST_ACTIVE_INACTIVE,
  isNonDefaultListActiveFilter,
  listActiveFilterValue,
  parseListActiveFilter,
} from "@/shared/lib/list-filters";

const SORT_FIELDS: SortFieldOption[] = [
  { value: "code", label: "Code" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function AdhesiveCodesScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(adhesiveCodePermissions);
  const deleteAdhesiveCode = useDeleteAdhesiveCode();
  const [deleting, setDeleting] = useState<AdhesiveCode | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const isActive = parseListActiveFilter(filters.active);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const colorsQuery = useAdhesiveCodes({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    is_active: isActive,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const colors = colorsQuery.data?.data ?? [];
  const meta = colorsQuery.data?.meta;
  const hasActiveFilters = Boolean(
    search || sortBy || isNonDefaultListActiveFilter(filters.active),
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteAdhesiveCode.mutateAsync(deleting.id);
      toast.success("Adhesive code deleted from master");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<AdhesiveCode>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (row) =>
          canRead ? (
            <Link href={adhesiveCodeRoutes.view(row.id)} className="font-medium hover:underline">
              {row.code}
            </Link>
          ) : (
            <span className="font-medium">{row.code}</span>
          ),
      },
      {
        id: "active",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      ...auditTimestampColumns<AdhesiveCode>(),
      ...actionsColumn<AdhesiveCode>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.code}
          onView={canRead ? () => router.push(adhesiveCodeRoutes.view(row.id)) : undefined}
          onEdit={canUpdate ? () => router.push(adhesiveCodeRoutes.edit(row.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.adhesive_codes", columnDefs);
  const listView = useListView("inventory.adhesive_codes");
  const buildExportParams = useCallback(() => ({
    search: search ?? undefined,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    is_active: isActive,
  }), [isActive, sortBy, sort_order, search]);

  const { exportDialog } = useReportExport({
    tableKey: "inventory.adhesive_codes",
    columnDefs,
    exportPath: "/inventory/adhesive-codes/export",
    buildParams: buildExportParams,
    filteredRowCount: meta?.total,
    enabled: canRead,
  });


  return (
    <ListPage>
      <PageHeader
        title="Adhesive master"
        subtitle="Adhesive codes for sheet lines."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={adhesiveCodeRoutes.new}>
                <Plus className="size-4" />
                Add adhesive
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code…"
        />
        <FilterSelect
          label="Status"
          className="w-full sm:w-40"
          placeholder="Status"
          value={listActiveFilterValue(filters.active)}
          onValueChange={(value) =>
            setParams({
              filters: { active: value === LIST_ACTIVE_ACTIVE ? null : value },
            })
          }
          options={[
            { value: LIST_ACTIVE_ACTIVE, label: "Active" },
            { value: LIST_ACTIVE_INACTIVE, label: "Inactive" },
            { value: LIST_ACTIVE_ALL, label: "All statuses" },
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
              setParams({ search: null, sort_by: null, sort_order: null, filters: { active: null } })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={colors}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.code}
        onRowClick={canRead ? (row) => router.push(adhesiveCodeRoutes.view(row.id)) : undefined}
        isLoading={colorsQuery.isLoading}
        isError={colorsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(colorsQuery.error)}
            onRetry={() => colorsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No adhesive codes in master yet." />}
        columnTotals={meta?.column_totals ?? null}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete adhesive code"
        description={`Delete adhesive code "${deleting?.code}" from master? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteAdhesiveCode.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
