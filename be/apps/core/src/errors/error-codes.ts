export enum ErrorCode {
  // Common
  COMMON_VALIDATION = 1,
  COMMON_BAD_REQUEST = 2,
  COMMON_NOT_FOUND = 3,
  COMMON_CONFLICT = 4,
  COMMON_RATE_LIMITED = 5,

  // Auth
  AUTH_UNAUTHORIZED = 10,
  AUTH_FORBIDDEN = 11,

  // Tenant
  TENANT_NOT_FOUND = 20,
  TENANT_SUSPENDED = 21,
  TENANT_INACTIVE = 22,
}

export interface ErrorDescriptor {
  httpStatus: number
  message: string
}

export const ERROR_CODE_DESCRIPTORS: Record<ErrorCode, ErrorDescriptor> = {
  [ErrorCode.COMMON_VALIDATION]: {
    httpStatus: 422,
    message: 'Validation failed',
  },
  [ErrorCode.COMMON_BAD_REQUEST]: {
    httpStatus: 400,
    message: 'Bad request',
  },
  [ErrorCode.COMMON_NOT_FOUND]: {
    httpStatus: 404,
    message: 'Resource not found',
  },
  [ErrorCode.COMMON_CONFLICT]: {
    httpStatus: 409,
    message: 'Resource conflict',
  },
  [ErrorCode.COMMON_RATE_LIMITED]: {
    httpStatus: 429,
    message: 'Too many requests',
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    httpStatus: 401,
    message: 'Unauthorized',
  },
  [ErrorCode.AUTH_FORBIDDEN]: {
    httpStatus: 403,
    message: 'Forbidden',
  },
  [ErrorCode.TENANT_NOT_FOUND]: {
    httpStatus: 404,
    message: 'Tenant not found',
  },
  [ErrorCode.TENANT_SUSPENDED]: {
    httpStatus: 403,
    message: 'Tenant is suspended',
  },
  [ErrorCode.TENANT_INACTIVE]: {
    httpStatus: 403,
    message: 'Tenant is not active',
  },
}
