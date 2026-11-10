import { Suspense } from "react";
import { z } from "zod";

import { EntityRecordHistoryScreen } from "@/shared/components/document/entity-record-history-screen";
import { PermissionGate } from "@/shared/auth/guards";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { isHistoryResource, type HistoryResource } from "@/shared/lib/history";
import { historyPermissionForResource } from "@/shared/lib/history-permissions";

const IdSchema = z.string().uuid();

export default function HistoryPage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 w-auto" />}>
      <HistoryPageContent params={params} />
    </Suspense>
  );
}

async function HistoryPageContent({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const parsed = IdSchema.safeParse(id);

  if (!parsed.success || !isHistoryResource(resource)) {
    return (
      <p className="text-muted-foreground p-6 text-sm">History is not available for this record.</p>
    );
  }

  const screen = <EntityRecordHistoryScreen resource={resource} id={parsed.data} />;
  const permission = historyPermissionForResource(resource as HistoryResource);
  if (permission) {
    return <PermissionGate permission={permission}>{screen}</PermissionGate>;
  }
  return screen;
}
