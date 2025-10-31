import { reactions } from '@afilmory/db'
import { BizException, ErrorCode } from 'core/errors'
import { requireTenantContext } from 'core/modules/tenant/tenant.context'
import { eq } from 'drizzle-orm'
import { injectable } from 'tsyringe'

import { DbAccessor } from '../../database/database.provider'

@injectable()
export class ReactionService {
  constructor(private readonly dbAccessor: DbAccessor) {}

  async addReaction(refKey: string, reaction: string): Promise<void> {
    const tenant = requireTenantContext()
    const db = this.dbAccessor.get()

    // Check if photo exists (you might want to validate this differently based on your photo storage)
    // For now, we'll just add the reaction assuming the refKey is valid

    try {
      await db.insert(reactions).values({
        tenantId: tenant.tenant.id,
        refKey,
        reaction,
      })
    } catch (error) {
      console.error('Failed to add reaction:', error)
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
        message: 'Failed to add reaction',
      })
    }
  }

  async getReactionsByRefKey(refKey: string): Promise<
    Array<{
      id: string
      refKey: string
      reaction: string
      createdAt: string
    }>
  > {
    requireTenantContext()
    const db = this.dbAccessor.get()

    const records = await db
      .select({
        id: reactions.id,
        refKey: reactions.refKey,
        reaction: reactions.reaction,
        createdAt: reactions.createdAt,
      })
      .from(reactions)
      .where(eq(reactions.refKey, refKey))
      .orderBy(reactions.createdAt)

    return records
  }

  async getReactionStats(refKey: string): Promise<Record<string, number>> {
    requireTenantContext()
    const db = this.dbAccessor.get()

    const reactionRecords = await db
      .select({
        reaction: reactions.reaction,
      })
      .from(reactions)
      .where(eq(reactions.refKey, refKey))

    return reactionRecords.reduce(
      (acc, record) => {
        acc[record.reaction] = (acc[record.reaction] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  }
}
