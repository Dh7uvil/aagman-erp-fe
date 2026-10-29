"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { cylinderReturnPermissions } from "@/modules/inventory/permissions";
import { useDeleteCylinderReturn } from "@/modules/inventory/cylinder-returns/mutations";
import { useCylinderReturns } from "@/modules/inventory/cylinder-returns/queries";
import { cylinderReturnRoutes } from "@/modules/inventory/cylinder-returns/routes";
import type { CylinderReturn } from "@/modules/inventory/cylinder-returns/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { ListView } from "@/shared/components/data-table/list-view";
import { ListViewToolbarControls } from "@/shared/components/data-table/list-view-toggle";
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
import { Button } from "@/shared/components/ui/button";
import { useListView } from "@/shared/hooks/use-list-view";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS: SortFieldOption[] = [
  { value: "return_number", label: "Return #" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function CylinderReturnsScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(cylinderReturnPermissions);
  const deleteReturn = useDeleteCylinderReturn();
  const [deleting, setDeleting] = useState<CylinderReturn | null>(null);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const query = useCylinderReturns({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const columnDefs = useMemo((): Array<DataTableColumn<CylinderReturn>> => {
    return [
      { id: "return_number", header: "Return #", cell: (row) => row.return_number },
      { id: "customer", header: "Customer", cell: (row) => row.company_name },
      { id: "job", header: "Job", cell: (row) => row.job_number },
      { id: "remarks", header: "Remarks", cell: (row) => row.remarks ?? "—" },
      ...actionsColumn<CylinderReturn>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.return_number}
          onView={canRead ? () => router.push(cylinderReturnRoutes.view(row.id)) : undefined}
          onEdit={canUpdate ? () => router.push(cylinderReturnRoutes.edit(row.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.cylinder_returns", columnDefs);
  const listView = useListView("inventory.cylinder_returns");

  return (
    <ListPage>
      <PageHeader
        title="Cylinder returns"
        subtitle="Record cylinder returns against jobs"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={cylinderReturnRoutes.new}>
                <Plus className="size-4" />
                New return
              </Link>
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch value={search ?? ""} onChange={(value) => setParams({ search: value || null })} />
        <SortDialog fields={SORT_FIELDS} sortBy={sortBy} sortOrder={sort_order} onApply={setParams} />
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={rows}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.return_number}
        onRowClick={canRead ? (row) => router.push(cylinderReturnRoutes.view(row.id)) : undefined}
        isLoading={query.isLoading}
        isError={query.isError}
        error={
          <DataTableError message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
        }
        empty={<DataTableEmpty message="No cylinder returns yet." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete cylinder return"
        description={`Delete return ${deleting?.return_number}?`}
        confirmLabel="Delete"
        pending={deleteReturn.isPending}
        onConfirm={async () => {
          if (!deleting) {
            return;
          }
          try {
            await deleteReturn.mutateAsync(deleting.id);
            toast.success("Return deleted");
            setDeleting(null);
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
