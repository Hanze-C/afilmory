import { authUsers } from '@afilmory/db'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'
import { AuthProvider } from '../auth/auth.provider'
import { SettingService } from '../setting/setting.service'
import type { NormalizedSettingEntry, OnboardingInitDto } from './onboarding.dto'

@injectable()
export class OnboardingService {
  constructor(
    private readonly db: DbAccessor,
    private readonly auth: AuthProvider,
    private readonly settings: SettingService,
  ) {}

  async isInitialized(): Promise<boolean> {
    const db = this.db.get()
    const [user] = await db.select().from(authUsers).limit(1)
    return Boolean(user)
  }

  async initialize(payload: OnboardingInitDto): Promise<{ adminUserId: string }> {
    const already = await this.isInitialized()
    if (already) {
      return { adminUserId: 'already-initialized' }
    }

    const auth = this.auth.getAuth()

    // Create admin via better-auth email/password
    const result = await auth.api.signUpEmail({
      body: {
        email: payload.admin.email,
        password: payload.admin.password,
        name: payload.admin.name,
      },
    })

    const userId = result.user.id

    // Promote to admin if not already
    const db = this.db.get()
    await db.update(authUsers).set({ role: 'admin' }).where(eq(authUsers.id, userId))

    // Apply initial settings
    const entries = (payload.settings as unknown as NormalizedSettingEntry[]) ?? []
    if (entries.length > 0) {
      await this.settings.setMany(entries as any)
    }

    return { adminUserId: userId }
  }
}
