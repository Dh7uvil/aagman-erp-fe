"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Keeps dropdown menus closed after route changes and browser back/forward cache restores. */
export function useDropdownMenuNavigationSync() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setOpen(false);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return [open, setOpen] as const;
}
