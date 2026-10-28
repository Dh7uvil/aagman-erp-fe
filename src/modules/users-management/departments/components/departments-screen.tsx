"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllBranches } from "@/modules/users-management/branches/queries";
import { DepartmentFormDialog } from "@/modules/users-management/departments/components/department-form-dialog";
import { useDeleteDepartment } from "@/modules/users-management/departments/mutations";
import { departmentPermissions } from "@/modules/users-management/departments/permissions";
import { useDepartments } from "@/modules/users-management/departments/queries";
import type { Department } from "@/modules/users-management/departments/schemas";
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
import { Button } from "@/shared/components/ui/button";
import { useListView } from "@/shared/hooks/use-list-view";
import { useTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";
const SORT_FIELDS: SortFieldOption[] = [
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function DepartmentsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(departmentPermissions);
  const deleteDepartment = useDeleteDepartment();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [forceReadOnly, setForceReadOnly] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const branchId = filters.branch_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const departmentsQuery = useDepartments({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    branch_id: branchId,
  });
  const branchesQuery = useAllBranches();
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const departments = departmentsQuery.data?.data ?? [];
  const meta = departmentsQuery.data?.meta;
  const branches = branchesQuery.data ?? [];
  const hasActiveFilters = Boolean(search || branchId || sortBy);

  function openCreate() {
    setSelected(null);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  function openView(department: Department) {
    setSelected(department);
    setForceReadOnly(true);
    setFormOpen(true);
  }

  function openEdit(department: Department) {
    setSelected(department);
    setForceReadOnly(false);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteDepartment.mutateAsync(deleting.id);
      toast.success("Department deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Department>> => {
    return [
      {
        id: "code",
        header: "Code",
        sortableField: "code",
        cell: (department) => <span className="font-mono text-sm">{department.code}</span>,
      },
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        cell: (department) => <span className="font-medium">{department.name}</span>,
      },
      {
        id: "branch",
        header: "Branch",
        cell: (department) => department.branch?.name ?? "—",
      },
      {
        id: "manager",
        header: "Manager",
        cell: (department) => department.manager?.name ?? "—",
      },
      ...auditTimestampColumns<Department>(),
      ...actionsColumn<Department>(showActions, (department) => (
        <DataTableRowActions
          entityName={department.name}
          onView={canRead ? () => openView(department) : undefined}
          onEdit={canUpdate ? () => openEdit(department) : undefined}
          onDelete={canDelete ? () => setDeleting(department) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("identity.departments", columnDefs);
  const listView = useListView("identity.departments");

  return (
    <ListPage>
      <PageHeader
        title="Departments"
        subtitle="Manage departments"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Department
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search code, name, branch, manager…"
        />
        <FilterSelect
          label="Branch"
          className="w-full sm:w-52"
          placeholder="All branches"
          value={branchId ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { branch_id: value === ALL ? null : value } })
          }
          disabled={branchesQuery.isLoading}
          options={[
            { value: ALL, label: "All branches" },
            ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
          ]}
        />
        <SortDialog
          fields={SORT_FIELDS}
          sortBy={sortBy}
          sortOrder={sort_order}
          onApply={setParams}
        />
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
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
                filters: { branch_id: null },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={departments}
        getRowKey={(department) => department.id}
        getRowLabel={(department) => department.name}
        onRowClick={canRead ? (department) => openView(department) : undefined}
        isLoading={departmentsQuery.isLoading}
        isError={departmentsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(departmentsQuery.error)}
            onRetry={() => departmentsQuery.refetch()}
          />
        }
        empty={
          <DataTableEmpty
            title="No departments found"
            message="Try a different search or filter."
          />
        }
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <DepartmentFormDialog
        open={formOpen}
        department={selected}
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
        title="Delete department"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this department"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteDepartment.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
