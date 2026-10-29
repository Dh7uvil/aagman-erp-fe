import { z } from "zod";

export const RelatedDocumentRefSchema = z.object({
  document_type: z.string(),
  document_id: z.string().uuid(),
  document_number: z.string(),
  status: z.string(),
  relationship: z.string(),
  document_date: z.string().nullable().optional(),
  quantity_summary: z.string().nullable().optional(),
  amount_summary: z.string().nullable().optional(),
});

export type RelatedDocumentRef = z.infer<typeof RelatedDocumentRefSchema>;
