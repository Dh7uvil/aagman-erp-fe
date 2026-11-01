"use client";

import { formatPricePerUnit } from "@/modules/inventory/format";
import type {
  MaterialHistoryEntry,
  MaterialHistorySummary,
} from "@/modules/inventory/materials/schemas";
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
import { formatDate, formatDecimal } from "@/shared/lib/format";

function qty(value: string | number | null | undefined) {
  if (value == null) {
    return "";
  }
  return String(value);
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function stockDirectionLabel(action: string) {
  if (action === "IN") {
    return "Stock in";
  }
  if (action === "OUT") {
    return "Stock out";
  }
  return action;
}

function stockHistoryEntries(entries: MaterialHistoryEntry[]) {
  return entries.filter(
    (entry) => entry.kind === "stock" && (entry.action === "IN" || entry.action === "OUT"),
  );
}

const MATERIAL_STOCK_SPLIT_NOTES = new Set([
  "Roll count updated from material",
  "Quantity updated from material",
  "Stock updated from material",
]);

function parseHistoryQty(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumHistoryQty(...values: (string | number | null | undefined)[]) {
  const total = values.reduce<number>((sum, value) => sum + parseHistoryQty(value), 0);
  return total === 0 ? null : String(total);
}

function shouldMergeStockHistoryRows(a: MaterialHistoryEntry, b: MaterialHistoryEntry) {
  if (a.action !== b.action) {
    return false;
  }
  if ((a.user?.id ?? "") !== (b.user?.id ?? "")) {
    return false;
  }
  if ((a.company_id ?? null) !== (b.company_id ?? null)) {
    return false;
  }
  const aTime = new Date(a.timestamp).getTime();
  const bTime = new Date(b.timestamp).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime) || Math.abs(aTime - bTime) > 5000) {
    return false;
  }
  const aNote = a.note?.trim() ?? "";
  const bNote = b.note?.trim() ?? "";
  if (MATERIAL_STOCK_SPLIT_NOTES.has(aNote) && MATERIAL_STOCK_SPLIT_NOTES.has(bNote)) {
    return true;
  }
  return Math.abs(aTime - bTime) <= 1000;
}

/** Pairs split roll/kg lines from the same material save into one ledger row. */
function mergeStockHistoryEntries(entries: MaterialHistoryEntry[]) {
  const merged: MaterialHistoryEntry[] = [];
  for (const entry of entries) {
    const previous = merged[merged.length - 1];
    if (previous && shouldMergeStockHistoryRows(previous, entry)) {
      merged[merged.length - 1] = {
        ...previous,
        rolls: sumHistoryQty(previous.rolls, entry.rolls),
        kilograms: sumHistoryQty(previous.kilograms, entry.kilograms),
        note:
          previous.note && entry.note && previous.note !== entry.note
            ? "Stock updated from material"
            : (previous.note ?? entry.note),
      };
    } else {
      merged.push({ ...entry });
    }
  }
  return merged;
}

function formatMicronLabel(micronName: string) {
  const trimmed = micronName.trim();
  if (!trimmed) {
    return "—";
  }
  return /\bmic\b/i.test(trimmed) ? trimmed : `${trimmed} mic`;
}

export function formatMaterialHistorySkuTitle(summary: MaterialHistorySummary) {
  return `${summary.product_name} · ${summary.size_label} x ${formatMicronLabel(summary.micron_name)}`;
}

function LastPurchaseSummary({
  summary,
  canViewPrice,
}: {
  summary: MaterialHistorySummary;
  canViewPrice: boolean;
}) {
  if (summary.last_purchase_date == null || summary.last_purchase_rolls == null) {
    return null;
  }

  const rolls = formatDecimal(qty(summary.last_purchase_rolls));
  const dateLabel = formatDate(summary.last_purchase_date);
  const priceLabel =
    canViewPrice && summary.last_purchase_price != null
      ? formatPricePerUnit(qty(summary.last_purchase_price), summary.last_purchase_price_unit_code)
      : null;

  return (
    <CardContent className="py-3">
      <div className="border-border/60 bg-muted/35 flex flex-col gap-3 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-6">
        <p className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wide uppercase">
          Last purchase
        </p>
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 sm:gap-x-6">
          <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">Rolls</dt>
            <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{rolls}</dd>
          </div>
          {priceLabel ? (
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">Price</dt>
              <dd className="text-foreground mt-0.5 font-semibold tabular-nums">{priceLabel}</dd>
            </div>
          ) : null}
          <div className="min-w-0">
            <dt className="text-muted-foreground text-xs">Date</dt>
            <dd className="text-foreground mt-0.5 font-medium tabular-nums">{dateLabel}</dd>
          </div>
        </dl>
      </div>
    </CardContent>
  );
}

export function MaterialHistoryCard({
  summary,
  entries,
  loading,
  canViewPrice,
}: {
  summary?: MaterialHistorySummary;
  entries: MaterialHistoryEntry[];
  loading?: boolean;
  canViewPrice: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const ledgerEntries = mergeStockHistoryEntries(stockHistoryEntries(entries));

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <Card className="border-border/80 gap-0 overflow-hidden shadow-sm">
          <CardHeader className="border-border/60 bg-muted/25 gap-2 border-b py-3 sm:py-4">
            <p className="text-foreground text-sm leading-snug sm:text-base">
              {summary.company_name ? (
                <span className="text-muted-foreground">{summary.company_name} · </span>
              ) : null}
              <span className="font-semibold">{formatMaterialHistorySkuTitle(summary)}</span>
              <span className="text-muted-foreground"> · </span>
              <span className="font-bold tabular-nums">
                On hand: {formatDecimal(qty(summary.rolls_on_hand))} rolls ·{" "}
                {formatDecimal(qty(summary.total_kg))} kg
              </span>
            </p>
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
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rolls</TableHead>
                <TableHead>Kg</TableHead>
                <TableHead>Company</TableHead>
                {canViewPrice ? <TableHead>Price</TableHead> : null}
                <TableHead>User</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canViewPrice ? 8 : 7} className="text-muted-foreground">
                    No stock movements yet.
                  </TableCell>
                </TableRow>
              ) : (
                ledgerEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stockDirectionLabel(entry.action)}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.rolls != null ? formatDecimal(qty(entry.rolls)) : "—"}
                    </TableCell>
                    <TableCell>
                      {entry.kilograms != null ? formatDecimal(qty(entry.kilograms)) : "—"}
                    </TableCell>
                    <TableCell>{entry.company_name || "—"}</TableCell>
                    {canViewPrice ? (
                      <TableCell>
                        {entry.price_per_unit != null
                          ? formatPricePerUnit(qty(entry.price_per_unit), entry.price_unit_code)
                          : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>{entry.user?.name ?? "—"}</TableCell>
                    <TableCell className="max-w-[14rem] truncate text-sm">
                      {entry.note ?? "—"}
                    </TableCell>
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
