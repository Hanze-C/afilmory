import { Button } from '@afilmory/ui'
import { clsxm, Spring } from '@afilmory/utils'
import { Copy, Play, Square, Upload } from 'lucide-react'
import { m } from 'motion/react'
import { nanoid } from 'nanoid'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { LinearBorderPanel } from '~/components/common/GlassPanel'
import { getRequestErrorMessage } from '~/lib/errors'
import type { PhotoSyncLogLevel } from '~/modules/photos/types'
import type { BuilderDebugProgressEvent, BuilderDebugResult } from '~/modules/super-admin'
import { runBuilderDebugTest } from '~/modules/super-admin'

const MAX_LOG_ENTRIES = 300

const LEVEL_THEME: Record<PhotoSyncLogLevel, string> = {
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  warn: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
}

const STATUS_LABEL: Record<RunStatus, { label: string; className: string }> = {
  idle: { label: '就绪', className: 'text-text-tertiary' },
  running: { label: '调试中', className: 'text-accent' },
  success: { label: '已完成', className: 'text-emerald-400' },
  error: { label: '失败', className: 'text-rose-400' },
}

type RunStatus = 'idle' | 'running' | 'success' | 'error'
type DebugStartPayload = Extract<BuilderDebugProgressEvent, { type: 'start' }>['payload']

type DebugLogEntry =
  | {
      id: string
      type: 'start' | 'complete' | 'error'
      message: string
      timestamp: number
    }
  | {
      id: string
      type: 'log'
      level: PhotoSyncLogLevel
      message: string
      timestamp: number
    }

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function formatTime(timestamp: number): string {
  try {
    return timeFormatter.format(timestamp)
  } catch {
    return '--:--:--'
  }
}

function formatBytes(bytes: number | undefined | null): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function Component() {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={Spring.presets.smooth}
      className="space-y-6"
    >
      <header className="space-y-2">
        <h1 className="text-text text-2xl font-semibold">Builder 调试工具</h1>
        <p className="text-text-tertiary text-sm">
          该工具用于单张图片的 Builder 管线验收。调试过程中不会写入数据库，所有上传与生成的文件会在任务完成后立刻清理。
        </p>
      </header>

      <BuilderDebugConsole />
    </m.div>
  )
}

function BuilderDebugConsole() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logEntries, setLogEntries] = useState<DebugLogEntry[]>([])
  const [result, setResult] = useState<BuilderDebugResult | null>(null)
  const [runMeta, setRunMeta] = useState<DebugStartPayload | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const logViewportRef = useRef<HTMLDivElement>(null)

  const isRunning = runStatus === 'running'
  const manifestJson = useMemo(
    () => (result?.manifestItem ? JSON.stringify(result.manifestItem, null, 2) : null),
    [result],
  )

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!logViewportRef.current) {
      return
    }
    logViewportRef.current.scrollTop = logViewportRef.current.scrollHeight
  }, [logEntries])

  const appendLogEntry = useCallback((event: BuilderDebugProgressEvent) => {
    setLogEntries((prev) => {
      const entry = buildLogEntry(event)
      if (!entry) {
        return prev
      }
      const next = [...prev, entry]
      if (next.length > MAX_LOG_ENTRIES) {
        return next.slice(-MAX_LOG_ENTRIES)
      }
      return next
    })
  }, [])

  const handleProgressEvent = useCallback(
    (event: BuilderDebugProgressEvent) => {
      appendLogEntry(event)

      if (event.type === 'start') {
        setRunMeta(event.payload)
        setErrorMessage(null)
      }

      if (event.type === 'complete') {
        setResult(event.payload)
        setRunStatus('success')
      }

      if (event.type === 'error') {
        setErrorMessage(event.payload.message)
        setRunStatus('error')
      }
    },
    [appendLogEntry],
  )

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    setSelectedFile(file)
    setResult(null)
    setErrorMessage(null)
    setRunMeta(null)
    setLogEntries([])
    setRunStatus('idle')
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setResult(null)
    setRunMeta(null)
    setLogEntries([])
    setRunStatus('idle')
    setErrorMessage(null)
  }

  const handleStart = useCallback(async () => {
    if (!selectedFile) {
      toast.info('请选择需要调试的图片文件')
      return
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setRunStatus('running')
    setErrorMessage(null)
    setResult(null)
    setLogEntries([])
    setRunMeta(null)

    try {
      const debugResult = await runBuilderDebugTest(selectedFile, {
        signal: controller.signal,
        onEvent: handleProgressEvent,
      })

      setResult(debugResult)
      setRunStatus('success')
      toast.success('调试完成', { description: 'Builder 管线执行成功，产物已清理。' })
    } catch (error) {
      if (controller.signal.aborted) {
        toast.info('调试已取消')
        setRunStatus('idle')
      } else {
        const message = getRequestErrorMessage(error, '调试失败，请检查后重试。')
        setErrorMessage(message)
        setRunStatus('error')
        toast.error('调试失败', { description: message })
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [handleProgressEvent, selectedFile])

  const handleCancel = () => {
    if (!isRunning) {
      return
    }
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setRunStatus('idle')
    setErrorMessage('调试已被手动取消。')
    setLogEntries((prev) => [
      ...prev,
      {
        id: nanoid(),
        type: 'error',
        message: '手动取消调试任务',
        timestamp: Date.now(),
      },
    ])
    toast.info('调试已取消')
  }

  const handleCopyManifest = async () => {
    if (!manifestJson) {
      return
    }

    try {
      await navigator.clipboard.writeText(manifestJson)
      toast.success('已复制 manifest 数据')
    } catch (error) {
      toast.error('复制失败', {
        description: getRequestErrorMessage(error, '请手动复制内容'),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <LinearBorderPanel className="bg-background-tertiary/70 relative overflow-hidden rounded-xl p-6">
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text text-base font-semibold">调试输入</p>
                  <p className="text-text-tertiary text-xs">选择一张原始图片，系统将模拟 Builder 处理链路。</p>
                </div>
                <StatusBadge status={runStatus} />
              </div>

              <label
                htmlFor="builder-debug-file"
                className={clsxm(
                  'border-border/30 bg-fill/10 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition hover:border-accent/40 hover:bg-accent/5',
                  isRunning && 'pointer-events-none opacity-60',
                )}
              >
                <Upload className="mb-3 h-6 w-6 text-text" />
                <p className="text-text text-sm font-medium">
                  {selectedFile ? selectedFile.name : '点击或拖拽图片到此区域'}
                </p>
                <p className="text-text-tertiary mt-1 text-xs">仅支持单张图片，最大 25 MB</p>
              </label>
              <input
                id="builder-debug-file"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isRunning}
              />

              {selectedFile ? (
                <div className="text-text-secondary flex items-center justify-between rounded-lg bg-background-secondary/80 px-3 py-2 text-xs">
                  <div>
                    <p className="text-text text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-text-tertiary text-xs mt-0.5">
                      {formatBytes(selectedFile.size)} · {selectedFile.type || 'unknown'}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="xs" onClick={handleClearFile} disabled={isRunning}>
                    清除
                  </Button>
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handleStart} disabled={!selectedFile || isRunning}>
                  <Play className="mr-2 h-4 w-4" />
                  启动调试
                </Button>
                {isRunning ? (
                  <Button type="button" variant="ghost" onClick={handleCancel}>
                    <Square className="mr-2 h-4 w-4" />
                    取消调试
                  </Button>
                ) : null}
              </div>
              <p className="text-text-tertiary text-xs">
                执行期间请保持页面开启。调试依赖与 Data Sync 相同的 builder 配置，并实时返回日志。
              </p>
              {errorMessage ? <p className="text-rose-400 text-xs">{errorMessage}</p> : null}
            </section>

            {runMeta ? (
              <section className="space-y-2 rounded-lg bg-background-secondary/70 px-4 py-3 text-xs">
                <p className="text-text text-sm font-semibold">最近一次任务</p>
                <div className="space-y-1">
                  <DetailRow label="文件">{runMeta.filename}</DetailRow>
                  <DetailRow label="大小">{formatBytes(runMeta.size)}</DetailRow>
                  <DetailRow label="Storage Key">{runMeta.storageKey}</DetailRow>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg bg-fill/10 px-3 py-2 text-[11px] leading-5 text-text-tertiary">
              <p>⚠️ 调试以安全模式运行：</p>
              <ul className="mt-1 list-disc pl-4">
                <li>不写入照片资产数据库记录</li>
                <li>不在存储中保留任何调试产物</li>
                <li>所有日志均实时输出，供排查使用</li>
              </ul>
            </section>
          </div>
        </LinearBorderPanel>

        <LinearBorderPanel className="bg-background-tertiary/70 relative flex min-h-[420px] flex-col rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text text-base font-semibold">实时日志</p>
              <p className="text-text-tertiary text-xs">最新 {logEntries.length} 条消息</p>
            </div>
            <span className="text-text-tertiary text-xs">来源：Builder + Data Sync Relay</span>
          </div>

          <div
            ref={logViewportRef}
            className="border-border/20 bg-background-secondary/40 mt-4 flex-1 overflow-y-auto rounded-xl border p-3"
          >
            {logEntries.length === 0 ? (
              <div className="text-text-tertiary flex h-full items-center justify-center text-sm">
                {isRunning ? '正在初始化调试环境...' : '尚无日志'}
              </div>
            ) : (
              <ul className="space-y-2 text-xs">
                {logEntries.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3">
                    <span className="text-text-tertiary w-14 shrink-0 font-mono">{formatTime(entry.timestamp)}</span>
                    <LogPill entry={entry} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </LinearBorderPanel>
      </div>

      <LinearBorderPanel className="bg-background-tertiary/70 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-text text-base font-semibold">调试输出</p>
            <p className="text-text-tertiary text-xs">展示 Builder 返回的 manifest 摘要</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleCopyManifest} disabled={!manifestJson}>
            <Copy className="mr-2 h-4 w-4" />
            复制 manifest
          </Button>
        </div>

        {result ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <SummaryTile label="Result Type" value={result.resultType.toUpperCase()} />
              <SummaryTile label="Storage Key" value={result.storageKey} isMono />
              <SummaryTile label="缩略图 URL" value={result.thumbnailUrl || '未生成'} isMono />
              <SummaryTile label="产物已清理" value={result.filesDeleted ? 'Yes' : 'No'} />
            </div>

            {manifestJson ? (
              <pre className="border-border/30 bg-background-secondary/70 relative max-h-[360px] overflow-auto rounded-xl border p-4 text-xs text-text">
                {manifestJson}
              </pre>
            ) : (
              <p className="text-text-tertiary text-sm">当前任务未生成 manifest 数据。</p>
            )}
          </div>
        ) : (
          <div className="text-text-tertiary mt-4 text-sm">运行调试后，这里会显示 manifest 内容与概要。</div>
        )}
      </LinearBorderPanel>
    </div>
  )
}

function SummaryTile({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="border-border/30 bg-background-secondary/60 rounded-lg border px-3 py-2 text-xs">
      <p className="text-text-tertiary uppercase tracking-wide">{label}</p>
      <p className={clsxm('text-text mt-1 text-sm wrap-break-word', isMono && 'font-mono text-[11px]')}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: RunStatus }) {
  const config = STATUS_LABEL[status]
  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      <span className={clsxm('relative inline-flex h-2.5 w-2.5 items-center justify-center', config.className)}>
        <span className="bg-current inline-flex h-1.5 w-1.5 rounded-full" />
      </span>
      <span className={config.className}>{config.label}</span>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-text-tertiary flex gap-2">
      <span className="min-w-[72px] text-right text-[11px] uppercase tracking-wide">{label}</span>
      <span className="text-text text-xs font-mono">{children}</span>
    </div>
  )
}

function LogPill({ entry }: { entry: DebugLogEntry }) {
  if (entry.type === 'log') {
    return (
      <div className={clsxm('min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs', LEVEL_THEME[entry.level])}>
        <p className="font-semibold uppercase tracking-wide text-[10px]">{entry.level}</p>
        <p className="mt-0.5 wrap-break-word text-[11px]">{entry.message}</p>
      </div>
    )
  }

  const tone =
    entry.type === 'error'
      ? 'border border-rose-500/40 bg-rose-500/10 text-rose-100'
      : entry.type === 'start'
        ? 'bg-accent/10 text-accent'
        : 'bg-emerald-500/10 text-emerald-100'
  const label = entry.type === 'start' ? 'START' : entry.type === 'complete' ? 'COMPLETE' : 'ERROR'
  return (
    <div className={clsxm('min-w-0 flex-1 rounded-lg px-3 py-2 text-xs', tone)}>
      <p className="font-semibold uppercase tracking-wide text-[10px]">{label}</p>
      <p className="mt-0.5 wrap-break-word text-[11px]">{entry.message}</p>
    </div>
  )
}

function buildLogEntry(event: BuilderDebugProgressEvent): DebugLogEntry | null {
  const id = nanoid()
  const timestamp = Date.now()

  switch (event.type) {
    case 'start': {
      return {
        id,
        type: 'start',
        message: `上传 ${event.payload.filename}，准备执行 Builder`,
        timestamp,
      }
    }
    case 'complete': {
      return {
        id,
        type: 'complete',
        message: `构建完成 · 结果 ${event.payload.resultType}`,
        timestamp,
      }
    }
    case 'error': {
      return {
        id,
        type: 'error',
        message: event.payload.message,
        timestamp,
      }
    }
    case 'log': {
      return {
        id,
        type: 'log',
        level: event.payload.level,
        message: event.payload.message,
        timestamp: Date.parse(event.payload.timestamp) || timestamp,
      }
    }
    default: {
      return null
    }
  }
}
