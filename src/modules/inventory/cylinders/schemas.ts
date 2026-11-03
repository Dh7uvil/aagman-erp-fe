import { z } from "zod";

import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";

export const CYLINDER_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "RETURNED",
] as const;

export type CylinderStatus = (typeof CYLINDER_STATUSES)[number];

/** Status values shown in the cylinder form; includes read-only lifecycle states when current. */
export function cylinderFormStatusOptions(current?: CylinderStatus | null): CylinderStatus[] {
  const editable = CYLINDER_STATUSES.filter(
    (status) => status !== "RETURNED" && status !== "PAUSED",
  );
  if (current && (current === "PAUSED" || current === "RETURNED")) {
    return [current, ...editable];
  }
  return [...editable];
}

export const CylinderSizeSchema = z.object({
  position: z.number().int(),
  width: z.union([z.string(), z.number()]).transform(String),
  circumference: z.union([z.string(), z.number()]).transform(String),
});

export const CylinderColorSchema = z.object({
  position: z.number().int(),
  name: z.string(),
});

export const CylinderFileMetaSchema = z.object({
  filename: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
});

export const CylinderPauseSchema = z.object({
  id: z.string().uuid(),
  paused_at: z.string(),
  paused_by: z.string().uuid().nullable(),
  paused_by_name: z.string().nullable().optional(),
  pause_remarks: z.string().nullable(),
  resumed_at: z.string().nullable(),
  resumed_by: z.string().uuid().nullable(),
  resumed_by_name: z.string().nullable().optional(),
  resume_remarks: z.string().nullable(),
});

export const CylinderListItemSchema = z.object({
  id: z.string().uuid(),
  cylinder_number: z.string(),
  company_id: z.string().uuid(),
  company_name: z.string(),
  product_name: z.string(),
  cylinder_count: z.number().int(),
  color_count: z.number().int().nullable(),
  pet_size: z.string().nullable(),
  cylinder_cost: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((value) => (value === null || value === undefined ? null : String(value))),
  cylinder_location: z.string().nullable(),
  status: z.enum(CYLINDER_STATUSES),
  cylinder_image: CylinderFileMetaSchema.nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CylinderSchema = CylinderListItemSchema.extend({
  remarks: z.string().nullable(),
  cylinders: z.array(CylinderSizeSchema),
  colors: z.array(CylinderColorSchema),
  pauses: z.array(CylinderPauseSchema).optional(),
  challan: CylinderFileMetaSchema.nullable().optional(),
  related_documents: z.array(RelatedDocumentRefSchema).optional(),
});

export type Cylinder = z.infer<typeof CylinderSchema>;
export type CylinderListItem = z.infer<typeof CylinderListItemSchema>;

export const CylinderListSchema = z.array(CylinderListItemSchema);

export const CylinderSizeLineSchema = z.object({
  width: z.string().min(1, "Enter width"),
  circumference: z.string().min(1, "Enter circumference"),
});

function parseCount(value: string, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    throw new Error("Invalid count");
  }
  return parsed;
}

export const CylinderFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select a company" }),
  product_name: z.string().min(1, "Enter product name").max(200),
  cylinder_count: z.string().min(1, "Enter cylinder count"),
  size_lines: z.array(CylinderSizeLineSchema).min(1),
  color_count: z.string(),
  color_lines: z.array(z.object({ name: z.string() })),
  pet_size: z.string().min(1, "Enter pet size").max(100, "Pet size must be at most 100 characters"),
  cylinder_cost: z.string(),
  cylinder_location: z.string(),
  remarks: z.string(),
  status: z.enum(CYLINDER_STATUSES),
}).superRefine((values, ctx) => {
  let cylinderCount = 0;
  let colorCount = 0;
  try {
    cylinderCount = parseCount(values.cylinder_count, 50);
    if (cylinderCount < 1) {
      throw new Error("too low");
    }
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter 1–50 cylinders", path: ["cylinder_count"] });
    return;
  }
  try {
    colorCount = parseCount(values.color_count || "0", 50);
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter 0–50 colours", path: ["color_count"] });
    return;
  }
  if (values.size_lines.length !== cylinderCount) {
    ctx.addIssue({
      code: "custom",
      message: "Cylinder rows must match count",
      path: ["size_lines"],
    });
  }
  if (values.color_lines.length !== colorCount) {
    ctx.addIssue({
      code: "custom",
      message: "Colour rows must match count",
      path: ["color_lines"],
    });
  }
});

export type CylinderFormValues = z.infer<typeof CylinderFormSchema>;

export type CylinderListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: CylinderStatus;
  company_id?: string;
  include_closed?: boolean;
};

export const EntityHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  user: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().nullable(),
  module: z.string(),
  kind: z.enum(["edit", "attachment"]),
  event: z.enum(["pause", "resume"]).nullable().optional(),
  summary: z.string().nullable().optional(),
  attachment_slot: z.string().nullable().optional(),
  storage_key: z.string().nullable().optional(),
  attachment_deleted: z.boolean().optional(),
  changes: z.array(
    z.object({
      field: z.string(),
      old_value: z.unknown().optional(),
      new_value: z.unknown().optional(),
    }),
  ),
});

export type EntityHistoryEntry = z.infer<typeof EntityHistoryEntrySchema>;

export function emptyCylinderFormValues(): CylinderFormValues {
  return {
    company_id: "",
    product_name: "",
    cylinder_count: "1",
    size_lines: [{ width: "", circumference: "" }],
    color_count: "0",
    color_lines: [],
    pet_size: "",
    cylinder_cost: "",
    cylinder_location: "",
    remarks: "",
    status: "ACTIVE",
  };
}

export function cylinderToFormValues(cylinder: Cylinder | null): CylinderFormValues {
  if (!cylinder) {
    return emptyCylinderFormValues();
  }
  return {
    company_id: cylinder.company_id,
    product_name: cylinder.product_name,
    cylinder_count: String(cylinder.cylinder_count),
    size_lines: cylinder.cylinders.map((row) => ({
      width: row.width,
      circumference: row.circumference,
    })),
    color_count: String(cylinder.color_count ?? cylinder.colors.length),
    color_lines: cylinder.colors.map((row) => ({ name: row.name })),
    pet_size: cylinder.pet_size ?? "",
    cylinder_cost: cylinder.cylinder_cost ?? "",
    cylinder_location: cylinder.cylinder_location ?? "",
    remarks: cylinder.remarks ?? "",
    status: cylinder.status,
  };
}

/** Prefill a new cylinder from an existing one (new number and files on submit). */
export function cylinderToCloneFormValues(cylinder: Cylinder): CylinderFormValues {
  return {
    ...cylinderToFormValues(cylinder),
    status: "ACTIVE",
  };
}
