"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { WarehouseFormDialog } from "@/modules/users-management/warehouses/components/warehouse-form-dialog";
import { useDeleteWarehouse } from "@/modules/users-management/warehouses/mutations";
import { warehousePermissions } from "@/modules/users-management/warehouses/permissions";
import { useWarehouses } from "@/modules/users-management/warehouses/queries";
import type { Warehouse } from "@/modules/users-management/warehouses/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
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

export function WarehousesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(warehousePermissions);
  const deleteWarehouse = useDeleteWarehouse();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const isActive = parseListActiveFilter(filters.active);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const warehousesQuery = useWarehouses({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    is_active: isActive,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const warehouses = warehousesQuery.data?.data ?? [];
  const meta = warehousesQuery.data?.meta;
  const hasActiveFilters = Boolean(
    search || sortBy || isNonDefaultListActiveFilter(filters.active),
  );

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteWarehouse.mutateAsync(deleting.id);
      toast.success("Warehouse deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Warehouse>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (warehouse) => <span className="font-mono text-sm">{warehouse.code}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (warehouse) => <span className="font-medium">{warehouse.name}</span>,
      },
      {
        id: "phone",
        header: "Phone",
        cell: (warehouse) => warehouse.phone || "—",
      },
      {
        id: "default",
        header: "Default",
        cell: (warehouse) => (warehouse.is_default ? <Badge variant="info">Default</Badge> : "—"),
      },
      {
        id: "active",
        header: "Status",
        cell: (warehouse) => <ActiveBadge active={warehouse.is_active} />,
      },
      ...auditTimestampColumns<Warehouse>(),
      ...actionsColumn<Warehouse>(showActions, (warehouse) => (
        <DataTableRowActions
          entityName={warehouse.name}
          onDelete={canDelete ? () => setDeleting(warehouse) : undefined}
        />
      )),
    ];
  }, [canDelete, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("identity.warehouses", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Warehouses"
        subtitle="Manage warehouses"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Warehouse
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code, name, phone…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
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
        <SortDialog
          fields={SORT_FIELDS}
          sortBy={sortBy}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { active: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sortBy}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {warehousesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : warehousesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(warehousesQuery.error)}
                  onRetry={() => warehousesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : warehouses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No warehouses found"
                  message="Try a different search or filter."
                />
              </TableCell>
            </TableRow>
          ) : (
            warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <DataTableCells row={warehouse} columns={columns} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <WarehouseFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete warehouse"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this warehouse"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteWarehouse.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
