"use client";

import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { toDisplayLogoUrl } from "@/shared/lib/logo-url";

export function TenantLogoMark({
  name,
  logoUrl,
  revision,
  alt,
  className,
  imageClassName,
  fallbackClassName,
  iconClassName,
  onLogoError,
}: {
  name: string;
  logoUrl?: string | null;
  /** Cache-bust when the logo bytes change but the path stays the same. */
  revision?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  onLogoError?: () => void;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const displaySrc = toDisplayLogoUrl(logoUrl, revision);
  const showLogo = Boolean(displaySrc) && logoUrl !== brokenSrc;

  useEffect(() => {
    setBrokenSrc(null);
  }, [displaySrc]);

  if (showLogo) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          className,
        )}
      >
        {/* Presigned URLs expire in 1 hour; native img avoids caching an expired query string. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={displaySrc}
          src={displaySrc}
          alt={alt ?? name}
          referrerPolicy="no-referrer"
          className={cn("size-full object-contain", imageClassName)}
          onError={() => {
            if (logoUrl) {
              setBrokenSrc(logoUrl);
              onLogoError?.();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-primary flex shrink-0 items-center justify-center",
        className,
        fallbackClassName,
      )}
    >
      <Zap className={cn("text-primary-foreground", iconClassName)} aria-hidden="true" />
    </div>
  );
}
