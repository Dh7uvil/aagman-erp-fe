"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BranchFormDialog } from "@/modules/users-management/branches/components/branch-form-dialog";
import { BranchStatusBadge } from "@/modules/users-management/branches/components/branch-status-badge";
import { useDeleteBranch } from "@/modules/users-management/branches/mutations";
import { branchPermissions } from "@/modules/users-management/branches/permissions";
import { useBranches } from "@/modules/users-management/branches/queries";
import type { Branch, BranchStatus } from "@/modules/users-management/branches/schemas";
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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";
const SORT_FIELDS: SortFieldOption[] = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "status", label: "Status" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

function locationLabel(branch: Branch): string {
  const city = branch.address?.city?.trim();
  const country = branch.address?.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || "—";
}

function parseStatus(value: string | undefined): BranchStatus | undefined {
  return value === "ACTIVE" || value === "INACTIVE" ? value : undefined;
}

export function BranchesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(branchPermissions);
  const deleteBranch = useDeleteBranch();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const status = parseStatus(filters.status);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const branchesQuery = useBranches({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    status,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const branches = branchesQuery.data?.data ?? [];
  const meta = branchesQuery.data?.meta;
  const hasActiveFilters = Boolean(search || status || sortBy);

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(branch: Branch) {
    setSelected(branch);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setSelected(branch);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteBranch.mutateAsync(deleting.id);
      toast.success("Branch deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Branch>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (branch) => <span className="font-mono text-sm">{branch.code}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (branch) => <span className="font-medium">{branch.name}</span>,
      },
      {
        id: "phone",
        header: "Phone",
        cell: (branch) => branch.phone || "—",
      },
      {
        id: "timezone",
        header: "Timezone",
        cell: (branch) => branch.timezone || "—",
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (branch) => <BranchStatusBadge status={branch.status} />,
      },
      {
        id: "address",
        header: "Location",
        cell: (branch) => locationLabel(branch),
      },
      ...auditTimestampColumns<Branch>(),
      ...actionsColumn<Branch>(showActions, (branch) => (
        <DataTableRowActions
          entityName={branch.name}
          onView={canRead ? () => openView(branch) : undefined}
          onEdit={canUpdate ? () => openEdit(branch) : undefined}
          onDelete={canDelete ? () => setDeleting(branch) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("identity.branches", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Branches"
        subtitle="Manage company branches"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Branch
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code, name, phone, location…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
          placeholder="Status"
          value={status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
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
                filters: { status: null },
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
          {branchesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : branchesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(branchesQuery.error)}
                  onRetry={() => branchesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : branches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No branches found"
                  message="Try a different search or filter."
                />
              </TableCell>
            </TableRow>
          ) : (
            branches.map((branch) => (
              <TableRow key={branch.id}>
                <DataTableCells row={branch} columns={columns} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <BranchFormDialog
        open={formOpen}
        branch={selected}
        forceReadOnly={forceReadOnly}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelected(null);
            setForceReadOnly(false);
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete branch"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this branch"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteBranch.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
