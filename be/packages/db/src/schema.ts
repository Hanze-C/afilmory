import { generateId } from '@afilmory/be-utils'
import { boolean, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

function createSnowflakeId(name: string) {
  return text(name).$defaultFn(() => generateId())
}
const snowflakeId = createSnowflakeId('id').primaryKey()

// =========================
// Better Auth custom schema
// =========================

export const userRoleEnum = pgEnum('user_role', ['user', 'admin'])

// Custom users table (Better Auth: user)
export const authUsers = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  username: text('username'),
  displayUsername: text('display_username'),
  banned: boolean('banned').default(false).notNull(),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires_at', { mode: 'string' }),
})

// Custom sessions table (Better Auth: session)
export const authSessions = pgTable('auth_session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
})

// Custom accounts table (Better Auth: account)
export const authAccounts = pgTable('auth_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'string' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'string' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

export const settings = pgTable(
  'settings',
  {
    id: snowflakeId,

    key: text('key').notNull(),
    value: text('value').notNull(),

    isSensitive: boolean('is_sensitive').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  },
  (t) => [unique('uq_settings_key').on(t.key)],
)

export const dbSchema = {
  authUsers,
  authSessions,
  authAccounts,
  settings,
}

export type DBSchema = typeof dbSchema
