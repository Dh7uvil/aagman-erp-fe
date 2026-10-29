"use client";

import Link from "next/link";

import { HistoryLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import { historyPageTitleFromHref } from "@/shared/lib/history";

export function HistoryHeaderButton({ href }: { href: string }) {
  return (
    <Button type="button" size="sm" variant="outline" asChild>
      <Link href={href}>
        <HistoryLabel>{historyPageTitleFromHref(href)}</HistoryLabel>
      </Link>
    </Button>
  );
}
