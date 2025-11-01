import { Body, Controller, Get, Post, Query } from '@afilmory/framework'
import { BizException, ErrorCode } from 'core/errors'

import { ReactionDto } from './reaction.dto'
import { ReactionService } from './reaction.service'

@Controller('reactions')
export class ReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @Post('/')
  async addReaction(@Body() body: ReactionDto) {
    const { refKey, reaction } = body

    await this.reactionService.addReaction(refKey, reaction)
  }

  @Get('/')
  async getReactions(@Query() query: { refKey?: string }): Promise<
    Array<{
      id: string
      refKey: string
      reaction: string
      createdAt: string
    }>
  > {
    const { refKey } = query

    if (!refKey) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
        message: 'refKey query parameter is required',
      })
    }

    return await this.reactionService.getReactionsByRefKey(refKey)
  }

  @Get('/stats')
  async getReactionStats(@Query() query: { refKey?: string }): Promise<Record<string, number>> {
    const { refKey } = query

    if (!refKey) {
      throw new BizException(ErrorCode.COMMON_BAD_REQUEST, {
        message: 'refKey query parameter is required',
      })
    }

    return await this.reactionService.getReactionStats(refKey)
  }
}
