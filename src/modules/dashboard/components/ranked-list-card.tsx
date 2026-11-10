"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function RankedListCard({
  title,
  isLoading,
  emptyMessage,
  items,
}: {
  title: string;
  isLoading: boolean;
  emptyMessage: string;
  items: ReactNode[];
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        ) : (
          <ul className="divide-border divide-y">{items}</ul>
        )}
      </CardContent>
    </Card>
  );
}
