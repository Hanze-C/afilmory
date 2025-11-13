import { FetchError } from 'ofetch'

type FetchErrorWithPayload = FetchError<unknown> & {
  response?: {
    _data?: unknown
  }
}

function toMessage(value: unknown): string | null {
  if (value == null) {
    return null
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (value instanceof Error) {
    return toMessage(value.message)
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = toMessage(entry)
      if (message) {
        return message
      }
    }
    return null
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const candidates: unknown[] = [record.message, record.error, record.detail, record.description, record.reason]

    for (const candidate of candidates) {
      const message = toMessage(candidate)
      if (message) {
        return message
      }
    }
  }

  return null
}

export function getRequestErrorMessage(error: unknown, fallback = '请求失败，请稍后重试。'): string {
  if (error instanceof FetchError) {
    const payload = (error as FetchErrorWithPayload).data ?? (error as FetchErrorWithPayload).response?._data
    const payloadMessage = toMessage(payload)
    if (payloadMessage) {
      return payloadMessage
    }

    const errorMessage = toMessage(error.message)
    if (errorMessage) {
      return errorMessage
    }
  }

  const genericMessage = toMessage(error)
  if (genericMessage) {
    return genericMessage
  }

  return fallback
}
