"use client";

import { useState } from "react";
import { toast } from "sonner";

import { usePauseCylinder } from "@/modules/inventory/cylinders/mutations";
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

export function CylinderPauseDialog({
  cylinderId,
  open,
  onOpenChange,
  onPaused,
}: {
  cylinderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaused?: () => void;
}) {
  const pauseCylinder = usePauseCylinder();
  const [remarks, setRemarks] = useState("");

  async function submit() {
    try {
      await pauseCylinder.mutateAsync({ id: cylinderId, pause_remarks: remarks.trim() || null });
      toast.success("Cylinder paused");
      onOpenChange(false);
      setRemarks("");
      onPaused?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent mobileSheet className="sm:max-w-[min(28rem,calc(100vw-1.5rem))]">
        <DialogHeader>
          <DialogTitle>Pause cylinder</DialogTitle>
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
          <Button onClick={() => void submit()} disabled={pauseCylinder.isPending}>
            <PauseLabel />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
