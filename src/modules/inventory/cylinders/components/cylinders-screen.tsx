"use client";

import { ImageIcon, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  cylinderImagePermissions,
  cylinderPermissions,
  cylinderPricePermissions,
} from "@/modules/inventory/permissions";
import { CylinderCloneDialog } from "@/modules/inventory/cylinders/components/cylinder-clone-dialog";
import { CylinderImagePreviewDialog } from "@/modules/inventory/cylinders/components/cylinder-image-preview-dialog";
import { CylinderStatusBadge } from "@/modules/inventory/cylinders/components/cylinder-status-badge";
import {
  CylinderHeaderCreateActions,
  cylinderHeaderActionsClassName,
} from "@/modules/inventory/cylinders/components/cylinder-header-create-actions";
import { CylinderPauseDialog } from "@/modules/inventory/cylinders/components/cylinder-pause-dialog";
import { CylinderResumeDialog } from "@/modules/inventory/cylinders/components/cylinder-resume-dialog";
import { useDeleteCylinder } from "@/modules/inventory/cylinders/mutations";
import { useCylinders } from "@/modules/inventory/cylinders/queries";
import { cylinderRoutes } from "@/modules/inventory/cylinders/routes";
import type { CylinderListItem } from "@/modules/inventory/cylinders/schemas";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
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
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS: SortFieldOption[] = [
  { value: "cylinder_number", label: "Cylinder number" },
  { value: "product_name", label: "Product" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));
/** No empty option: default (no URL filter) shows placeholder only; API returns active + completed. */
function canPauseCylinder(status: CylinderListItem["status"]): boolean {
  return status !== "PAUSED" && status !== "RETURNED" && status !== "COMPLETED";
}

function canResumeCylinder(status: CylinderListItem["status"]): boolean {
  return status === "PAUSED";
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "RETURNED", label: "Returned" },
  { value: "ALL", label: "All statuses" },
];

const LIST_VIEW_PREFIX = "aagman-list-view:";

export function CylindersScreen() {
  useEffect(() => {
    const legacyKey = `${LIST_VIEW_PREFIX}inventory.jobs`;
    const nextKey = `${LIST_VIEW_PREFIX}inventory.cylinders`;
    if (!localStorage.getItem(nextKey) && localStorage.getItem(legacyKey)) {
      localStorage.setItem(nextKey, localStorage.getItem(legacyKey)!);
    }
  }, []);

  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(cylinderPricePermissions.read);
  const canPreviewImage = can(cylinderImagePermissions.read);
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(cylinderPermissions);
  const deleteCylinder = useDeleteCylinder();
  const [deleting, setDeleting] = useState<CylinderListItem | null>(null);
  const [pausing, setPausing] = useState<CylinderListItem | null>(null);
  const [resuming, setResuming] = useState<CylinderListItem | null>(null);
  const [previewing, setPreviewing] = useState<CylinderListItem | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status ?? "";
  const companyId = filters.company_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const includeClosed = statusFilter === "ALL";
  const status =
    statusFilter && statusFilter !== "" && statusFilter !== "ALL"
      ? (statusFilter as CylinderListItem["status"])
      : undefined;

  const cylindersQuery = useCylinders({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
    company_id: companyId,
    status,
    include_closed: includeClosed,
  });
  const companiesQuery = useCompanies({ page: 1, page_size: 200 });
  const companies = companiesQuery.data?.data ?? [];
  const cylinders = cylindersQuery.data?.data ?? [];
  const meta = cylindersQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canCreate);

  const columnDefs = useMemo((): Array<DataTableColumn<CylinderListItem>> => {
    const cols: Array<DataTableColumn<CylinderListItem>> = [
      { id: "cylinder_number", header: "Cylinder #", cell: (row) => row.cylinder_number },
      { id: "company", header: "Company", cell: (row) => row.company_name },
      { id: "product", header: "Product", cell: (row) => row.product_name },
      {
        id: "status",
        header: "Status",
        cell: (row) => <CylinderStatusBadge status={row.status} />,
      },
      { id: "cylinder_count", header: "Cylinders", cell: (row) => String(row.cylinder_count) },
    ];
    if (canViewPrice) {
      cols.push({
        id: "cylinder_cost",
        header: "Cylinder cost",
        defaultVisible: false,
        cell: (row) => row.cylinder_cost ?? "—",
      });
    }
    cols.push(
      { id: "pet_size", header: "Pet size", defaultVisible: false, cell: (row) => row.pet_size ?? "—" },
      {
        id: "cylinder_location",
        header: "Location",
        defaultVisible: false,
        cell: (row) => row.cylinder_location ?? "—",
      },
    );
    cols.push(
      ...actionsColumn<CylinderListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.cylinder_number}
          onView={canRead ? () => router.push(cylinderRoutes.view(row.id)) : undefined}
          onEdit={canUpdate ? () => router.push(cylinderRoutes.edit(row.id)) : undefined}
          cloneHref={canCreate && canRead ? cylinderRoutes.clone(row.id) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
          extra={
            <>
              {canPreviewImage && row.cylinder_image?.filename ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Preview image ${row.cylinder_number}`}
                  title={`Preview image ${row.cylinder_number}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewing(row);
                  }}
                >
                  <ImageIcon className="size-3.5" />
                </Button>
              ) : null}
              {canUpdate && canPauseCylinder(row.status) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Pause ${row.cylinder_number}`}
                  title={`Pause ${row.cylinder_number}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPausing(row);
                  }}
                >
                  <Pause className="size-3.5" />
                </Button>
              ) : null}
              {canUpdate && canResumeCylinder(row.status) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Resume ${row.cylinder_number}`}
                  title={`Resume ${row.cylinder_number}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setResuming(row);
                  }}
                >
                  <Play className="size-3.5" />
                </Button>
              ) : null}
            </>
          }
        />
      )),
    );
    return cols;
  }, [
    canCreate,
    canDelete,
    canPreviewImage,
    canRead,
    canUpdate,
    canViewPrice,
    router,
    showActions,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.cylinders", columnDefs);
  const listView = useListView("inventory.cylinders");

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCylinder.mutateAsync(deleting.id);
      toast.success("Cylinder deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Cylinders"
        subtitle="Track printing jobs and cylinder details"
        actions={
          canCreate ? (
            <div className={cylinderHeaderActionsClassName()}>
              {canRead ? (
                <CylinderHeaderCreateActions onCloneClick={() => setCloneOpen(true)} />
              ) : (
                <CylinderHeaderCreateActions showNewCylinder />
              )}
            </div>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search cylinders…"
        />
        <FilterSelect
          label="Status"
          className="w-full sm:w-44"
          placeholder="Status"
          value={statusFilter}
          onValueChange={(value) =>
            setParams({ filters: { ...filters, status: value || null }, page: 1 })
          }
          options={STATUS_OPTIONS}
        />
        <FilterSelect
          label="Company"
          className="w-full sm:w-44"
          placeholder="Company"
          value={companyId ?? ""}
          onValueChange={(value) =>
            setParams({ filters: { ...filters, company_id: value || null }, page: 1 })
          }
          options={[
            { value: "", label: "All companies" },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <SortDialog fields={SORT_FIELDS} sortBy={sortBy} sortOrder={sort_order} onApply={setParams} />
        <ListViewToolbarControls listView={listView} columnsDialog={columnsDialog} />
      </DataTableToolbar>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={cylinders}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.cylinder_number}
        onRowClick={canRead ? (row) => router.push(cylinderRoutes.view(row.id)) : undefined}
        isLoading={cylindersQuery.isLoading}
        isError={cylindersQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(cylindersQuery.error)}
            onRetry={() => cylindersQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No cylinders found." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete cylinder"
        description={`Delete cylinder ${deleting?.cylinder_number}?`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
      <CylinderCloneDialog open={cloneOpen} onOpenChange={setCloneOpen} />
      <CylinderImagePreviewDialog
        cylinder={previewing}
        open={Boolean(previewing)}
        onOpenChange={(open) => !open && setPreviewing(null)}
      />
      {pausing ? (
        <CylinderPauseDialog
          cylinderId={pausing.id}
          open={Boolean(pausing)}
          onOpenChange={(open) => !open && setPausing(null)}
          onPaused={() => {
            setPausing(null);
            void cylindersQuery.refetch();
          }}
        />
      ) : null}
      {resuming ? (
        <CylinderResumeDialog
          cylinderId={resuming.id}
          open={Boolean(resuming)}
          onOpenChange={(open) => !open && setResuming(null)}
          onResumed={() => {
            setResuming(null);
            void cylindersQuery.refetch();
          }}
        />
      ) : null}
    </ListPage>
  );
}
