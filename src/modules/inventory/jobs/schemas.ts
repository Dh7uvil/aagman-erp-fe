import { z } from "zod";

import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";

export const JOB_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "RESUMED",
  "COMPLETED",
  "RETURNED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Status values shown in the job form; includes read-only lifecycle states when current. */
export function jobFormStatusOptions(current?: JobStatus | null): JobStatus[] {
  const editable = JOB_STATUSES.filter(
    (status) => status !== "RETURNED" && status !== "PAUSED",
  );
  if (current && (current === "PAUSED" || current === "RETURNED")) {
    return [current, ...editable];
  }
  return [...editable];
}

export const JobCylinderSchema = z.object({
  position: z.number().int(),
  width: z.union([z.string(), z.number()]).transform(String),
  circumference: z.union([z.string(), z.number()]).transform(String),
});

export const JobColorSchema = z.object({
  position: z.number().int(),
  name: z.string(),
});

export const JobFileMetaSchema = z.object({
  filename: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
});

export const JobPauseSchema = z.object({
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

export const JobListItemSchema = z.object({
  id: z.string().uuid(),
  job_number: z.string(),
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
  status: z.enum(JOB_STATUSES),
  created_at: z.string(),
  updated_at: z.string(),
});

export const JobSchema = JobListItemSchema.extend({
  remarks: z.string().nullable(),
  cylinders: z.array(JobCylinderSchema),
  colors: z.array(JobColorSchema),
  pauses: z.array(JobPauseSchema).optional(),
  job_image: JobFileMetaSchema.nullable().optional(),
  challan: JobFileMetaSchema.nullable().optional(),
  related_documents: z.array(RelatedDocumentRefSchema).optional(),
});

export type Job = z.infer<typeof JobSchema>;
export type JobListItem = z.infer<typeof JobListItemSchema>;

export const JobListSchema = z.array(JobListItemSchema);

export const JobSizeLineSchema = z.object({
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

export const JobFormSchema = z.object({
  company_id: z.string().uuid({ message: "Select a company" }),
  product_name: z.string().min(1, "Enter product name").max(200),
  cylinder_count: z.string().min(1, "Enter cylinder count"),
  size_lines: z.array(JobSizeLineSchema).min(1),
  color_count: z.string(),
  color_lines: z.array(z.object({ name: z.string() })),
  pet_size: z.string(),
  cylinder_cost: z.string(),
  cylinder_location: z.string(),
  remarks: z.string(),
  status: z.enum(JOB_STATUSES),
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

export type JobFormValues = z.infer<typeof JobFormSchema>;

export type JobListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: JobStatus;
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

export function emptyJobFormValues(): JobFormValues {
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

export function jobToFormValues(job: Job | null): JobFormValues {
  if (!job) {
    return emptyJobFormValues();
  }
  return {
    company_id: job.company_id,
    product_name: job.product_name,
    cylinder_count: String(job.cylinder_count),
    size_lines: job.cylinders.map((row) => ({
      width: row.width,
      circumference: row.circumference,
    })),
    color_count: String(job.color_count ?? job.colors.length),
    color_lines: job.colors.map((row) => ({ name: row.name })),
    pet_size: job.pet_size ?? "",
    cylinder_cost: job.cylinder_cost ?? "",
    cylinder_location: job.cylinder_location ?? "",
    remarks: job.remarks ?? "",
    status: job.status,
  };
}

/** Prefill a new job from an existing one (new number and files on submit). */
export function jobToCloneFormValues(job: Job): JobFormValues {
  return {
    ...jobToFormValues(job),
    status: "ACTIVE",
  };
}
