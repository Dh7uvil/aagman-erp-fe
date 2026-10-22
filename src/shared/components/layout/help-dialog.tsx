"use client";

import { HelpCircle } from "lucide-react";

import { KEYBOARD_SHORTCUTS } from "@/shared/lib/keyboard-shortcuts";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Help &amp; shortcuts</DialogTitle>
          <DialogDescription>Keyboard shortcuts available in the app shell.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 text-sm">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{shortcut.action}</span>
              <kbd className="bg-muted rounded px-2 py-0.5 font-mono text-xs">{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function HelpTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Help" onClick={onOpen}>
          <HelpCircle className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Help</TooltipContent>
    </Tooltip>
  );
}
