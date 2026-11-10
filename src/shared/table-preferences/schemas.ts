import { z } from "zod";

export const ExportFormatSchema = z.enum(["csv", "xlsx"]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const TablePreferenceSchema = z.object({
  table_key: z.string(),
  visible_columns: z.array(z.string()),
  column_order: z.array(z.string()),
  is_default: z.boolean(),
  export_visible_columns: z.array(z.string()),
  export_column_order: z.array(z.string()),
  export_format: ExportFormatSchema.nullable().optional(),
  export_is_default: z.boolean(),
});

export type TablePreference = z.infer<typeof TablePreferenceSchema>;

export type TablePreferenceUpdate = {
  visible_columns: string[];
  column_order: string[];
};

export type TableExportPreferenceUpdate = {
  export_visible_columns: string[];
  export_column_order: string[];
  export_format?: ExportFormat | null;
};
