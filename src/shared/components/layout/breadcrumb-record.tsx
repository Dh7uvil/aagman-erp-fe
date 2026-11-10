"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { BreadcrumbCrumb } from "@/shared/components/layout/breadcrumb";

type BreadcrumbRecordContextValue = {
  recordLabel: string | null;
  recordTrail: BreadcrumbCrumb[] | null;
  setRecordLabel: (label: string | null) => void;
  setRecordTrail: (trail: BreadcrumbCrumb[] | null) => void;
};

const BreadcrumbRecordContext = createContext<BreadcrumbRecordContextValue>({
  recordLabel: null,
  recordTrail: null,
  setRecordLabel: () => {},
  setRecordTrail: () => {},
});

export function BreadcrumbRecordProvider({ children }: { children: ReactNode }) {
  const [recordLabel, setRecordLabel] = useState<string | null>(null);
  const [recordTrail, setRecordTrail] = useState<BreadcrumbCrumb[] | null>(null);
  const value = useMemo(
    () => ({ recordLabel, recordTrail, setRecordLabel, setRecordTrail }),
    [recordLabel, recordTrail],
  );
  return (
    <BreadcrumbRecordContext.Provider value={value}>{children}</BreadcrumbRecordContext.Provider>
  );
}

export function useBreadcrumbRecordLabel() {
  return useContext(BreadcrumbRecordContext).recordLabel;
}

export function useBreadcrumbRecordTrail() {
  return useContext(BreadcrumbRecordContext).recordTrail;
}

export function useSetBreadcrumbRecord(label?: string | null) {
  const { setRecordLabel, setRecordTrail } = useContext(BreadcrumbRecordContext);

  useLayoutEffect(() => {
    if (!label) {
      setRecordLabel(null);
      return () => setRecordLabel(null);
    }
    setRecordTrail(null);
    setRecordLabel(label);
    return () => setRecordLabel(null);
  }, [label, setRecordLabel, setRecordTrail]);
}

function breadcrumbTrailSignature(trail?: BreadcrumbCrumb[] | null): string {
  return trail?.map((crumb) => `${crumb.label}\u001f${crumb.href ?? ""}`).join("\u001e") ?? "";
}

export function useSetBreadcrumbTrail(trail?: BreadcrumbCrumb[] | null) {
  const { setRecordLabel, setRecordTrail } = useContext(BreadcrumbRecordContext);
  const signature = breadcrumbTrailSignature(trail);
  const trailRef = useRef(trail);
  trailRef.current = trail;

  useLayoutEffect(() => {
    const current = trailRef.current;
    if (!current?.length) {
      setRecordTrail(null);
      return () => setRecordTrail(null);
    }
    setRecordLabel(null);
    setRecordTrail(current);
    return () => setRecordTrail(null);
  }, [signature, setRecordLabel, setRecordTrail]);
}
