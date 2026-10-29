"use client";

import type { Job } from "@/modules/inventory/jobs/schemas";
import { JobFileSlots } from "@/modules/inventory/jobs/components/job-file-slots";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function JobDocumentsCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <JobFileSlots job={job} />
      </CardContent>
    </Card>
  );
}
