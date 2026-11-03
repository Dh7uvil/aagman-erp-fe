import { z } from "zod";

import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";

export const CylinderReturnSchema = z.object({
  id: z.string().uuid(),
  return_number: z.string(),
  cylinder_id: z.string().uuid(),
  cylinder_number: z.string(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  company_gst_number: z.string().nullable().optional(),
  company_address: z.string().nullable().optional(),
  product_name: z.string(),
  cylinder_count: z.number().int(),
  remarks: z.string().nullable(),
  related_documents: z.array(RelatedDocumentRefSchema).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CylinderReturn = z.infer<typeof CylinderReturnSchema>;
export const CylinderReturnListSchema = z.array(CylinderReturnSchema);

export const CylinderReturnFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select customer" }),
  cylinder_id: z.string().uuid({ message: "Select cylinder" }),
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
  cylinder_id?: string;
};
