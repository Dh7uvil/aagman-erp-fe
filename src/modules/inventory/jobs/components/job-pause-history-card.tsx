"use client";

import type { Job } from "@/modules/inventory/jobs/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function JobPauseHistoryCard({ job }: { job: Job }) {
  const pauses = job.pauses ?? [];
  if (pauses.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pause history</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pauses.map((pause) => (
          <div key={pause.id} className="border-b pb-3 text-sm last:border-0">
            <p>
              Paused {pause.paused_at}
              {pause.paused_by_name ? ` by ${pause.paused_by_name}` : ""}
            </p>
            {pause.pause_remarks ? (
              <p className="text-muted-foreground break-all">{pause.pause_remarks}</p>
            ) : null}
            {pause.resumed_at ? (
              <p className="text-muted-foreground">
                Resumed {pause.resumed_at}
                {pause.resumed_by_name ? ` by ${pause.resumed_by_name}` : ""}
              </p>
            ) : (
              <p className="text-amber-600">Still paused</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
