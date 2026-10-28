"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { unitPermissions } from "@/modules/inventory/permissions";
import { useDeleteUnit } from "@/modules/inventory/units/mutations";
import { useUnits } from "@/modules/inventory/units/queries";
import { unitRoutes } from "@/modules/inventory/units/routes";
import type { Unit } from "@/modules/inventory/units/schemas";
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
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function UnitsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(unitPermissions);
  const deleteUnit = useDeleteUnit();
  const [deleting, setDeleting] = useState<Unit | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const isActive = parseListActiveFilter(filters.active);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const unitsQuery = useUnits({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    is_active: isActive,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const units = unitsQuery.data?.data ?? [];
  const meta = unitsQuery.data?.meta;
  const hasActiveFilters = Boolean(
    search || sortBy || isNonDefaultListActiveFilter(filters.active),
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteUnit.mutateAsync(deleting.id);
      toast.success("Unit deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Unit>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (unit) => <span className="font-mono text-sm">{unit.code}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (unit) =>
          canRead ? (
            <Link href={unitRoutes.view(unit.id)} className="font-medium hover:underline">
              {unit.name}
            </Link>
          ) : (
            <span className="font-medium">{unit.name}</span>
          ),
      },
      {
        id: "active",
        header: "Status",
        cell: (unit) => <ActiveBadge active={unit.is_active} />,
      },
      ...auditTimestampColumns<Unit>(),
      ...actionsColumn<Unit>(showActions, (unit) => (
        <DataTableRowActions
          entityName={unit.name}
          onView={canRead ? () => router.push(unitRoutes.view(unit.id)) : undefined}
          onEdit={canUpdate ? () => router.push(unitRoutes.edit(unit.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(unit) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.units", columnDefs);
  const listView = useListView("inventory.units");

  return (
    <ListPage>
      <PageHeader
        title="Units"
        subtitle="Units of measure for materials."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={unitRoutes.new}>
                <Plus className="size-4" />
                Add unit
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code or name…"
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
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setParams({ search: null, sort_by: null, sort_order: null, filters: { active: null } })}
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={units}
        getRowKey={(unit) => unit.id}
        getRowLabel={(unit) => unit.name}
        onRowClick={canRead ? (unit) => router.push(unitRoutes.view(unit.id)) : undefined}
        isLoading={unitsQuery.isLoading}
        isError={unitsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(unitsQuery.error)}
            onRetry={() => unitsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No units yet." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete unit"
        description={`Delete unit "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteUnit.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
