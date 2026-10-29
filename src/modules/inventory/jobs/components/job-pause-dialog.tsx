"use client";

import { useState } from "react";
import { toast } from "sonner";

import { usePauseJob } from "@/modules/inventory/jobs/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { CancelLabel, PauseLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";

export function JobPauseDialog({
  jobId,
  open,
  onOpenChange,
  onPaused,
}: {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaused?: () => void;
}) {
  const pauseJob = usePauseJob();
  const [remarks, setRemarks] = useState("");

  async function submit() {
    try {
      await pauseJob.mutateAsync({ id: jobId, pause_remarks: remarks.trim() || null });
      toast.success("Job paused");
      onOpenChange(false);
      setRemarks("");
      onPaused?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause job</DialogTitle>
        </DialogHeader>
        <Textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Paused remarks"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <CancelLabel />
          </Button>
          <Button onClick={() => void submit()} disabled={pauseJob.isPending}>
            <PauseLabel />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
