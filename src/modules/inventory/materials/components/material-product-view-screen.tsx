"use client";

import Link from "next/link";
import { History, MinusCircle, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  MaterialMicronSelector,
  MaterialVariantTable,
} from "@/modules/inventory/materials/components/material-product-panel";
import { stockOutButtonClassName } from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { MaterialStockOutDialog } from "@/modules/inventory/materials/components/material-stock-out-dialog";
import type { Material } from "@/modules/inventory/materials/schemas";
import { useMaterial, useMaterials } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import { inventoryPricePermissions, materialPermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableError } from "@/shared/components/data-table/states";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { historyHref } from "@/shared/lib/history";
import { useCan } from "@/shared/providers/session-provider";

export function MaterialProductViewScreen({ materialId }: { materialId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const canViewHistory = can(materialPermissions.history);
  const { canCreate, canUpdate } = useCrudPermissions(materialPermissions);
  const { page, page_size, setPage, setPageSize } = useTableParams();
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockOutMaterialId, setStockOutMaterialId] = useState<string | undefined>();

  const materialQuery = useMaterial(materialId);
  const material = materialQuery.data;
  const productId = material?.product_id ?? "";
  const micronFromQuery = searchParams.get("micron");
  const selectedMicronId = micronFromQuery || material?.micron_id || "";

  const micronsQuery = useAllMicrons(productId || undefined, Boolean(productId));
  const microns = micronsQuery.data ?? [];
  const selectedMicron = microns.find((item) => item.id === selectedMicronId);

  const variantsQuery = useMaterials(
    {
      parent_id: selectedMicronId || undefined,
      page,
      page_size,
      sort_by: "size",
      sort_order: "asc",
    },
    Boolean(selectedMicronId),
  );

  const variantsLoading =
    variantsQuery.isLoading ||
    (variantsQuery.isFetching && variantsQuery.isPlaceholderData);
  const variants = variantsLoading ? [] : (variantsQuery.data?.data ?? []);
  const variantsMeta = variantsLoading ? undefined : variantsQuery.data?.meta;
  const sizeUnitCode =
    variantsQuery.data?.data?.[0]?.size_unit_code || material?.size_unit_code || "mm";
  const editHref = materialRoutes.edit(materialId, selectedMicronId);
  const addSizeHref = `${editHref}&addSize=1`;

  const prevMicronRef = useRef(selectedMicronId);
  useEffect(() => {
    if (prevMicronRef.current !== selectedMicronId) {
      prevMicronRef.current = selectedMicronId;
      if (page > 1) {
        setPage(1);
      }
    }
  }, [selectedMicronId, page, setPage]);

  function selectMicron(micronId: string) {
    router.push(`${materialRoutes.view(materialId)}?micron=${micronId}`);
  }

  function openStockOut(row?: Material) {
    setStockOutMaterialId(row?.id ?? materialId);
    setStockOutOpen(true);
  }

  if (materialQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (materialQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(materialQuery.error)}
        onRetry={() => materialQuery.refetch()}
      />
    );
  }

  if (!material) {
    return <p className="text-muted-foreground text-sm">Material not found.</p>;
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 md:h-[calc(100dvh-8rem)] md:min-h-[28rem] md:gap-5 md:overflow-hidden">
      <div className="shrink-0 space-y-4 md:space-y-5">
        <RecordPageHeader
          title={material.product_name}
          subtitle={
            material.company_name
              ? `${material.company_name} · Product stock by micron and width`
              : "Product stock by micron and width"
          }
          listHref={materialRoutes.list}
          viewHref={materialRoutes.view(materialId)}
          editHref={editHref}
          canUpdate={canUpdate}
          mode="view"
          extraActions={
            <>
              {canUpdate && selectedMicronId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={stockOutButtonClassName}
                  onClick={() => openStockOut()}
                >
                  <MinusCircle className="size-4" />
                  Stock out
                </Button>
              ) : null}
              {canCreate ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={addSizeHref}>
                    <Plus className="size-4" />
                    Add size
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />

        {productId && microns.length > 0 ? (
          <MaterialMicronSelector
            microns={microns}
            selectedMicronId={selectedMicronId}
            materialId={materialId}
            selectedMicron={selectedMicron}
            canViewPrice={canViewPrice}
            onSelectMicron={selectMicron}
          />
        ) : null}
      </div>

      <section className="flex flex-col rounded-lg border bg-card shadow-sm md:min-h-0 md:flex-1 md:overflow-hidden">
        <div className="md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-y-contain">
          <MaterialVariantTable
            materials={variants}
            sizeUnitCode={sizeUnitCode}
            highlightMaterialId={material.micron_id === selectedMicronId ? materialId : undefined}
            loading={variantsLoading}
            stickyHeader
            canViewPrice={canViewPrice}
            emptyMessage={
              canCreate
                ? "No sizes stocked for this micron yet."
                : "No variants available for this micron."
            }
            emptyAction={
              canCreate ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={addSizeHref}>
                    <Plus className="size-4" />
                    Add first size
                  </Link>
                </Button>
              ) : undefined
            }
            rowActions={
              canViewHistory || canUpdate
                ? (row) => (
                    <div className="flex items-center justify-end gap-0.5">
                      {canUpdate && row.is_active ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label="Stock out"
                          onClick={() => openStockOut(row)}
                        >
                          <MinusCircle className="size-4" />
                        </Button>
                      ) : null}
                      {canViewHistory ? (
                        <Button type="button" size="sm" variant="ghost" asChild>
                          <Link
                            href={historyHref("materials", row.id, row.name)}
                            aria-label="History"
                          >
                            <History className="size-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  )
                : undefined
            }
          />
        </div>
        {variantsMeta && variantsMeta.total > 0 ? (
          <div className="shrink-0 border-t bg-card pb-1">
            <DataTablePagination
              meta={{ ...variantsMeta, page_size }}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              rangeItemLabel="widths"
            />
          </div>
        ) : null}
      </section>

      {canUpdate && selectedMicronId ? (
        <MaterialStockOutDialog
          open={stockOutOpen}
          onOpenChange={setStockOutOpen}
          materials={variants}
          initialMaterialId={stockOutMaterialId}
          micronName={selectedMicron?.name}
        />
      ) : null}
    </div>
  );
}
