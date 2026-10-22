import { z } from "zod";

export const MeUpdateSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50).nullable(),
});
export type MeUpdate = z.infer<typeof MeUpdateSchema>;

export const ProfileFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(200),
  phone: z.string().max(50),
});
export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;
