import { z } from "zod";

export const RoleSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_system_role: z.boolean(),
});

export const BranchSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});

export const DepartmentSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});

export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.enum(["ACTIVE", "INVITED", "DISABLED"]),
  designation: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(RoleSummarySchema).default([]),
  permissions: z.array(z.string()).default([]),
  branch: BranchSummarySchema.nullable().optional(),
  department: DepartmentSummarySchema.nullable().optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type RoleSummary = z.infer<typeof RoleSummarySchema>;
