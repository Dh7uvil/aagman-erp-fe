"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteCompany } from "@/modules/users-management/companies/mutations";
import { companyPermissions } from "@/modules/users-management/companies/permissions";
import { useCompanies } from "@/modules/users-management/companies/queries";
import { companyRoutes } from "@/modules/users-management/companies/routes";
import type { Company } from "@/modules/users-management/companies/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
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
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

function addressLabel(company: Company): string {
  const city = company.address?.city?.trim();
  const country = company.address?.country?.trim();
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || "—";
}

export function CompaniesScreen() {
  const router = useRouter();
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(companyPermissions);
  const deleteCompany = useDeleteCompany();
  const [deleting, setDeleting] = useState<Company | null>(null);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const companiesQuery = useCompanies({
    page,
    page_size,
    search,
    sort_by: sortBy,
    sort_order: sortBy ? sort_order : undefined,
  });
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const companies = companiesQuery.data?.data ?? [];
  const meta = companiesQuery.data?.meta;
  const hasActiveFilters = Boolean(search || sortBy);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteCompany.mutateAsync(deleting.id);
      toast.success("Company deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Company>> => {
    return [
      {
        id: "name",
        header: "Company name",
        sortableField: "name",
        cell: (company) =>
          canRead ? (
            <Link
              href={companyRoutes.view(company.id)}
              className="font-medium hover:underline"
            >
              {company.name}
            </Link>
          ) : (
            <span className="font-medium">{company.name}</span>
          ),
      },
      {
        id: "email",
        header: "Email",
        sortableField: "email",
        cell: (company) => company.email || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: (company) => company.phone || "—",
      },
      {
        id: "address",
        header: "Address",
        cell: (company) => addressLabel(company),
      },
      ...auditTimestampColumns<Company>(),
      ...actionsColumn<Company>(showActions, (company) => (
        <DataTableRowActions
          entityName={company.name}
          onView={canRead ? () => router.push(companyRoutes.view(company.id)) : undefined}
          onEdit={canUpdate ? () => router.push(companyRoutes.edit(company.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(company) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, router, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("identity.companies", columnDefs);
  const listView = useListView("identity.companies");

  return (
    <ListPage>
      <PageHeader
        title="Companies"
        subtitle="Manage company master records"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href={companyRoutes.new}>
                <Plus className="size-3.5" />
                New Company
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name, email, phone, address…"
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
        rows={companies}
        getRowKey={(company) => company.id}
        getRowLabel={(company) => company.name}
        onRowClick={canRead ? (company) => router.push(companyRoutes.view(company.id)) : undefined}
        isLoading={companiesQuery.isLoading}
        isError={companiesQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(companiesQuery.error)}
            onRetry={() => companiesQuery.refetch()}
          />
        }
        empty={
          <DataTableEmpty
            title="No companies found"
            message="Try a different search or create a company."
          />
        }
        sort={{ sortBy: sortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete company"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this company"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteCompany.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
