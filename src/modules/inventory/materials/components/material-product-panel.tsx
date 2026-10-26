"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { formatPricePerUnit } from "@/modules/inventory/format";
import type { Micron } from "@/modules/inventory/microns/schemas";
import type { Material } from "@/modules/inventory/materials/schemas";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDecimal } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

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
                {micron.name}
              </Button>
            ))}
          </div>
        </div>
        {priceLabel ? (
          <p className="text-muted-foreground shrink-0 text-sm">
            Price{" "}
            <span className="text-foreground font-medium tabular-nums">{priceLabel}</span>
          </p>
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
  loading,
  emptyMessage,
  emptyAction,
  rowActions,
  linkWidths = false,
  stickyHeader = false,
}: {
  materials: Material[];
  sizeUnitCode: string;
  highlightMaterialId?: string;
  loading?: boolean;
  emptyMessage: string;
  emptyAction?: ReactNode;
  rowActions?: (material: Material) => ReactNode;
  linkWidths?: boolean;
  stickyHeader?: boolean;
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

  const colSpan = rowActions ? 5 : 4;
  const headerRowClass = stickyHeader
    ? "bg-muted/95 hover:bg-muted/95 sticky top-0 z-10 shadow-sm backdrop-blur-sm"
    : "bg-muted/50 hover:bg-muted/50";

  return (
    <Table>
      <TableHeader>
        <TableRow className={headerRowClass}>
          <TableHead className="h-10 px-4">{`Width (${sizeUnitCode})`}</TableHead>
          <TableHead className="h-10 px-4 text-center">Total rolls</TableHead>
          <TableHead className="h-10 px-4 text-right">Total kg</TableHead>
          <TableHead className="h-10 w-[7rem] px-4">Status</TableHead>
          {rowActions ? <TableHead className="h-10 w-[1%] px-4" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="px-4 py-10 text-center">
              <p className="text-muted-foreground text-sm">{emptyMessage}</p>
              {emptyAction ? <div className="mt-3 flex justify-center">{emptyAction}</div> : null}
            </TableCell>
          </TableRow>
        ) : (
          materials.map((material) => (
            <TableRow
              key={material.id}
              className={cn(highlightMaterialId === material.id && "bg-primary/5")}
            >
              <TableCell className="px-4 py-3 font-medium tabular-nums">
                {linkWidths ? (
                  <Link
                    href={materialRoutes.view(material.id)}
                    className="hover:text-primary hover:underline"
                  >
                    {formatDecimal(material.size)}
                  </Link>
                ) : (
                  formatDecimal(material.size)
                )}
              </TableCell>
              <TableCell className="px-4 py-3 text-center tabular-nums font-medium">
                {formatDecimal(material.rolls_on_hand)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                {formatDecimal(material.total_kg)}
                {material.unit_code ? (
                  <span className="text-muted-foreground ml-1 text-xs uppercase">
                    {material.unit_code}
                  </span>
                ) : (
                  <span className="text-muted-foreground ml-1 text-xs uppercase">kg</span>
                )}
              </TableCell>
              <TableCell className="px-4 py-3">
                <ActiveBadge active={material.is_active} />
              </TableCell>
              {rowActions ? <TableCell className="px-4 py-3">{rowActions(material)}</TableCell> : null}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
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
