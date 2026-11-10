"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cylindersApi } from "@/modules/inventory/cylinders/api";
import { cylinderKeys } from "@/modules/inventory/cylinders/queries";
import type { CylinderFormValues } from "@/modules/inventory/cylinders/schemas";

export function useCreateCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CylinderFormValues) => cylindersApi.create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function useUpdateCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CylinderFormValues }) =>
      cylindersApi.update(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function useDeleteCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cylindersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function usePauseCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pause_remarks }: { id: string; pause_remarks: string | null }) =>
      cylindersApi.pause(id, pause_remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function useResumeCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resume_remarks }: { id: string; resume_remarks: string | null }) =>
      cylindersApi.resume(id, resume_remarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function useUploadCylinderFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      slot,
      file,
    }: {
      id: string;
      slot: "cylinder_image" | "challan";
      file: File;
    }) => cylindersApi.uploadFile(id, slot, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}

export function useDeleteCylinderFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, slot }: { id: string; slot: "cylinder_image" | "challan" }) =>
      cylindersApi.deleteFile(id, slot),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cylinderKeys.all }),
  });
}
