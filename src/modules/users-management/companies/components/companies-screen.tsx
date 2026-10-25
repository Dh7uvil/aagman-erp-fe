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
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
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
          {companiesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : companiesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(companiesQuery.error)}
                  onRetry={() => companiesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : companies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No companies found"
                  message="Try a different search or create a company."
                />
              </TableCell>
            </TableRow>
          ) : (
            companies.map((company) => (
              <TableRow key={company.id}>
                <DataTableCells row={company} columns={columns} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
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
