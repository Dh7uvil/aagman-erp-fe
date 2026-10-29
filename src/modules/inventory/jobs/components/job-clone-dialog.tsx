"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useJobs } from "@/modules/inventory/jobs/queries";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { CancelLabel, ContinueLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

function toJobOption(job: {
  id: string;
  job_number: string;
  product_name: string;
  status: string;
}): SearchableSelectOption {
  return {
    value: job.id,
    label: `${job.job_number} — ${job.product_name} (${job.status})`,
    triggerLabel: job.job_number,
  };
}

export function JobCloneDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState("");
  const [search, setSearch] = useState("");
  const [pinnedOption, setPinnedOption] = useState<SearchableSelectOption | null>(null);

  const jobsQuery = useJobs(
    {
      page: 1,
      page_size: 100,
      search: search || undefined,
      include_closed: true,
    },
    open,
  );

  const jobOptions = useMemo(() => {
    const mapped = (jobsQuery.data?.data ?? []).map(toJobOption);
    if (pinnedOption && !mapped.some((option) => option.value === pinnedOption.value)) {
      return [pinnedOption, ...mapped];
    }
    return mapped;
  }, [jobsQuery.data?.data, pinnedOption]);

  useEffect(() => {
    if (!open) {
      setJobId("");
      setSearch("");
      setPinnedOption(null);
    }
  }, [open]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function handleJobChange(nextId: string) {
    setJobId(nextId);
    const option = jobOptions.find((row) => row.value === nextId);
    if (option) {
      setPinnedOption(option);
    }
  }

  function continueClone() {
    if (!jobId) {
      return;
    }
    onOpenChange(false);
    router.push(jobRoutes.clone(jobId));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone job</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Choose a job to copy. You will get a new job number; documents are not copied.
        </p>
        <SearchableSelect
          asFormControl={false}
          searchable
          aria-label="Job to clone"
          placeholder="Select job"
          searchPlaceholder="Search job number or product…"
          emptyText={jobsQuery.isError ? "Could not load jobs" : "No jobs found"}
          options={jobOptions}
          value={jobId}
          onValueChange={handleJobChange}
          onQueryChange={setSearch}
          loading={jobsQuery.isFetching}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            <CancelLabel />
          </Button>
          <Button type="button" disabled={!jobId} onClick={continueClone}>
            <ContinueLabel />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
