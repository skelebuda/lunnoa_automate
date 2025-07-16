import { string, z } from 'zod';

export const connectionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name is too long' }),
  description: z.string().optional(),
  workflowAppId: string().optional(),
  connectionId: string().optional(),
  workflowApp: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      logoUrl: z.string().optional(),
    })
    .optional(),
  project: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .optional(),
});
export type Connection = z.infer<typeof connectionSchema>;

const baseCreateSchema = connectionSchema
  .pick({
    name: true,
    workflowAppId: true,
    connectionId: true,
  })
  .extend({
    description: z
      .string()
      .min(1, {
        message: 'Description is required',
      })
      .max(255, {
        message: 'Description is too long',
      })
      .optional(),
    projectId: z.string().optional(),
  });

const apiKeySchema = baseCreateSchema.extend({
  apiKey: z.string(),
});

const databaseSchema = baseCreateSchema.extend({
  username: z.string(),
  password: z.string(),
  database: z.string(),
  host: z.string(),
  port: z.coerce.number(),
  ssl: z.boolean().optional(),
});

const oauth2Schema = baseCreateSchema;

const basicSchema = baseCreateSchema.extend({
  username: z.string(),
  password: z.string(),
});

const keyPairSchema = baseCreateSchema.extend({
  publicKey: z.string(),
  privateKey: z.string(),
});

export const createConnectionSchema = z.union([
  apiKeySchema,
  databaseSchema,
  basicSchema,
  oauth2Schema,
  keyPairSchema,
]);

export type CreateConnectionType = z.infer<typeof createConnectionSchema>;

export const updateConnectionSchema = connectionSchema.pick({
  name: true,
  description: true,
});

export type UpdateConnectionType = z.infer<typeof updateConnectionSchema>;
