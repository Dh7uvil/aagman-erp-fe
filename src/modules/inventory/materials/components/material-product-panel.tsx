"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { formatMicronLabel, formatPricePerUnit } from "@/modules/inventory/format";
import type { Micron } from "@/modules/inventory/microns/schemas";
import type { Material } from "@/modules/inventory/materials/schemas";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

function widthCellContent(
  material: Material,
  sizeUnitCode: string,
  linked: boolean,
) {
  const unit = material.size_unit_code || sizeUnitCode || "mm";
  const sizeText = (
    <>
      {formatDecimal(material.size)}
      <span className="text-muted-foreground ml-1 text-xs">{unit}</span>
    </>
  );
  if (linked) {
    return (
      <Link
        href={materialRoutes.view(material.id)}
        className="hover:text-primary hover:underline"
      >
        {sizeText}
      </Link>
    );
  }
  return sizeText;
}

export function MaterialMicronSelector({
  microns,
  selectedMicronId,
  materialId,
  selectedMicron,
  canViewPrice,
  onSelectMicron,
}: {
  microns: Micron[];
  selectedMicronId: string;
  materialId: string;
  selectedMicron?: Micron;
  canViewPrice: boolean;
  onSelectMicron?: (micronId: string) => void;
}) {
  const router = useRouter();

  if (microns.length === 0) {
    return null;
  }

  const priceLabel =
    canViewPrice && selectedMicron?.price_per_unit
      ? formatPricePerUnit(selectedMicron.price_per_unit, selectedMicron.price_unit_code)
      : null;
  const avgPriceLabel =
    canViewPrice && selectedMicron?.avg_price_per_unit
      ? formatPricePerUnit(selectedMicron.avg_price_per_unit, selectedMicron.price_unit_code)
      : null;

  return (
    <section className="rounded-lg border bg-card px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="text-muted-foreground shrink-0 text-xs font-medium tracking-wide uppercase">
            Micron
          </p>
          <div className="flex flex-wrap gap-2">
            {microns.map((micron) => (
              <Button
                key={micron.id}
                type="button"
                size="sm"
                variant={micron.id === selectedMicronId ? "default" : "outline"}
                className={cn(
                  "min-w-[3rem]",
                  micron.id !== selectedMicronId && "text-muted-foreground",
                )}
                onClick={() => {
                  if (onSelectMicron) {
                    onSelectMicron(micron.id);
                    return;
                  }
                  const params = new URLSearchParams({ micron: micron.id });
                  router.push(`${materialRoutes.view(materialId)}?${params.toString()}`);
                }}
              >
                {micron.id === selectedMicronId
                  ? formatMicronLabel(micron.name)
                  : micron.name}
              </Button>
            ))}
          </div>
        </div>
        {priceLabel || avgPriceLabel ? (
          <div className="flex shrink-0 flex-wrap items-baseline justify-center gap-x-4 gap-y-1 text-sm">
            {priceLabel ? (
              <p className="leading-snug">
                <span className="text-muted-foreground">Curr. Price : </span>
                <span className="text-foreground font-medium tabular-nums">{priceLabel}</span>
              </p>
            ) : null}
            {priceLabel && avgPriceLabel ? (
              <span className="text-muted-foreground/60 select-none" aria-hidden>
                |
              </span>
            ) : null}
            {avgPriceLabel ? (
              <p className="leading-snug">
                <span className="text-muted-foreground">Avg. Price : </span>
                <span className="text-foreground font-medium tabular-nums">{avgPriceLabel}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated Use MaterialMicronSelector */
export function MaterialMicronChips(props: {
  microns: Micron[];
  selectedMicronId: string;
  materialId: string;
  onSelectMicron?: (micronId: string) => void;
}) {
  return (
    <MaterialMicronSelector
      {...props}
      selectedMicron={props.microns.find((m) => m.id === props.selectedMicronId)}
      canViewPrice={false}
    />
  );
}

export function MaterialVariantTable({
  materials,
  sizeUnitCode,
  highlightMaterialId,
  previewMaterialId,
  loading,
  emptyMessage,
  emptyAction,
  rowActions,
  linkWidths = false,
  selectableWidths = false,
  onWidthHover,
  onWidthSelect,
  stickyHeader = false,
  canViewPrice = false,
  actionsColumn = false,
  actionsColumnHeader = "Actions",
}: {
  materials: Material[];
  sizeUnitCode: string;
  highlightMaterialId?: string;
  /** Row highlighted on hover before click (e.g. breadcrumb preview). */
  previewMaterialId?: string;
  loading?: boolean;
  emptyMessage: string;
  emptyAction?: ReactNode;
  rowActions?: (material: Material) => ReactNode;
  linkWidths?: boolean;
  selectableWidths?: boolean;
  onWidthHover?: (material: Material | null) => void;
  onWidthSelect?: (material: Material) => void;
  stickyHeader?: boolean;
  canViewPrice?: boolean;
  /** Dedicated actions column (e.g. stock out, history). */
  actionsColumn?: boolean;
  actionsColumnHeader?: string;
}) {
  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-2 h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-2 h-8 w-full" />
      </div>
    );
  }

  const showActionsColumn = actionsColumn || Boolean(rowActions);
  const priceColumns = canViewPrice ? 1 : 0;
  const columnCount = 4 + priceColumns + (showActionsColumn ? 1 : 0);
  const colSpan = columnCount;
  const headerRowClass = stickyHeader
    ? "bg-muted/95 hover:bg-muted/95 sticky top-0 z-10 shadow-sm backdrop-blur-sm"
    : "bg-muted/50 hover:bg-muted/50";

  function isRowActionTarget(target: EventTarget | null) {
    return target instanceof Element && Boolean(target.closest("[data-row-action]"));
  }

  const widthColPercent = 20;
  const evenColCount = columnCount - 1;
  const evenColPercent = evenColCount > 0 ? (100 - widthColPercent) / evenColCount : 0;
  const variantColWidths = [
    `${widthColPercent}%`,
    ...Array.from({ length: evenColCount }, () => `${evenColPercent}%`),
  ];

  const headBase = "h-10 min-w-0 px-3 sm:min-w-0";
  const headCenter = cn(headBase, "text-center");
  const cellCenter = "px-3 py-3 text-center align-middle";

  function variantHighlightClass(material: Material) {
    return cn(
      selectableWidths && "cursor-pointer",
      selectableWidths &&
        highlightMaterialId !== material.id &&
        previewMaterialId !== material.id &&
        "hover:bg-muted/45",
      highlightMaterialId === material.id && "bg-primary/5",
      previewMaterialId === material.id &&
        previewMaterialId !== highlightMaterialId &&
        "bg-muted/60",
    );
  }

  function variantSelectHandler(material: Material) {
    return selectableWidths
      ? (event: MouseEvent) => {
          if (isRowActionTarget(event.target)) {
            return;
          }
          onWidthSelect?.(material);
        }
      : undefined;
  }

  const emptyContent = (
    <>
      <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      {emptyAction ? <div className="mt-3 flex justify-center">{emptyAction}</div> : null}
    </>
  );

  const variantCards = (
    <ul className="flex flex-col gap-2.5 lg:hidden">
      {materials.length === 0 ? (
        <li className="px-4 py-10 text-center">{emptyContent}</li>
      ) : (
        materials.map((material) => (
          <li key={material.id}>
            <Card
              className={cn("overflow-hidden py-0", variantHighlightClass(material))}
              onMouseEnter={selectableWidths ? () => onWidthHover?.(material) : undefined}
              onClick={variantSelectHandler(material)}
            >
              <div className="flex flex-col gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-medium">{`Width (${sizeUnitCode})`}</p>
                  <p
                    className={cn(
                      "font-medium tabular-nums",
                      selectableWidths &&
                        highlightMaterialId === material.id &&
                        "text-primary",
                    )}
                  >
                    {widthCellContent(material, sizeUnitCode, linkWidths)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Total rolls</p>
                    <p className="tabular-nums font-medium">{formatDecimal(material.rolls_on_hand)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Total kg</p>
                    <p className="tabular-nums font-medium">
                      {formatDecimal(material.total_kg)}
                      {material.unit_code ? (
                        <span className="text-muted-foreground ml-1 text-xs uppercase">
                          {material.unit_code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground ml-1 text-xs uppercase">kg</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">Status</p>
                    <ActiveBadge active={material.is_active} />
                  </div>
                  {canViewPrice ? (
                    <div>
                      <p className="text-muted-foreground text-xs font-medium">Avg price</p>
                      <p className="tabular-nums text-sm">
                        {formatPricePerUnit(
                          material.avg_price_per_unit ?? null,
                          material.price_unit_code,
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>
                {showActionsColumn ? (
                  <div
                    className="flex flex-wrap items-center gap-0.5"
                    data-row-action
                    onClick={(event) => event.stopPropagation()}
                  >
                    {rowActions?.(material) ?? (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                ) : null}
              </div>
            </Card>
          </li>
        ))
      )}
    </ul>
  );

  const variantTable = (
    <div className="hidden lg:block">
    <Table className="table-fixed">
      <colgroup>
        {variantColWidths.map((width, index) => (
          <col key={index} style={{ width }} />
        ))}
      </colgroup>
      <TableHeader>
        <TableRow className={headerRowClass}>
          <TableHead className={headBase}>{`Width (${sizeUnitCode})`}</TableHead>
          <TableHead className={headCenter}>Total rolls</TableHead>
          <TableHead className={headCenter}>Total kg</TableHead>
          <TableHead className={headCenter}>Status</TableHead>
          {canViewPrice ? <TableHead className={headCenter}>Avg price</TableHead> : null}
          {showActionsColumn ? (
            <TableHead className={headCenter}>{actionsColumnHeader}</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody
        onMouseLeave={selectableWidths ? () => onWidthHover?.(null) : undefined}
      >
        {materials.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="px-4 py-10 text-center">
              {emptyContent}
            </TableCell>
          </TableRow>
        ) : (
          materials.map((material) => (
            <TableRow
              key={material.id}
              className={variantHighlightClass(material)}
              onMouseEnter={selectableWidths ? () => onWidthHover?.(material) : undefined}
              onClick={variantSelectHandler(material)}
            >
              <TableCell
                className={cn(
                  "px-3 py-3 font-medium tabular-nums",
                  selectableWidths &&
                    highlightMaterialId === material.id &&
                    "text-primary",
                )}
              >
                {widthCellContent(material, sizeUnitCode, linkWidths)}
              </TableCell>
              <TableCell className={cn(cellCenter, "tabular-nums font-medium")}>
                {formatDecimal(material.rolls_on_hand)}
              </TableCell>
              <TableCell className={cn(cellCenter, "tabular-nums font-medium")}>
                {formatDecimal(material.total_kg)}
                {material.unit_code ? (
                  <span className="text-muted-foreground ml-1 text-xs uppercase">
                    {material.unit_code}
                  </span>
                ) : (
                  <span className="text-muted-foreground ml-1 text-xs uppercase">kg</span>
                )}
              </TableCell>
              <TableCell className={cellCenter}>
                <div className="flex justify-center">
                  <ActiveBadge active={material.is_active} />
                </div>
              </TableCell>
              {canViewPrice ? (
                <TableCell className={cn(cellCenter, "tabular-nums text-sm")}>
                  {formatPricePerUnit(
                    material.avg_price_per_unit ?? null,
                    material.price_unit_code,
                  )}
                </TableCell>
              ) : null}
              {showActionsColumn ? (
                <TableCell
                  className={cellCenter}
                  data-row-action
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    {rowActions?.(material) ?? (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    </div>
  );

  return (
    <>
      {variantCards}
      {variantTable}
    </>
  );
}

export function materialProductSubtitle(
  micron: Micron | undefined,
  canViewPrice: boolean,
): string | undefined {
  if (!micron) {
    return undefined;
  }
  const parts = [`Micron ${micron.name}`];
  if (canViewPrice && micron.price_per_unit) {
    parts.push(
      `Price ${formatPricePerUnit(micron.price_per_unit, micron.price_unit_code)}`,
    );
  }
  return parts.join(" · ");
}
