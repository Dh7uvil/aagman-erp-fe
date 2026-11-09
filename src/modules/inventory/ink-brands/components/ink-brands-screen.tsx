"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { inkBrandRoutes } from "@/modules/inventory/ink-brands/routes";
import { useDeleteInkBrand } from "@/modules/inventory/inks/mutations";
import { useInkBrandsList } from "@/modules/inventory/inks/queries";
import type { InkBrand } from "@/modules/inventory/inks/schemas";
import { inkPermissions } from "@/modules/inventory/permissions";
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
  { value: "name", label: "Brand" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function InkBrandsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(inkPermissions);
  const deleteBrand = useDeleteInkBrand();
  const [deleting, setDeleting] = useState<InkBrand | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const isActive = parseListActiveFilter(filters.active);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const brandsQuery = useInkBrandsList({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    is_active: isActive,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const brands = brandsQuery.data?.data ?? [];
  const meta = brandsQuery.data?.meta;
  const hasActiveFilters = Boolean(
    search || sortBy || isNonDefaultListActiveFilter(filters.active),
  );

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteBrand.mutateAsync(deleting.id);
      toast.success("Brand removed from master");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<InkBrand>> => {
    return [
      {
        id: "name",
        header: "Brand",
        sortableField: "name",
        cell: (row) =>
          canRead ? (
            <Link href={inkBrandRoutes.view(row.id)} className="font-medium hover:underline">
              {row.name}
            </Link>
          ) : (
            <span className="font-medium">{row.name}</span>
          ),
      },
      {
        id: "active",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      ...auditTimestampColumns<InkBrand>(),
      ...actionsColumn<InkBrand>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.name}
          onView={canRead ? () => router.push(inkBrandRoutes.view(row.id)) : undefined}
          onEdit={canUpdate ? () => router.push(inkBrandRoutes.edit(row.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.ink_brands", columnDefs);
  const listView = useListView("inventory.ink_brands");

  return (
    <ListPage>
      <PageHeader
        title="Ink brands"
        subtitle="Brands used on ink sheet lines."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={inkBrandRoutes.new}>
                <Plus className="size-4" />
                Add brand
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search brand…"
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
        rows={brands}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.name}
        onRowClick={canRead ? (row) => router.push(inkBrandRoutes.view(row.id)) : undefined}
        isLoading={brandsQuery.isLoading}
        isError={brandsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(brandsQuery.error)}
            onRetry={() => brandsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No ink brands yet. Add one from here or while editing a sheet." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete brand"
        description={`Delete brand "${deleting?.name}"? Brands used on ink lines cannot be deleted.`}
        confirmLabel="Delete"
        pending={deleteBrand.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
