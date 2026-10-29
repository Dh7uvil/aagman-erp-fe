"use client";

import { Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type MouseEvent } from "react";
import { toast } from "sonner";

import { jobPermissions, jobPricePermissions } from "@/modules/inventory/permissions";
import { JobCloneDialog } from "@/modules/inventory/jobs/components/job-clone-dialog";
import {
  JobHeaderCreateActions,
  jobHeaderActionsClassName,
} from "@/modules/inventory/jobs/components/job-header-create-actions";
import { JobPauseDialog } from "@/modules/inventory/jobs/components/job-pause-dialog";
import { useDeleteJob, useResumeJob } from "@/modules/inventory/jobs/mutations";
import { useJobs } from "@/modules/inventory/jobs/queries";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import type { JobListItem } from "@/modules/inventory/jobs/schemas";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useListView } from "@/shared/hooks/use-list-view";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS: SortFieldOption[] = [
  { value: "job_number", label: "Job number" },
  { value: "product_name", label: "Product" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));
/** No empty option: default (no URL filter) shows placeholder only; API returns active + resumed. */
function canPauseJob(status: JobListItem["status"]): boolean {
  return status !== "PAUSED" && status !== "RETURNED" && status !== "COMPLETED";
}

function canResumeJob(status: JobListItem["status"]): boolean {
  return status === "PAUSED";
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "RESUMED", label: "Resumed" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "RETURNED", label: "Returned" },
  { value: "ALL", label: "All statuses" },
];

export function JobsScreen() {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(jobPricePermissions.read);
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(jobPermissions);
  const deleteJob = useDeleteJob();
  const resumeJob = useResumeJob();
  const [deleting, setDeleting] = useState<JobListItem | null>(null);
  const [pausing, setPausing] = useState<JobListItem | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status ?? "";
  const companyId = filters.company_id;
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const includeClosed = statusFilter === "ALL";
  const status =
    statusFilter && statusFilter !== "" && statusFilter !== "ALL"
      ? (statusFilter as JobListItem["status"])
      : undefined;

  const jobsQuery = useJobs({
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
  const jobs = jobsQuery.data?.data ?? [];
  const meta = jobsQuery.data?.meta;
  const showActions = hasRowActions(canRead, canUpdate, canDelete, canCreate);

  const columnDefs = useMemo((): Array<DataTableColumn<JobListItem>> => {
    const cols: Array<DataTableColumn<JobListItem>> = [
      { id: "job_number", header: "Job #", cell: (row) => row.job_number },
      { id: "company", header: "Company", cell: (row) => row.company_name },
      { id: "product", header: "Product", cell: (row) => row.product_name },
      {
        id: "status",
        header: "Status",
        cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
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
      ...actionsColumn<JobListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.job_number}
          onView={canRead ? () => router.push(jobRoutes.view(row.id)) : undefined}
          onEdit={canUpdate ? () => router.push(jobRoutes.edit(row.id)) : undefined}
          cloneHref={canCreate && canRead ? jobRoutes.clone(row.id) : undefined}
          onDelete={canDelete ? () => setDeleting(row) : undefined}
          extra={
            canUpdate ? (
                <>
                  {canPauseJob(row.status) ? (
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Pause ${row.job_number}`}
                    title={`Pause ${row.job_number}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPausing(row);
                    }}
                  >
                      <Pause className="size-3.5" />
                    </Button>
                  ) : null}
                  {canResumeJob(row.status) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Resume ${row.job_number}`}
                      title={`Resume ${row.job_number}`}
                      disabled={resumeJob.isPending && resumeJob.variables === row.id}
                      onClick={(event) => void onResumeJob(row, event)}
                    >
                      <Play className="size-3.5" />
                    </Button>
                  ) : null}
                </>
            ) : null
          }
        />
      )),
    );
    return cols;
  }, [
    canCreate,
    canDelete,
    canRead,
    canUpdate,
    canViewPrice,
    resumeJob.isPending,
    resumeJob.variables,
    router,
    showActions,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.jobs", columnDefs);
  const listView = useListView("inventory.jobs");

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteJob.mutateAsync(deleting.id);
      toast.success("Job deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onResumeJob(row: JobListItem, event: MouseEvent) {
    event.stopPropagation();
    try {
      await resumeJob.mutateAsync(row.id);
      toast.success("Job resumed");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Jobs"
        subtitle="Track printing jobs and cylinder details"
        actions={
          canCreate ? (
            <div className={jobHeaderActionsClassName()}>
              {canRead ? (
                <JobHeaderCreateActions onCloneClick={() => setCloneOpen(true)} />
              ) : (
                <JobHeaderCreateActions showNewJob />
              )}
            </div>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search jobs…"
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
        rows={jobs}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => row.job_number}
        onRowClick={canRead ? (row) => router.push(jobRoutes.view(row.id)) : undefined}
        isLoading={jobsQuery.isLoading}
        isError={jobsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(jobsQuery.error)}
            onRetry={() => jobsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message="No jobs found." />}
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete job"
        description={`Delete job ${deleting?.job_number}?`}
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
      <JobCloneDialog open={cloneOpen} onOpenChange={setCloneOpen} />
      {pausing ? (
        <JobPauseDialog
          jobId={pausing.id}
          open={Boolean(pausing)}
          onOpenChange={(open) => !open && setPausing(null)}
          onPaused={() => {
            setPausing(null);
            void jobsQuery.refetch();
          }}
        />
      ) : null}
    </ListPage>
  );
}
