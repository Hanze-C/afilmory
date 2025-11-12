import type { ErrorCode, ErrorDescriptor } from './error-codes'
import { ERROR_CODE_DESCRIPTORS } from './error-codes'

export interface BizExceptionOptions {
  message?: string
  cause?: unknown
}

export interface BizErrorResponse {
  ok: boolean
  code: ErrorCode
  message: string
}

export class BizException extends Error {
  readonly code: ErrorCode

  private readonly httpStatus: number

  readonly message: string
  constructor(code: ErrorCode, options?: BizExceptionOptions) {
    const descriptor: ErrorDescriptor = ERROR_CODE_DESCRIPTORS[code]
    super(options?.message ?? descriptor.message, options?.cause ? { cause: options.cause } : undefined)
    this.name = 'BizException'
    this.code = code
    this.httpStatus = descriptor.httpStatus
    this.message = options?.message ?? descriptor.message
  }

  getHttpStatus(): number {
    return this.httpStatus
  }

  toResponse(): BizErrorResponse {
    return {
      ok: false,
      code: this.code,
      message: this.message,
    }
  }
}
