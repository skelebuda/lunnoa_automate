import { z } from 'zod';

export const accessGrantSchema = z.object({
  role: z.string(),
  workspaces: z.array(z.string()),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  access: z.array(accessGrantSchema),
});

export type User = z.infer<typeof userSchema>;
export type AccessGrant = z.infer<typeof accessGrantSchema>; 