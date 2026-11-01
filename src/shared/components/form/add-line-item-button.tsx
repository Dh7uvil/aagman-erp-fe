"use client";

import { Plus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

type AddLineItemButtonProps = Omit<ComponentProps<typeof Button>, "type" | "variant" | "size"> & {
  children: ReactNode;
};

/** Outline control appended below repeatable form rows; full width on mobile and desktop. */
export function AddLineItemButton({ children, className, ...props }: AddLineItemButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("w-full", className)}
      {...props}
    >
      <Plus className="size-4" />
      {children}
    </Button>
  );
}
