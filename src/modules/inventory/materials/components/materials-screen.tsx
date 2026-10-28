"use client";

import { FolderPlus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { formatPricePerUnit } from "@/modules/inventory/format";
import { useAllCategories } from "@/modules/inventory/categories/queries";
import { useAllMicrons } from "@/modules/inventory/microns/queries";
import { CategoryQuickCreateDialog } from "@/modules/inventory/materials/components/category-quick-create-dialog";
import { MicronQuickCreateDialog } from "@/modules/inventory/materials/components/micron-quick-create-dialog";
import {
  MaterialsActiveFilterPills,
  MaterialsTableMoreFilters,
  materialsExtraFilterCount,
  materialsListQueryFromFilters,
} from "@/modules/inventory/materials/components/materials-table-filters";
import { useDeleteMaterial } from "@/modules/inventory/materials/mutations";
import { useMaterials } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import type { Material } from "@/modules/inventory/materials/schemas";
import {
  categoryPermissions,
  inventoryPricePermissions,
  materialPermissions,
} from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
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
import { formatDecimal } from "@/shared/lib/format";
import {
  isNonDefaultListActiveFilter,
  parseListActiveFilter,
} from "@/shared/lib/list-filters";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const SORT_FIELDS: SortFieldOption[] = [
  { value: "size", label: "Size" },
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
];
const SORT_BY = new Set(SORT_FIELDS.map((field) => field.value));

export function MaterialsScreen() {
  const router = useRouter();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(materialPermissions);
  const canCreateCategory = can(categoryPermissions.create);
  const deleteMaterial = useDeleteMaterial();
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [micronDialogOpen, setMicronDialogOpen] = useState(false);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const productId = filters.product_id;
  const micronId = filters.parent_id;
  const jpStockView = Boolean(productId && micronId);
  const sortBy = sort_by && SORT_BY.has(sort_by) ? sort_by : undefined;
  const effectiveSortBy = jpStockView ? (sortBy ?? "size") : sortBy;
  const effectiveSortOrder =
    jpStockView && !sort_by ? "asc" : effectiveSortBy ? sort_order : undefined;

  const stockFilters = materialsListQueryFromFilters(filters);
  const materialsQuery = useMaterials({
    page,
    page_size,
    search,
    sort_by: effectiveSortBy,
    sort_order: effectiveSortOrder,
    product_id: productId,
    parent_id: micronId,
    is_active: parseListActiveFilter(filters.active),
    ...stockFilters,
  });
  const categoriesQuery = useAllCategories();
  const micronsQuery = useAllMicrons(productId ?? undefined);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const materials = materialsQuery.data?.data ?? [];
  const meta = materialsQuery.data?.meta;
  const categories = categoriesQuery.data ?? [];
  const microns = micronsQuery.data ?? [];
  const selectedProduct = categories.find((item) => item.id === productId);
  const selectedMicron = microns.find((item) => item.id === micronId);
  const sizeUnitCode = materials[0]?.size_unit_code || "mm";
  const hasActiveFilters = Boolean(
    search ||
      productId ||
      micronId ||
      sortBy ||
      materialsExtraFilterCount(filters) > 0 ||
      isNonDefaultListActiveFilter(filters.active),
  );

  function clearMaterialsFilters() {
    setParams({
      search: null,
      sort_by: null,
      sort_order: null,
      filters: {
        product_id: null,
        parent_id: null,
        size: null,
        rolls: null,
        kg_lt: null,
        kg_gt: null,
        active: null,
      },
    });
  }

  const lastProductIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!productId) {
      lastProductIdRef.current = null;
      return;
    }
    if (productId !== lastProductIdRef.current) {
      lastProductIdRef.current = productId;
      if (!micronId && microns[0]) {
        setParams({ filters: { product_id: productId, parent_id: microns[0].id } });
      }
    }
  }, [productId, micronId, microns, setParams]);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteMaterial.mutateAsync(deleting.id);
      toast.success("Material deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<Material>> => {
    if (jpStockView) {
      const cols: Array<DataTableColumn<Material>> = [
        {
          id: "size",
          header: `Width (${sizeUnitCode})`,
          sortableField: "size",
          cell: (row) =>
            canRead ? (
              <Link href={materialRoutes.view(row.id)} className="font-medium hover:underline">
                {formatDecimal(row.size)}
              </Link>
            ) : (
              formatDecimal(row.size)
            ),
        },
        {
          id: "rolls",
          header: "Total rolls",
          cell: (row) => formatDecimal(row.rolls_on_hand),
        },
        {
          id: "total_kg",
          header: "Total kg",
          cell: (row) => formatDecimal(row.total_kg),
        },
      ];
      if (canViewPrice) {
        cols.push({
          id: "price_per_unit",
          header: "Price",
          defaultVisible: false,
          cell: (row) => formatPricePerUnit(row.price_per_unit, row.price_unit_code),
        });
      }
      cols.push(
        ...actionsColumn<Material>(showActions, (material) => (
          <DataTableRowActions
            entityName={material.size_label}
            onView={canRead ? () => router.push(materialRoutes.view(material.id)) : undefined}
            onEdit={canUpdate ? () => router.push(materialRoutes.edit(material.id)) : undefined}
            onDelete={canDelete ? () => setDeleting(material) : undefined}
          />
        )),
      );
      return cols;
    }

    const cols: Array<DataTableColumn<Material>> = [
      {
        id: "product",
        header: "Product",
        cell: (row) => row.product_name,
      },
      {
        id: "micron",
        header: "Micron",
        cell: (row) => row.micron_name,
      },
      {
        id: "size",
        header: "Size",
        sortableField: "size",
        cell: (row) => row.size_label || `${formatDecimal(row.size)} ${row.size_unit_code}`,
      },
      {
        id: "rolls",
        header: "Rolls",
        cell: (row) => formatDecimal(row.rolls_on_hand),
      },
      {
        id: "total_kg",
        header: "Total kg",
        cell: (row) => formatDecimal(row.total_kg),
      },
    ];
    if (canViewPrice) {
      cols.push({
        id: "price_per_unit",
        header: "Price",
        defaultVisible: false,
        cell: (row) => formatPricePerUnit(row.price_per_unit, row.price_unit_code),
      });
    }
    cols.push({
      id: "active",
      header: "Status",
      defaultVisible: false,
      cell: (row) => <ActiveBadge active={row.is_active} />,
    });
    cols.push(
      ...actionsColumn<Material>(showActions, (material) => (
        <DataTableRowActions
          entityName={material.name}
          onView={canRead ? () => router.push(materialRoutes.view(material.id)) : undefined}
          onEdit={canUpdate ? () => router.push(materialRoutes.edit(material.id)) : undefined}
          onDelete={canDelete ? () => setDeleting(material) : undefined}
        />
      )),
    );
    return cols;
  }, [
    canDelete,
    canRead,
    canUpdate,
    canViewPrice,
    jpStockView,
    router,
    showActions,
    sizeUnitCode,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.materials", columnDefs);
  const listView = useListView("inventory.materials");

  const emptyMessage = !productId
    ? "Select a product to view width variants."
    : !micronId
      ? "Select a micron to view sizes and stock."
      : "No variants yet.";

  return (
    <ListPage>
      <PageHeader
        title={
          selectedProduct ? `Product: ${selectedProduct.name}` : "Materials"
        }
        subtitle={
          selectedMicron
            ? [
                `Microns: ${selectedMicron.name}`,
                canViewPrice && selectedMicron.price_per_unit
                  ? `Price ${formatPricePerUnit(
                      selectedMicron.price_per_unit,
                      selectedMicron.price_unit_code,
                    )}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : "Pick a product and micron to browse sizes like JPStock."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreateCategory ? (
              <Button variant="outline" type="button" onClick={() => setCategoryDialogOpen(true)}>
                <FolderPlus className="size-4" />
                Add product
              </Button>
            ) : null}
            {canCreateCategory ? (
              <Button variant="outline" type="button" onClick={() => setMicronDialogOpen(true)}>
                <FolderPlus className="size-4" />
                Add micron
              </Button>
            ) : null}
            {canCreate ? (
              <Button asChild>
                <Link href={materialRoutes.new}>
                  <Plus className="size-4" />
                  Add material
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="flex flex-col gap-2">
        <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search materials…"
        />
        <FilterSelect
          label="Product"
          className="w-full sm:w-52"
          placeholder="All products"
          value={productId ?? ALL}
          onValueChange={(value) =>
            setParams({
              filters: {
                product_id: value === ALL ? null : value,
                parent_id: null,
              },
            })
          }
          options={[
            { value: ALL, label: "All products" },
            ...categories.map((item) => ({ value: item.id, label: item.name })),
          ]}
        />
        <FilterSelect
          label="Micron"
          className="w-full sm:w-44"
          placeholder="Micron"
          disabled={!productId}
          value={micronId ?? ALL}
          onValueChange={(value) =>
            setParams({
              filters: {
                product_id: productId ?? null,
                parent_id: value === ALL ? null : value,
              },
            })
          }
          options={
            productId
              ? [
                  { value: ALL, label: "All microns" },
                  ...microns.map((item) => ({ value: item.id, label: item.name })),
                ]
              : [{ value: ALL, label: "Select a product first" }]
          }
        />
        <MaterialsTableMoreFilters />
        <SortDialog fields={SORT_FIELDS} sortBy={sortBy} sortOrder={sort_order} onApply={setParams} />
        <ListViewToolbarControls
          listView={listView}
          columnsDialog={columnsDialog}
          mobileFullRow
        />
      </DataTableToolbar>
        <MaterialsActiveFilterPills
          productName={selectedProduct?.name}
          micronName={selectedMicron?.name}
          sortFields={SORT_FIELDS}
          onClearAll={hasActiveFilters ? clearMaterialsFilters : undefined}
        />
      </div>
      <ListView
        columns={columns}
        colSpan={colSpan}
        rows={materials}
        getRowKey={(material) => material.id}
        getRowLabel={(material) => material.size_label}
        onRowClick={canRead ? (material) => router.push(materialRoutes.view(material.id)) : undefined}
        isLoading={materialsQuery.isLoading}
        isError={materialsQuery.isError}
        error={
          <DataTableError
            message={getErrorMessage(materialsQuery.error)}
            onRetry={() => materialsQuery.refetch()}
          />
        }
        empty={<DataTableEmpty message={emptyMessage} />}
        sort={{ sortBy: effectiveSortBy, sortOrder: sort_order, onSort: setParams }}
        listView={listView}
        footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}
      />
      <CategoryQuickCreateDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
      <MicronQuickCreateDialog
        open={micronDialogOpen}
        onOpenChange={setMicronDialogOpen}
        defaultProductId={productId ?? undefined}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete material"
        description={`Delete "${deleting?.size_label}"? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteMaterial.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </ListPage>
  );
}
