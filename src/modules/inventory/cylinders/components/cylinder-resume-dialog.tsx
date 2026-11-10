"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useResumeCylinder } from "@/modules/inventory/cylinders/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { CancelLabel, ResumeLabel } from "@/shared/components/ui/action-button-labels";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";

export function CylinderResumeDialog({
  cylinderId,
  open,
  onOpenChange,
  onResumed,
}: {
  cylinderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResumed?: () => void;
}) {
  const resumeJob = useResumeCylinder();
  const [remarks, setRemarks] = useState("");

  async function submit() {
    try {
      await resumeJob.mutateAsync({ id: cylinderId, resume_remarks: remarks.trim() || null });
      toast.success("Cylinder resumed");
      onOpenChange(false);
      setRemarks("");
      onResumed?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileSheet className="sm:max-w-[min(28rem,calc(100vw-1.5rem))]">
        <DialogHeader>
          <DialogTitle>Resume cylinder</DialogTitle>
        </DialogHeader>
        <Textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Resumed remarks"
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <CancelLabel />
          </Button>
          <Button onClick={() => void submit()} disabled={resumeJob.isPending}>
            <ResumeLabel />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
