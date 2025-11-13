import type { Context } from 'hono'

export interface CreateProgressSseResponseOptions<TEvent> {
  context: Context
  eventName?: string
  heartbeatIntervalMs?: number
  handler: (helpers: SseHandlerHelpers<TEvent>) => Promise<void> | void
}

export interface SseHandlerHelpers<TEvent> {
  sendEvent: (event: TEvent) => void
  sendChunk: (chunk: string) => void
  abortSignal: AbortSignal
}

const DEFAULT_EVENT_NAME = 'progress'
const DEFAULT_HEARTBEAT_MS = 15_000

export function createProgressSseResponse<TEvent>({
  context,
  eventName = DEFAULT_EVENT_NAME,
  heartbeatIntervalMs = DEFAULT_HEARTBEAT_MS,
  handler,
}: CreateProgressSseResponseOptions<TEvent>): Response {
  const encoder = new TextEncoder()
  let cleanup: (() => void) | undefined

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      let closed = false
      const rawRequest = context.req.raw
      const abortSignal = rawRequest.signal

      let heartbeat: ReturnType<typeof setInterval> | undefined
      let abortHandler: (() => void) | undefined

      const cleanupInternal = () => {
        if (heartbeat) {
          clearInterval(heartbeat)
          heartbeat = undefined
        }

        if (abortHandler) {
          abortSignal.removeEventListener('abort', abortHandler)
          abortHandler = undefined
        }

        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            /* ignore */
          }
        }
      }

      const sendChunk = (chunk: string) => {
        if (closed) {
          return
        }

        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          cleanupInternal()
          cleanup = undefined
        }
      }

      const sendEvent = (event: TEvent) => {
        sendChunk(`event: ${eventName}\ndata: ${JSON.stringify(event)}\n\n`)
      }

      heartbeat = setInterval(() => {
        sendChunk(`: keep-alive ${new Date().toISOString()}\n\n`)
      }, heartbeatIntervalMs)

      abortHandler = () => {
        const currentCleanup = cleanup
        cleanup = undefined
        currentCleanup?.()
      }

      abortSignal.addEventListener('abort', abortHandler)

      cleanup = () => {
        cleanupInternal()
        cleanup = undefined
      }

      sendChunk(': connected\n\n')
      ;(async () => {
        try {
          await handler({
            sendEvent,
            sendChunk,
            abortSignal,
          })
        } catch (error) {
          console.error('SSE handler failed', error)
        } finally {
          const currentCleanup = cleanup
          cleanup = undefined
          currentCleanup?.()
        }
      })().catch((error) => {
        console.error('Unhandled SSE handler error', error)
        const currentCleanup = cleanup
        cleanup = undefined
        currentCleanup?.()
      })
    },
    cancel() {
      const currentCleanup = cleanup
      cleanup = undefined
      currentCleanup?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
