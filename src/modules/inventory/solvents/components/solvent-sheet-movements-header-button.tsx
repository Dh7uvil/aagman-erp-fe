"use client";

import Link from "next/link";

import type { SolventLine } from "@/modules/inventory/solvents/schemas";
import { HistoryLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { historyHref } from "@/shared/lib/history";

function lineMovementsLabel(line: Pick<SolventLine, "brand_name" | "name">) {
  const brand = line.brand_name?.trim() || "—";
  const name = line.name?.trim() || "—";
  return `${brand} · ${name}`;
}

export function SolventSheetMovementsHeaderButton({
  lines,
}: {
  lines: Pick<SolventLine, "id" | "brand_name" | "name">[];
}) {
  if (lines.length === 0) {
    return null;
  }

  if (lines.length === 1) {
    const line = lines[0];
    return (
      <Button type="button" size="sm" variant="outline" asChild>
        <Link href={historyHref("solvent-lines", line.id)}>
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
            <Link href={historyHref("solvent-lines", line.id)}>{lineMovementsLabel(line)}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
