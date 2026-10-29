"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { jobsApi } from "@/modules/inventory/jobs/api";
import type { JobListParams } from "@/modules/inventory/jobs/schemas";

export const jobKeys = {
  all: ["inventory", "jobs"] as const,
  list: (params: JobListParams) => [...jobKeys.all, "list", params] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
  history: (id: string) => [...jobKeys.all, "history", id] as const,
};

export function useJobs(params: JobListParams, enabled = true) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => jobsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useJob(id: string | null) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ""),
    queryFn: () => jobsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useJobHistory(id: string | null) {
  return useQuery({
    queryKey: jobKeys.history(id ?? ""),
    queryFn: () => jobsApi.history(id!),
    enabled: Boolean(id),
  });
}
