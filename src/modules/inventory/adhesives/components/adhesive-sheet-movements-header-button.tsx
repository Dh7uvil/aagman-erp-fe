"use client";

import Link from "next/link";

import type { AdhesiveLine } from "@/modules/inventory/adhesives/schemas";
import { HistoryLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { historyHref } from "@/shared/lib/history";

function lineMovementsLabel(line: Pick<AdhesiveLine, "brand_name" | "code">) {
  const brand = line.brand_name?.trim() || "—";
  const code = line.code?.trim() || "—";
  return `${brand} · ${code}`;
}

export function AdhesiveSheetMovementsHeaderButton({
  lines,
}: {
  lines: Pick<AdhesiveLine, "id" | "brand_name" | "code">[];
}) {
  if (lines.length === 0) {
    return null;
  }

  if (lines.length === 1) {
    const line = lines[0];
    return (
      <Button type="button" size="sm" variant="outline" asChild>
        <Link href={historyHref("adhesive-lines", line.id)}>
          <HistoryLabel />
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <HistoryLabel />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-[20rem]">
        {lines.map((line) => (
          <DropdownMenuItem key={line.id} asChild>
            <Link href={historyHref("adhesive-lines", line.id)}>{lineMovementsLabel(line)}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
