"use client";

import { type CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "@/shared/components/layout/theme-provider";

function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      closeButton
      mobileOffset={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
