import { createZodDto } from '@afilmory/framework'
import { z } from 'zod'

import { ConflictResolutionStrategy } from './data-sync.types'

const s3ConfigSchema = z.object({
  provider: z.literal('s3'),
  bucket: z.string().min(1),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  prefix: z.string().optional(),
  customDomain: z.string().optional(),
  excludeRegex: z.string().optional(),
  maxFileLimit: z.number().int().positive().optional(),
  keepAlive: z.boolean().optional(),
  maxSockets: z.number().int().positive().optional(),
  connectionTimeoutMs: z.number().int().positive().optional(),
  socketTimeoutMs: z.number().int().positive().optional(),
  requestTimeoutMs: z.number().int().positive().optional(),
  idleTimeoutMs: z.number().int().positive().optional(),
  totalTimeoutMs: z.number().int().positive().optional(),
  retryMode: z.enum(['standard', 'adaptive', 'legacy']).optional(),
  maxAttempts: z.number().int().positive().optional(),
  downloadConcurrency: z.number().int().positive().optional(),
})

const githubConfigSchema = z.object({
  provider: z.literal('github'),
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional(),
  token: z.string().optional(),
  path: z.string().optional(),
  useRawUrl: z.boolean().optional(),
})

const localConfigSchema = z.object({
  provider: z.literal('local'),
  basePath: z.string().min(1),
  baseUrl: z.string().optional(),
  distPath: z.string().optional(),
  excludeRegex: z.string().optional(),
  maxFileLimit: z.number().int().positive().optional(),
})

const eagleRuleSchema = z.union([
  z.object({
    type: z.literal('tag'),
    name: z.string().min(1),
  }),
  z.object({
    type: z.literal('folder'),
    name: z.string().min(1),
    includeSubfolder: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('smartFolder'),
  }),
])

const eagleConfigSchema = z.object({
  provider: z.literal('eagle'),
  libraryPath: z.string().min(1),
  distPath: z.string().optional(),
  baseUrl: z.string().optional(),
  include: z.array(eagleRuleSchema).optional(),
  exclude: z.array(eagleRuleSchema).optional(),
})

const storageConfigSchema = z.discriminatedUnion('provider', [
  s3ConfigSchema,
  githubConfigSchema,
  localConfigSchema,
  eagleConfigSchema,
])

const builderConfigSchema = z
  .object({
    storage: storageConfigSchema,
    repo: z.record(z.string(), z.unknown()).optional(),
    options: z.record(z.string(), z.unknown()).optional(),
    logging: z.record(z.string(), z.unknown()).optional(),
    performance: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

export const runDataSyncSchema = z
  .object({
    builderConfig: builderConfigSchema,
    storageConfig: storageConfigSchema.optional(),
    dryRun: z.boolean().optional().default(false),
  })
  .transform((payload) => ({
    ...payload,
    dryRun: payload.dryRun ?? false,
  }))

const conflictResolutionSchema = z.nativeEnum(ConflictResolutionStrategy)

export const resolveConflictSchema = z
  .object({
    strategy: conflictResolutionSchema,
    builderConfig: builderConfigSchema.optional(),
    storageConfig: storageConfigSchema.optional(),
    dryRun: z.boolean().optional().default(false),
  })
  .superRefine((payload, ctx) => {
    if (payload.strategy === ConflictResolutionStrategy.PREFER_STORAGE && !payload.builderConfig) {
      ctx.addIssue({
        path: ['builderConfig'],
        code: z.ZodIssueCode.custom,
        message: 'builderConfig is required when preferring storage.',
      })
    }
  })

export type RunDataSyncInput = z.infer<typeof runDataSyncSchema>
export type ResolveConflictInput = z.infer<typeof resolveConflictSchema>

export class RunDataSyncDto extends createZodDto(runDataSyncSchema) {}

export class ResolveConflictDto extends createZodDto(resolveConflictSchema) {}
