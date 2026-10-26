"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAllMicrons } from "@/modules/inventory/microns/queries";
import {
  MaterialMicronSelector,
  MaterialVariantTable,
} from "@/modules/inventory/materials/components/material-product-panel";
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
import { useCan } from "@/shared/providers/session-provider";

export function MaterialProductViewScreen({ materialId }: { materialId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const can = useCan();
  const canViewPrice = can(inventoryPricePermissions.read);
  const { canCreate, canUpdate } = useCrudPermissions(materialPermissions);
  const { page, page_size, setPage, setPageSize } = useTableParams();

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
  const variantsMeta = variantsQuery.data?.meta;
  const sizeUnitCode = variants[0]?.size_unit_code || material?.size_unit_code || "mm";
  const editHref = `${materialRoutes.edit(materialId)}?micron=${selectedMicronId}`;
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
    <div className="flex h-[calc(100dvh-7.25rem)] min-h-[28rem] flex-col gap-4 overflow-hidden md:h-[calc(100dvh-8rem)] md:gap-5">
      <div className="shrink-0 space-y-4 md:space-y-5">
        <RecordPageHeader
          title={material.product_name}
          subtitle="Product stock by micron and width"
          listHref={materialRoutes.list}
          viewHref={materialRoutes.view(materialId)}
          editHref={editHref}
          canUpdate={canUpdate}
          mode="view"
          extraActions={
            canCreate ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={addSizeHref}>
                  <Plus className="size-4" />
                  Add size
                </Link>
              </Button>
            ) : null
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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <MaterialVariantTable
            materials={variants}
            sizeUnitCode={sizeUnitCode}
            highlightMaterialId={material.micron_id === selectedMicronId ? materialId : undefined}
            loading={variantsQuery.isLoading}
            stickyHeader
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
    </div>
  );
}
