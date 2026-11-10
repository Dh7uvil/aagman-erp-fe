"use client";

import Link from "next/link";
import { History, MinusCircle, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  MaterialMicronSelector,
  MaterialVariantTable,
} from "@/modules/inventory/materials/components/material-product-panel";
import {
  stockOutButtonClassName,
  stockOutIconButtonClassName,
} from "@/modules/inventory/materials/components/material-stock-out-button-styles";
import { MaterialStockOutDialog } from "@/modules/inventory/materials/components/material-stock-out-dialog";
import type { Material } from "@/modules/inventory/materials/schemas";
import { useMaterial, useMaterials } from "@/modules/inventory/materials/queries";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import { formatMaterialSizeMicronLabel } from "@/modules/inventory/format";
import {
  materialProductMicronBreadcrumbCrumbs,
  materialViewBreadcrumbCrumbs,
} from "@/modules/inventory/materials/material-breadcrumb";
import { inventoryPricePermissions, materialPermissions } from "@/modules/inventory/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { TableActionTooltip } from "@/shared/components/data-table/row-actions";
import { DataTableError } from "@/shared/components/data-table/states";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { historyHref } from "@/shared/lib/history";
import { useSetBreadcrumbTrail } from "@/shared/components/layout/breadcrumb-record";
import { useCan } from "@/shared/providers/session-provider";

function findVariant(variants: Material[], id: string | null | undefined) {
  if (!id) {
    return undefined;
  }
  return variants.find((row) => row.id === id);
}

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
  const [previewSkuId, setPreviewSkuId] = useState<string | null>(null);
  const [selectedSkuId, setSelectedSkuId] = useState(materialId);

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

  const variants = variantsQuery.data?.data ?? [];
  const variantsLoading = variantsQuery.isLoading && variants.length === 0;
  const variantsMeta = variantsQuery.data?.meta;
  const sizeUnitCode = variants[0]?.size_unit_code || material?.size_unit_code || "mm";
  const editHref = materialRoutes.edit(selectedSkuId, selectedMicronId);
  const addSizeHref = `${editHref}&addSize=1`;
  const viewHref =
    selectedMicronId != null && selectedMicronId !== ""
      ? `${materialRoutes.view(selectedSkuId)}?micron=${encodeURIComponent(selectedMicronId)}`
      : materialRoutes.view(selectedSkuId);

  function syncSelectedSkuUrl(skuId: string, micronId?: string) {
    const micron =
      micronId || selectedMicronId || findVariant(variants, skuId)?.micron_id || "";
    const path =
      micron !== ""
        ? `${materialRoutes.view(skuId)}?micron=${encodeURIComponent(micron)}`
        : materialRoutes.view(skuId);
    window.history.replaceState(window.history.state, "", path);
  }

  const prevMicronRef = useRef(selectedMicronId);
  useEffect(() => {
    if (prevMicronRef.current !== selectedMicronId) {
      prevMicronRef.current = selectedMicronId;
      setPreviewSkuId(null);
      if (page > 1) {
        setPage(1);
      }
    }
  }, [selectedMicronId, page, setPage]);

  useEffect(() => {
    setPreviewSkuId(null);
    setSelectedSkuId(materialId);
  }, [materialId]);

  function selectMicron(micronId: string) {
    setPreviewSkuId(null);
    router.push(`${materialRoutes.view(selectedSkuId)}?micron=${micronId}`);
  }

  function selectWidth(row: Material) {
    if (row.id === selectedSkuId) {
      setPreviewSkuId(null);
      syncSelectedSkuUrl(row.id, row.micron_id);
      return;
    }
    setSelectedSkuId(row.id);
    setPreviewSkuId(null);
    syncSelectedSkuUrl(row.id, row.micron_id);
  }

  function openStockOut(row?: Material) {
    setStockOutMaterialId(row?.id ?? selectedSkuId);
    setStockOutOpen(true);
  }

  const micronName = selectedMicron?.name ?? material?.micron_name ?? "";

  const activeSku = useMemo(() => {
    const preview = findVariant(variants, previewSkuId);
    if (preview) {
      return preview;
    }
    const selected = findVariant(variants, selectedSkuId);
    if (selected) {
      return selected;
    }
    if (material?.id === materialId && material.micron_id === selectedMicronId) {
      return material;
    }
    return null;
  }, [previewSkuId, selectedSkuId, variants, material, materialId, selectedMicronId]);

  const tableFocusedSkuId = activeSku?.id ?? selectedSkuId;

  const breadcrumbTrail = useMemo(() => {
    const productName = material?.product_name ?? activeSku?.product_name;
    if (!productName) {
      return null;
    }
    if (activeSku) {
      return materialViewBreadcrumbCrumbs(
        { ...activeSku, product_name: productName },
        selectedMicronId,
        micronName,
      );
    }
    if (material) {
      return materialProductMicronBreadcrumbCrumbs(material, selectedMicronId, micronName);
    }
    return null;
  }, [material, activeSku, selectedMicronId, micronName]);
  useSetBreadcrumbTrail(breadcrumbTrail);

  if (materialQuery.isPending && !material) {
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
    <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100dvh-8rem)] lg:min-h-[28rem] lg:gap-5 lg:overflow-hidden">
      <div className="shrink-0 space-y-4 md:space-y-5">
        <RecordPageHeader
          title={material.product_name}
          manageBreadcrumb={false}
          subtitle={
            material.company_name
              ? `${material.company_name}`
              : "Product stock by micron and width"
          }
          listHref={materialRoutes.list}
          viewHref={viewHref}
          editHref={editHref}
          canUpdate={canUpdate}
          mode="view"
          splitSecondaryActionsOnMobile
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
            materialId={selectedSkuId}
            selectedMicron={selectedMicron}
            canViewPrice={canViewPrice}
            onSelectMicron={selectMicron}
          />
        ) : null}
      </div>

      <section className="flex flex-col rounded-lg border bg-card shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-y-contain">
          <MaterialVariantTable
            materials={variants}
            sizeUnitCode={sizeUnitCode}
            highlightMaterialId={tableFocusedSkuId}
            previewMaterialId={
              previewSkuId && previewSkuId !== tableFocusedSkuId ? previewSkuId : undefined
            }
            selectableWidths
            onWidthHover={(row) => {
              if (!row) {
                setPreviewSkuId(null);
                return;
              }
              if (row.id === selectedSkuId) {
                setPreviewSkuId(null);
                return;
              }
              setPreviewSkuId(row.id);
            }}
            onWidthSelect={selectWidth}
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
            actionsColumn={canViewHistory || canUpdate}
            rowActions={
              canViewHistory || canUpdate
                ? (row) => (
                    <>
                      {canUpdate && row.is_active ? (
                        <TableActionTooltip label="Stock out">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className={stockOutIconButtonClassName}
                            aria-label="Stock out"
                            onClick={() => openStockOut(row)}
                          >
                            <MinusCircle className="size-3.5" />
                          </Button>
                        </TableActionTooltip>
                      ) : null}
                      {canViewHistory ? (
                        <TableActionTooltip label="History">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label="History"
                            asChild
                          >
                            <Link
                              href={historyHref(
                                "materials",
                                row.id,
                                formatMaterialSizeMicronLabel(row),
                              )}
                            >
                              <History className="size-3.5" />
                            </Link>
                          </Button>
                        </TableActionTooltip>
                      ) : null}
                    </>
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
