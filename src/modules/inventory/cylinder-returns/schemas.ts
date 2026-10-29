import { z } from "zod";

import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";

export const CylinderReturnSchema = z.object({
  id: z.string().uuid(),
  return_number: z.string(),
  job_id: z.string().uuid(),
  job_number: z.string(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  remarks: z.string().nullable(),
  related_documents: z.array(RelatedDocumentRefSchema).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CylinderReturn = z.infer<typeof CylinderReturnSchema>;
export const CylinderReturnListSchema = z.array(CylinderReturnSchema);

export const CylinderReturnFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select customer" }),
  job_id: z.string().uuid({ message: "Select job" }),
  remarks: z.string(),
});

export type CylinderReturnFormValues = z.infer<typeof CylinderReturnFormSchema>;

export type CylinderReturnListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  company_id?: string;
  job_id?: string;
};
