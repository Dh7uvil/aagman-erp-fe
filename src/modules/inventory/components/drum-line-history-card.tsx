"use client";

import { formatPricePerUnit } from "@/modules/inventory/format";
import type {
  DrumLineHistoryEntry,
  DrumLineHistorySummary,
} from "@/modules/inventory/schemas/drum-line-history";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatDateTime, formatDecimal } from "@/shared/lib/format";

function qty(value: string | number | null | undefined) {
  if (value == null) {
    return "";
  }
  return String(value);
}

function stockDirectionLabel(entry: Pick<DrumLineHistoryEntry, "action">) {
  if (entry.action === "OPENING") {
    return "Opening balance";
  }
  if (entry.action === "IN") {
    return "Stock in";
  }
  if (entry.action === "OUT") {
    return "Stock out";
  }
  return entry.action;
}

function LastPurchaseSummary({
  summary,
  canViewPrice,
}: {
  summary: DrumLineHistorySummary;
  canViewPrice: boolean;
}) {
  const hasLastStockIn =
    summary.last_purchase_date != null && summary.last_purchase_drums != null;
  const avgPriceLabel =
    canViewPrice && summary.avg_price_per_unit != null
      ? formatPricePerUnit(
          qty(summary.avg_price_per_unit),
          summary.price_unit_code ?? summary.last_purchase_price_unit_code,
        )
      : null;

  if (!hasLastStockIn && !avgPriceLabel) {
    return null;
  }

  const drums =
    hasLastStockIn && summary.last_purchase_drums != null
      ? formatDecimal(qty(summary.last_purchase_drums))
      : null;
  const dateLabel =
    summary.last_purchase_date != null ? formatDate(summary.last_purchase_date) : null;
  const priceLabel =
    canViewPrice && summary.last_purchase_price != null
      ? formatPricePerUnit(
          qty(summary.last_purchase_price),
          summary.last_purchase_price_unit_code,
        )
      : null;

  return (
    <div className="px-6 py-3">
      <div className="border-border/60 bg-muted/35 flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
          Last stock in
        </p>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4 sm:gap-x-6">
          {drums != null ? (
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">Drums</dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{drums}</dd>
            </div>
          ) : null}
          {priceLabel ? (
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">Last rate</dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{priceLabel}</dd>
            </div>
          ) : null}
          {avgPriceLabel ? (
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">Avg rate</dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{avgPriceLabel}</dd>
            </div>
          ) : null}
          {dateLabel ? (
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">Date</dt>
              <dd className="text-foreground mt-0.5 font-medium tabular-nums">{dateLabel}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

export function DrumLineHistoryCard({
  summary,
  entries,
  loading,
  canViewPrice,
  detailLabel,
}: {
  summary?: DrumLineHistorySummary;
  entries: DrumLineHistoryEntry[];
  loading?: boolean;
  canViewPrice: boolean;
  /** Second line dimension: adhesive code or ink color. */
  detailLabel: "Code" | "Color";
}) {
  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const unitCode = summary?.quantity_unit_code ?? "kg";

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <Card className="border-border/80 gap-0 overflow-hidden shadow-sm">
          <CardHeader className="border-border/60 bg-muted/25 gap-2 border-b pt-3 pb-2 [.border-b]:pb-2 sm:pt-3.5">
            <div className="text-foreground flex flex-col gap-3 text-sm leading-snug sm:flex-row sm:items-start sm:justify-between sm:text-base">
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span>
                  <span className="text-muted-foreground font-medium">Brand </span>
                  <span className="font-semibold">{summary.brand_name || "—"}</span>
                </span>
                <span className="text-muted-foreground" aria-hidden>
                  |
                </span>
                <span>
                  <span className="text-muted-foreground font-medium">{detailLabel} </span>
                  <span className="font-semibold">{summary.line_label || "—"}</span>
                </span>
              </p>
              <span className="shrink-0 font-bold tabular-nums sm:text-right">
                On hand: {formatDecimal(qty(summary.drums_on_hand))} drums ·{" "}
                {formatDecimal(qty(summary.total_qty))} {unitCode}
              </span>
            </div>
          </CardHeader>
          <LastPurchaseSummary summary={summary} canViewPrice={canViewPrice} />
        </Card>
      ) : null}

      <Card className="border-border/80 gap-0 overflow-hidden shadow-sm">
        <CardHeader className="border-border/60 bg-muted/15 border-b pt-4 pb-3 [.border-b]:pb-3">
          <CardTitle className="text-base font-semibold tracking-tight">Stock in &amp; out</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:px-6 sm:pb-4 sm:pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datetime</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Drums</TableHead>
                <TableHead>{unitCode}</TableHead>
                {canViewPrice ? <TableHead>Rate</TableHead> : null}
                <TableHead>User</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewPrice ? 7 : 6} className="text-muted-foreground">
                    No stock movements yet.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stockDirectionLabel(entry)}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.drums != null ? formatDecimal(qty(entry.drums)) : "—"}
                    </TableCell>
                    <TableCell>
                      {entry.quantity != null ? formatDecimal(qty(entry.quantity)) : "—"}
                    </TableCell>
                    {canViewPrice ? (
                      <TableCell>
                        {entry.price_per_unit != null
                          ? formatPricePerUnit(qty(entry.price_per_unit), entry.price_unit_code)
                          : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>{entry.user?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">{entry.note?.trim() || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
