"use client";

import Link from "next/link";

import type { InkLine } from "@/modules/inventory/inks/schemas";
import { HistoryLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { historyHref } from "@/shared/lib/history";

function lineMovementsLabel(line: Pick<InkLine, "brand_name" | "color_name">) {
  const brand = line.brand_name?.trim() || "—";
  const color = line.color_name?.trim() || "—";
  return `${brand} · ${color}`;
}

export function InkSheetMovementsHeaderButton({
  lines,
}: {
  lines: Pick<InkLine, "id" | "brand_name" | "color_name">[];
}) {
  if (lines.length === 0) {
    return null;
  }

  if (lines.length === 1) {
    const line = lines[0];
    return (
      <Button type="button" size="sm" variant="outline" asChild>
        <Link href={historyHref("ink-lines", line.id)}>
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
            <Link href={historyHref("ink-lines", line.id)}>{lineMovementsLabel(line)}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
