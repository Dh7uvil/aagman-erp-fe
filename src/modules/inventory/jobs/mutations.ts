"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { jobsApi } from "@/modules/inventory/jobs/api";
import { jobKeys } from "@/modules/inventory/jobs/queries";
import type { JobFormValues } from "@/modules/inventory/jobs/schemas";

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: JobFormValues) => jobsApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: JobFormValues }) =>
      jobsApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function usePauseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pause_remarks }: { id: string; pause_remarks: string | null }) =>
      jobsApi.pause(id, pause_remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useResumeJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resume_remarks }: { id: string; resume_remarks: string | null }) =>
      jobsApi.resume(id, resume_remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useUploadJobFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      slot,
      file,
    }: {
      id: string;
      slot: "job_image" | "challan";
      file: File;
    }) => jobsApi.uploadFile(id, slot, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}

export function useDeleteJobFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, slot }: { id: string; slot: "job_image" | "challan" }) =>
      jobsApi.deleteFile(id, slot),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobKeys.all }),
  });
}
