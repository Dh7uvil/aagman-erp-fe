"use client";

import { Download, Loader2 } from "lucide-react";
import { useState, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { downloadAuthenticatedFile } from "@/shared/lib/download-authenticated-file";

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "asChild"> & {
  href: string;
  filename: string;
  accept?: string | null;
  children?: ReactNode;
  showIcon?: boolean;
};

export function AuthenticatedFileDownloadButton({
  href,
  filename,
  accept,
  children = "Download",
  showIcon = true,
  disabled,
  ...props
}: Props) {
  const [pending, setPending] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || disabled) {
      return;
    }
    setPending(true);
    try {
      await downloadAuthenticatedFile(href, filename, accept);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" {...props} disabled={disabled || pending} onClick={(e) => void handleClick(e)}>
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : showIcon ? (
        <Download className="size-3.5" aria-hidden />
      ) : null}
      {children}
    </Button>
  );
}
