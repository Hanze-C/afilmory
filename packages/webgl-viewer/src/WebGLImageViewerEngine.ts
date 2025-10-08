import type { RefObject } from 'react'

import { LoadingState } from './enum'
import { ImageViewerEngineBase } from './ImageViewerEngineBase'
import type { DebugInfo, WebGLImageViewerProps } from './interface'
import {
  createShader,
  FRAGMENT_SHADER_SOURCE,
  VERTEX_SHADER_SOURCE,
} from './shaders'

type DebugInfoSetter = RefObject<(debugInfo: DebugInfo) => void>

interface PointerSnapshot {
  readonly pointerId: number
  readonly x: number
  readonly y: number
}

interface Matrix3x3 extends Float32Array {
  0: number
  1: number
  2: number
  3: number
  4: number
  5: number
  6: number
  7: number
  8: number
}

const SIMPLE_LOD_LEVELS: ReadonlyArray<{
  readonly scale: number
  readonly quality: 'low' | 'medium' | 'high'
}> = [
  { scale: 0.25, quality: 'low' },
  { scale: 0.5, quality: 'medium' },
  { scale: 1, quality: 'high' },
  { scale: 2, quality: 'high' },
  { scale: 4, quality: 'high' },
]

// Keep in sync with `texture.worker.js`
const TILE_SIZE = 512 as const

const SCALE_EPSILON = 1e-3
const DEFAULT_ZOOM_ANIMATION_DURATION = 220
const DEFAULT_ZOOM_EASING = 3

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function createIdentityMatrix(): Matrix3x3 {
  return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) as Matrix3x3
}

function createProjectionMatrix(width: number, height: number): Matrix3x3 {
  const matrix = createIdentityMatrix()
  matrix[0] = 2 / width
  matrix[4] = -2 / height
  matrix[6] = -1
  matrix[7] = 1
  return matrix
}

function multiplyMatrix(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  const out = createIdentityMatrix()

  out[0] = a[0] * b[0] + a[3] * b[1] + a[6] * b[2]
  out[1] = a[1] * b[0] + a[4] * b[1] + a[7] * b[2]
  out[2] = a[2] * b[0] + a[5] * b[1] + a[8] * b[2]

  out[3] = a[0] * b[3] + a[3] * b[4] + a[6] * b[5]
  out[4] = a[1] * b[3] + a[4] * b[4] + a[7] * b[5]
  out[5] = a[2] * b[3] + a[5] * b[4] + a[8] * b[5]

  out[6] = a[0] * b[6] + a[3] * b[7] + a[6] * b[8]
  out[7] = a[1] * b[6] + a[4] * b[7] + a[7] * b[8]
  out[8] = a[2] * b[6] + a[5] * b[7] + a[8] * b[8]

  return out
}

function createTranslationMatrix(tx: number, ty: number): Matrix3x3 {
  const matrix = createIdentityMatrix()
  matrix[6] = tx
  matrix[7] = ty
  return matrix
}

function createScaleMatrix(sx: number, sy: number): Matrix3x3 {
  const matrix = createIdentityMatrix()
  matrix[0] = sx
  matrix[4] = sy
  return matrix
}

function qualityFromLOD(
  lodLevel: number,
): 'high' | 'medium' | 'low' | 'unknown' {
  const level = SIMPLE_LOD_LEVELS[lodLevel]
  return level?.quality ?? 'unknown'
}

export class WebGLImageViewerEngine extends ImageViewerEngineBase {
  public src: string
  public className: string
  public width: number
  public height: number
  public initialScale: number
  public minScale: number
  public maxScale: number
  public wheel: NonNullable<WebGLImageViewerProps['wheel']>
  public pinch: NonNullable<WebGLImageViewerProps['pinch']>
  public doubleClick: NonNullable<WebGLImageViewerProps['doubleClick']>
  public panning: NonNullable<WebGLImageViewerProps['panning']>
  public limitToBounds: boolean
  public centerOnInit: boolean
  public smooth: boolean
  public alignmentAnimation: Required<
    WebGLImageViewerProps['alignmentAnimation']
  >
  public velocityAnimation: Required<WebGLImageViewerProps['velocityAnimation']>
  public onZoomChange: Required<WebGLImageViewerProps>['onZoomChange']
  public onImageCopied: Required<WebGLImageViewerProps>['onImageCopied']
  public onLoadingStateChange: Required<WebGLImageViewerProps>['onLoadingStateChange']
  public debug: boolean

  private readonly canvas: HTMLCanvasElement
  private readonly gl: WebGLRenderingContext
  private readonly debugInfoSetter?: DebugInfoSetter

  private program: WebGLProgram | null = null
  private positionBuffer: WebGLBuffer | null = null
  private texCoordBuffer: WebGLBuffer | null = null
  private positionLocation = -1
  private texCoordLocation = -1
  private matrixLocation: WebGLUniformLocation | null = null
  private textureLocation: WebGLUniformLocation | null = null
  private uvRectLocation: WebGLUniformLocation | null = null
  private texture: WebGLTexture | null = null

  private scaleInternal = 1
  private translateX = 0
  private translateY = 0
  private fitToScreenScale = 1
  private effectiveMinScale = 0
  private effectiveMaxScale = 0

  private imageWidth = 0
  private imageHeight = 0
  private textureWidth = 0
  private textureHeight = 0

  private viewportWidth = 0
  private viewportHeight = 0
  private canvasWidth = 0
  private canvasHeight = 0
  private devicePixelRatio = 1

  private isLoading = false
  private currentLOD = 0
  private readonly totalLODLevels = SIMPLE_LOD_LEVELS.length
  private quality: 'high' | 'medium' | 'low' | 'unknown' = 'unknown'

  private maxTextureSize = 0
  private maxViewportWidth = 16384
  private maxViewportHeight = 16384
  private maxRenderbufferSize = 16384
  private renderCount = 0

  // Tiling system (first pass implementation)
  private useTiling = true
  private readonly tileSize = TILE_SIZE
  private readonly maxTilesPerFrame = 24
  private tileCache = new Map<
    string,
    {
      texture: WebGLTexture
      width: number
      height: number
      lod: number
      x: number
      y: number
    }
  >()
  private tileLoading = new Set<string>()
  private tileCacheLimit = 512

  private readonly pointerSnapshots = new Map<number, PointerSnapshot>()
  private initialPinchDistance: number | null = null
  private initialPinchScale = 1

  private readonly handleWheelBound: (event: WheelEvent) => void
  private readonly handlePointerDownBound: (event: PointerEvent) => void
  private readonly handlePointerMoveBound: (event: PointerEvent) => void
  private readonly handlePointerUpBound: (event: PointerEvent) => void
  private readonly handlePointerCancelBound: (event: PointerEvent) => void
  private readonly handleDoubleClickBound: (event: MouseEvent) => void
  private readonly handleResizeBound: () => void
  private readonly handleContextLostBound: (event: Event) => void
  private readonly handleContextRestoredBound: () => void

  private readonly zoomAnimationStep = (timestamp: number) => {
    if (!this.zoomAnimation) return
    const { startTime, duration, startScale, targetScale, pivot } =
      this.zoomAnimation

    const elapsed = timestamp - startTime
    const progress = duration <= 0 ? 1 : Math.min(elapsed / duration, 1)
    const easedProgress = 1 - Math.pow(1 - progress, DEFAULT_ZOOM_EASING)

    const currentScale = startScale + (targetScale - startScale) * easedProgress
    this.applyZoomAt(pivot.x, pivot.y, currentScale)

    if (progress < 1) {
      this.zoomAnimation.rafId = requestAnimationFrame(this.zoomAnimationStep)
      return
    }

    this.applyZoomAt(pivot.x, pivot.y, targetScale)
    this.stopZoomAnimation()
  }
  private pendingLoadResolve: ((value: void) => void) | null = null
  private pendingLoadReject: ((reason?: unknown) => void) | null = null

  private renderScheduled = false
  private animationFrameId: number | null = null
  private destroyed = false

  private zoomAnimation: {
    rafId: number | null
    startTime: number
    duration: number
    startScale: number
    targetScale: number
    pivot: { x: number; y: number }
  } | null = null

  public constructor(
    canvas: HTMLCanvasElement,
    config: Required<WebGLImageViewerProps>,
    debugInfoSetter?: DebugInfoSetter,
  ) {
    super()

    this.canvas = canvas
    this.debugInfoSetter = debugInfoSetter

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      throw new Error('Failed to acquire WebGL context')
    }

    this.gl = gl
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array
    if (maxViewportDims && maxViewportDims.length >= 2) {
      this.maxViewportWidth = maxViewportDims[0]
      this.maxViewportHeight = maxViewportDims[1]
    }
    const rboLimit = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number
    if (typeof rboLimit === 'number') {
      this.maxRenderbufferSize = rboLimit
    }

    this.src = config.src
    this.className = config.className
    this.width = config.width
    this.height = config.height
    this.initialScale = config.initialScale
    this.minScale = config.minScale
    this.maxScale = config.maxScale
    this.wheel = config.wheel
    this.pinch = config.pinch
    this.doubleClick = config.doubleClick
    this.panning = config.panning
    this.limitToBounds = config.limitToBounds
    this.centerOnInit = config.centerOnInit
    this.smooth = config.smooth
    this.alignmentAnimation = config.alignmentAnimation
    this.velocityAnimation = config.velocityAnimation
    this.onZoomChange = config.onZoomChange
    this.onImageCopied = config.onImageCopied
    this.onLoadingStateChange = config.onLoadingStateChange
    this.debug = config.debug

    this.handleWheelBound = this.handleWheel.bind(this)
    this.handlePointerDownBound = this.handlePointerDown.bind(this)
    this.handlePointerMoveBound = this.handlePointerMove.bind(this)
    this.handlePointerUpBound = this.handlePointerUp.bind(this)
    this.handlePointerCancelBound = this.handlePointerCancel.bind(this)
    this.handleDoubleClickBound = this.handleDoubleClick.bind(this)
    this.handleResizeBound = this.handleResize.bind(this)
    this.handleContextLostBound = this.handleContextLost.bind(this)
    this.handleContextRestoredBound = this.handleContextRestored.bind(this)

    this.effectiveMinScale = this.minScale
    this.effectiveMaxScale = this.maxScale

    this.setupGLResources()
    this.updateCanvasSize()
    this.attachEventListeners()
  }

  public getScale(): number {
    return this.scaleInternal
  }

  public zoomAt(
    x: number,
    y: number,
    scale: number,
    animated = false,
    animationDurationMs = DEFAULT_ZOOM_ANIMATION_DURATION,
  ): void {
    if (!this.texture) return
    const targetScale = this.clampScale(scale)
    const rect = this.canvas.getBoundingClientRect()
    const deviceX = clamp(x, 0, rect.width) * this.devicePixelRatio
    const deviceY = clamp(y, 0, rect.height) * this.devicePixelRatio

    if (animated) {
      this.animateZoom(deviceX, deviceY, targetScale, animationDurationMs)
      return
    }

    this.stopZoomAnimation()
    this.applyZoomAt(deviceX, deviceY, targetScale)
  }

  public zoomIn(animated?: boolean): void {
    const factor = 1 + this.wheel.step
    this.zoomAt(
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      this.scaleInternal * factor,
      animated,
    )
  }

  public zoomOut(animated?: boolean): void {
    const factor = 1 + this.wheel.step
    this.zoomAt(
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      this.scaleInternal / factor,
      animated,
    )
  }

  public resetView(): void {
    if (!this.texture) return
    this.scaleInternal = this.clampScale(
      this.fitToScreenScale * (this.initialScale || 1),
    )
    this.translateX = 0
    this.translateY = 0
    this.clampTranslation()
    this.scheduleRender()
    this.emitZoomChange()
  }

  public async loadImage(
    url: string,
    preknownWidth?: number,
    preknownHeight?: number,
  ): Promise<void> {
    this.releaseTexture()
    this.cancelPendingLoad()

    this.src = url
    if (preknownWidth && preknownHeight) {
      this.imageWidth = preknownWidth
      this.imageHeight = preknownHeight
    }

    this.setLoadingState(true, LoadingState.IMAGE_LOADING, 'unknown')

    return new Promise((resolve, reject) => {
      this.pendingLoadResolve = resolve
      this.pendingLoadReject = reject

      this.loadImageWithoutWorker(url)
        .then((bitmap) => {
          this.handleImageBitmap({
            imageBitmap: bitmap,
            imageHeight: bitmap.height,
            imageWidth: bitmap.width,
            lodLevel: 2,
          })
          this.finishPendingLoad()
        })
        .catch((error) => {
          this.handleLoadError(error)
        })
    })
  }

  public destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    this.detachEventListeners()
    this.cancelAnimationFrame()
    this.releaseTexture()

    this.pendingLoadResolve = null
    this.pendingLoadReject = null
  }

  private setupGLResources(): void {
    const { gl } = this

    const vertexShader = createShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SHADER_SOURCE,
    )
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER_SOURCE,
    )

    const program = gl.createProgram()
    if (!program) {
      throw new Error('Failed to create WebGL program')
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program)
      gl.deleteProgram(program)
      throw new Error(`Failed to link WebGL program: ${error ?? ''}`)
    }

    this.program = program
    this.positionLocation = gl.getAttribLocation(program, 'a_position')
    this.texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
    this.matrixLocation = gl.getUniformLocation(program, 'u_matrix')
    this.textureLocation = gl.getUniformLocation(program, 'u_image')
    this.uvRectLocation = gl.getUniformLocation(program, 'u_uvRect')

    this.positionBuffer = gl.createBuffer()
    this.texCoordBuffer = gl.createBuffer()

    if (!this.positionBuffer || !this.texCoordBuffer) {
      throw new Error('Failed to create WebGL buffers')
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    const positions = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)

    gl.useProgram(program)
    gl.uniform1i(this.textureLocation, 0)
    // default full-quad UV
    gl.uniform4f(this.uvRectLocation, 0, 0, 1, 1)
    gl.useProgram(null)

    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  }

  private attachEventListeners(): void {
    this.canvas.addEventListener('wheel', this.handleWheelBound, {
      passive: false,
    })
    this.canvas.addEventListener('pointerdown', this.handlePointerDownBound)
    this.canvas.addEventListener('pointermove', this.handlePointerMoveBound)
    this.canvas.addEventListener('pointerup', this.handlePointerUpBound)
    this.canvas.addEventListener('pointercancel', this.handlePointerCancelBound)
    this.canvas.addEventListener('dblclick', this.handleDoubleClickBound)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResizeBound)
    }
    // Context loss / restore handling
    this.canvas.addEventListener(
      'webglcontextlost',
      this.handleContextLostBound as EventListener,
      false,
    )
    this.canvas.addEventListener(
      'webglcontextrestored',
      this.handleContextRestoredBound as EventListener,
      false,
    )
  }

  private detachEventListeners(): void {
    this.canvas.removeEventListener('wheel', this.handleWheelBound)
    this.canvas.removeEventListener('pointerdown', this.handlePointerDownBound)
    this.canvas.removeEventListener('pointermove', this.handlePointerMoveBound)
    this.canvas.removeEventListener('pointerup', this.handlePointerUpBound)
    this.canvas.removeEventListener(
      'pointercancel',
      this.handlePointerCancelBound,
    )
    this.canvas.removeEventListener('dblclick', this.handleDoubleClickBound)
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResizeBound)
    }
    this.canvas.removeEventListener(
      'webglcontextlost',
      this.handleContextLostBound as EventListener,
    )
    this.canvas.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestoredBound as EventListener,
    )
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.texture || this.wheel.wheelDisabled) return

    event.preventDefault()

    const isTrackPad = Math.abs(event.deltaY) < 30
    if (isTrackPad && this.wheel.touchPadDisabled) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    const cssX = event.clientX - rect.left
    const cssY = event.clientY - rect.top

    const direction = event.deltaY > 0 ? -1 : 1
    const factor = 1 + this.wheel.step * direction
    this.zoomAt(cssX, cssY, this.scaleInternal * factor)
  }

  private handlePointerDown(event: PointerEvent): void {
    if (
      !this.texture ||
      (event.button !== 0 && event.pointerType === 'mouse')
    ) {
      return
    }

    this.canvas.setPointerCapture(event.pointerId)
    const snapshot = this.createPointerSnapshot(event)
    this.pointerSnapshots.set(event.pointerId, snapshot)

    if (this.pointerSnapshots.size === 2) {
      this.initialPinchDistance = this.computePinchDistance()
      this.initialPinchScale = this.scaleInternal
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.pointerSnapshots.has(event.pointerId)) return

    const nextSnapshot = this.createPointerSnapshot(event)
    const previousSnapshot = this.pointerSnapshots.get(event.pointerId)
    if (!previousSnapshot) return

    this.pointerSnapshots.set(event.pointerId, nextSnapshot)

    if (!this.texture) return

    if (this.pointerSnapshots.size === 1) {
      if (this.panning.disabled) return
      this.stopZoomAnimation()
      const deltaX = nextSnapshot.x - previousSnapshot.x
      const deltaY = nextSnapshot.y - previousSnapshot.y
      this.translateX += deltaX
      this.translateY += deltaY
      if (this.limitToBounds) {
        this.clampTranslation()
      }
      this.scheduleRender()
      return
    }

    if (this.pointerSnapshots.size === 2 && !this.pinch.disabled) {
      const distance = this.computePinchDistance()
      if (!distance || !this.initialPinchDistance) {
        return
      }

      this.stopZoomAnimation()
      const scaleRatio = distance / this.initialPinchDistance
      const targetScale = this.clampScale(this.initialPinchScale * scaleRatio)
      const center = this.computePinchCenter()
      this.applyZoomAt(center.x, center.y, targetScale)
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    this.pointerSnapshots.delete(event.pointerId)
    if (this.pointerSnapshots.size < 2) {
      this.initialPinchDistance = null
    }
  }

  private handlePointerCancel(event: PointerEvent): void {
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    this.pointerSnapshots.delete(event.pointerId)
    if (this.pointerSnapshots.size < 2) {
      this.initialPinchDistance = null
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    if (this.doubleClick.disabled || !this.texture) return
    event.preventDefault()

    const rect = this.canvas.getBoundingClientRect()
    const cssX = event.clientX - rect.left
    const cssY = event.clientY - rect.top

    if (this.doubleClick.mode === 'toggle') {
      const originalScale = this.getOriginalScale()
      const fitScale = this.clampScale(
        this.fitToScreenScale > 0 ? this.fitToScreenScale : originalScale,
      )

      const targetScale = this.pickDoubleClickTarget(originalScale, fitScale)
      const animated = this.doubleClick.animationTime > 0
      this.zoomAt(
        cssX,
        cssY,
        targetScale,
        animated,
        this.doubleClick.animationTime,
      )
      return
    }

    const animated = this.doubleClick.animationTime > 0
    this.zoomAt(
      cssX,
      cssY,
      this.scaleInternal * this.doubleClick.step,
      animated,
      this.doubleClick.animationTime,
    )
  }

  private pickDoubleClickTarget(
    originalScale: number,
    fitScale: number,
  ): number {
    if (
      this.isApproximatelyScale(this.scaleInternal, originalScale) &&
      this.doubleClick.mode === 'toggle'
    ) {
      return fitScale
    }

    if (this.isApproximatelyScale(this.scaleInternal, fitScale)) {
      return originalScale
    }

    const closerToOriginal =
      Math.abs(this.scaleInternal - originalScale) <
      Math.abs(this.scaleInternal - fitScale)

    return closerToOriginal ? originalScale : fitScale
  }

  private getOriginalScale(): number {
    if (!this.imageWidth || !this.imageHeight) {
      return this.scaleInternal
    }

    const scaleX =
      this.textureWidth > 0 ? this.imageWidth / this.textureWidth : 1
    const scaleY =
      this.textureHeight > 0 ? this.imageHeight / this.textureHeight : 1
    const originalScale = Math.max(scaleX, scaleY)
    return this.clampScale(originalScale)
  }

  private isApproximatelyScale(a: number, b: number): boolean {
    return Math.abs(a - b) <= SCALE_EPSILON * Math.max(1, b)
  }

  private computeInitialDisplayScale(): number {
    const fitScale = this.fitToScreenScale > 0 ? this.fitToScreenScale : 1
    const baseScale = this.initialScale > 0 ? this.initialScale : 1
    return this.clampScale(fitScale * baseScale)
  }

  private handleResize(): void {
    this.updateCanvasSize()
    if (this.texture) {
      this.fitToScreenScale = this.computeFitToScreenScale()
      this.updateScaleBounds()
      this.clampTranslation()
      this.scheduleRender()
      this.emitZoomChange()
    }
  }

  private applyZoomAt(
    deviceX: number,
    deviceY: number,
    targetScale: number,
  ): void {
    const previousScale = this.scaleInternal
    if (Math.abs(previousScale - targetScale) < 1e-5) {
      return
    }

    const drawMetadata = this.computeDrawMetadata(previousScale)
    const normalizedX = this.computeNormalizedCoordinate(
      deviceX,
      drawMetadata.drawX,
      drawMetadata.scaledWidth,
    )
    const normalizedY = this.computeNormalizedCoordinate(
      deviceY,
      drawMetadata.drawY,
      drawMetadata.scaledHeight,
    )

    this.scaleInternal = targetScale

    const nextMetadata = this.computeDrawMetadata(targetScale)
    const nextDrawX =
      deviceX -
      normalizedX * nextMetadata.scaledWidth -
      (this.canvasWidth - nextMetadata.scaledWidth) / 2
    const nextDrawY =
      deviceY -
      normalizedY * nextMetadata.scaledHeight -
      (this.canvasHeight - nextMetadata.scaledHeight) / 2

    this.translateX = nextDrawX
    this.translateY = nextDrawY

    if (this.limitToBounds) {
      this.clampTranslation()
    }

    this.scheduleRender()
    this.emitZoomChange()
  }

  private computeNormalizedCoordinate(
    deviceCoordinate: number,
    drawStart: number,
    scaledLength: number,
  ): number {
    if (scaledLength <= 0) return 0.5
    return (deviceCoordinate - drawStart) / scaledLength
  }

  private computeDrawMetadata(scale: number): {
    readonly drawX: number
    readonly drawY: number
    readonly scaledWidth: number
    readonly scaledHeight: number
  } {
    const scaledWidth = this.imageWidth * scale
    const scaledHeight = this.imageHeight * scale
    const drawX = (this.canvasWidth - scaledWidth) / 2 + this.translateX
    const drawY = (this.canvasHeight - scaledHeight) / 2 + this.translateY
    return { drawX, drawY, scaledWidth, scaledHeight }
  }

  private scheduleRender(): void {
    if (this.renderScheduled || this.destroyed) return
    this.renderScheduled = true
    this.animationFrameId = requestAnimationFrame(() => {
      this.renderScheduled = false
      this.render()
    })
  }

  private render(): void {
    if ((!this.texture && this.tileCache.size === 0) || !this.program) return

    const { gl } = this

    gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)
    // Use transparent clear color to avoid black background
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Decide desired LOD by current zoom for promotion/demotion
    const desiredLOD = this.getDesiredLOD()
    this.currentLOD = desiredLOD
    this.quality = qualityFromLOD(desiredLOD)

    // Draw tiles for desired LOD; if incomplete, keep fallback texture
    const { drewAny, complete } = this.drawTiles()

    if (!drewAny || !complete) {
      // Fallback to single-texture draw (initial LOD)
      gl.useProgram(this.program)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
      gl.enableVertexAttribArray(this.positionLocation)
      gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
      gl.enableVertexAttribArray(this.texCoordLocation)
      gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)

      const matrix = this.composeMatrix()
      gl.uniformMatrix3fv(this.matrixLocation, false, matrix)
      // full UV for single texture
      gl.uniform4f(this.uvRectLocation, 0, 0, 1, 1)

      gl.drawArrays(gl.TRIANGLES, 0, 6)

      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.useProgram(null)
    }

    this.renderCount += 1
    this.updateDebugInfo()
  }

  private composeMatrix(): Matrix3x3 {
    const projection = createProjectionMatrix(
      this.canvasWidth,
      this.canvasHeight,
    )
    const metadata = this.computeDrawMetadata(this.scaleInternal)
    const translation = createTranslationMatrix(metadata.drawX, metadata.drawY)
    const scale = createScaleMatrix(
      this.imageWidth * this.scaleInternal,
      this.imageHeight * this.scaleInternal,
    )

    const combined = multiplyMatrix(projection, translation)
    return multiplyMatrix(combined, scale)
  }

  private computeFitToScreenScale(): number {
    if (!this.imageWidth || !this.imageHeight) return 1
    const widthScale = this.canvasWidth / this.imageWidth
    const heightScale = this.canvasHeight / this.imageHeight
    return Math.min(widthScale, heightScale)
  }

  private clampScale(scale: number): number {
    return clamp(scale, this.effectiveMinScale, this.effectiveMaxScale)
  }

  private clampTranslation(): void {
    const metadata = this.computeDrawMetadata(this.scaleInternal)
    const { scaledWidth } = metadata
    const { scaledHeight } = metadata

    const maxTranslateX =
      scaledWidth <= this.canvasWidth ? 0 : (scaledWidth - this.canvasWidth) / 2
    const maxTranslateY =
      scaledHeight <= this.canvasHeight
        ? 0
        : (scaledHeight - this.canvasHeight) / 2

    this.translateX = clamp(this.translateX, -maxTranslateX, maxTranslateX)
    this.translateY = clamp(this.translateY, -maxTranslateY, maxTranslateY)
  }

  private updateCanvasSize(): void {
    const width = this.canvas.clientWidth || this.canvas.width || 1
    const height = this.canvas.clientHeight || this.canvas.height || 1
    this.viewportWidth = width
    this.viewportHeight = height

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    // Cap backing store to GPU limits to avoid iOS Safari context loss
    const desiredW = Math.max(1, Math.round(width * dpr))
    const desiredH = Math.max(1, Math.round(height * dpr))
    const maxW = Math.min(this.maxViewportWidth, this.maxRenderbufferSize)
    const maxH = Math.min(this.maxViewportHeight, this.maxRenderbufferSize)
    const scaleDown = Math.min(maxW / desiredW, maxH / desiredH, 1)
    const effectiveDpr = dpr * scaleDown

    this.devicePixelRatio = effectiveDpr
    this.canvas.width = Math.max(1, Math.round(width * effectiveDpr))
    this.canvas.height = Math.max(1, Math.round(height * effectiveDpr))

    this.canvasWidth = this.canvas.width
    this.canvasHeight = this.canvas.height
  }

  private handleImageBitmap(payload: {
    imageBitmap: ImageBitmap
    imageWidth: number
    imageHeight: number
    lodLevel: number
  }): void {
    const { imageBitmap, imageWidth, imageHeight, lodLevel } = payload

    this.imageWidth = imageWidth
    this.imageHeight = imageHeight
    // Upload with potential downscale to fit GPU limits
    const { width: texW, height: texH } = this.uploadTexture(imageBitmap)
    this.textureWidth = texW
    this.textureHeight = texH
    imageBitmap.close()

    this.currentLOD = lodLevel
    this.quality = qualityFromLOD(lodLevel)

    this.fitToScreenScale = this.computeFitToScreenScale()
    this.updateScaleBounds()
    this.scaleInternal = this.computeInitialDisplayScale()
    this.translateX = 0
    this.translateY = 0
    if (this.limitToBounds) {
      this.clampTranslation()
    }

    this.setLoadingState(false, LoadingState.CREATE_TEXTURE, this.quality)
    this.scheduleRender()
    this.emitZoomChange()
  }

  private async loadImageWithoutWorker(url: string): Promise<ImageBitmap> {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    let bitmap: ImageBitmap
    if ('createImageBitmap' in window) {
      bitmap = await createImageBitmap(blob)
    } else {
      bitmap = await this.decodeWithImageElement(blob)
    }

    // Safety clamp if worker is unavailable: resize on main thread (rare path)
    if (
      bitmap.width > this.maxTextureSize ||
      bitmap.height > this.maxTextureSize
    ) {
      const scale = Math.min(
        1,
        this.maxTextureSize / Math.max(bitmap.width, bitmap.height),
      )
      const targetW = Math.max(1, Math.round(bitmap.width * scale))
      const targetH = Math.max(1, Math.round(bitmap.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(bitmap as any, 0, 0, targetW, targetH)
        // create a new ImageBitmap from canvas to upload
        const resized = await createImageBitmap(canvas)
        bitmap.close()
        return resized
      }
    }

    return bitmap
  }

  private async decodeWithImageElement(blob: Blob): Promise<ImageBitmap> {
    const url = URL.createObjectURL(blob)
    try {
      const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = async () => {
          try {
            if ('createImageBitmap' in window) {
              const data = await createImageBitmap(image)
              resolve(data)
            } else {
              reject(new Error('createImageBitmap is not supported'))
            }
          } catch (error) {
            reject(error)
          } finally {
            URL.revokeObjectURL(url)
          }
        }
        image.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to decode image'))
        }
        image.src = url
      })
      return bitmap
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  private uploadTexture(imageBitmap: ImageBitmap): {
    width: number
    height: number
  } {
    const { gl } = this

    if (!this.texture) {
      this.texture = gl.createTexture()
    }

    if (!this.texture) {
      throw new Error('Failed to create WebGL texture')
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageBitmap,
    )
    gl.bindTexture(gl.TEXTURE_2D, null)

    return { width: imageBitmap.width, height: imageBitmap.height }
  }

  private setLoadingState(
    isLoading: boolean,
    state: LoadingState,
    quality: 'high' | 'medium' | 'low' | 'unknown',
  ): void {
    this.isLoading = isLoading
    this.onLoadingStateChange(isLoading, state, quality)
    this.updateDebugInfo()
  }

  private emitZoomChange(): void {
    const originalScale = this.scaleInternal
    const relativeScale = this.fitToScreenScale
      ? originalScale / this.fitToScreenScale
      : originalScale
    this.onZoomChange(originalScale, relativeScale)
  }

  private updateDebugInfo(): void {
    if (!this.debug || !this.debugInfoSetter) return
    const memoryBudgetBytes = this.maxTextureSize * this.maxTextureSize * 4
    const textureBytes = this.textureWidth * this.textureHeight * 4
    const textureMiB = textureBytes / (1024 * 1024)
    const budgetMiB = memoryBudgetBytes / (1024 * 1024)
    const pressure =
      textureBytes > 0 ? (textureBytes / memoryBudgetBytes) * 100 : 0

    const tileSystem = this.computeTileDebuggerInfo()

    const debugInfo: DebugInfo = {
      scale: this.scaleInternal,
      relativeScale: this.fitToScreenScale
        ? this.scaleInternal / this.fitToScreenScale
        : this.scaleInternal,
      translateX: this.translateX / this.devicePixelRatio,
      translateY: this.translateY / this.devicePixelRatio,
      currentLOD: this.currentLOD,
      lodLevels: this.totalLODLevels,
      canvasSize: {
        width: this.viewportWidth,
        height: this.viewportHeight,
      },
      imageSize: {
        width: this.imageWidth,
        height: this.imageHeight,
      },
      fitToScreenScale: this.fitToScreenScale,
      userMaxScale: this.maxScale,
      effectiveMaxScale: this.effectiveMaxScale,
      originalSizeScale: this.scaleInternal,
      renderCount: this.renderCount,
      maxTextureSize: this.maxTextureSize,
      quality: this.quality,
      isLoading: this.isLoading,
      memory: {
        textures: textureMiB,
        estimated: textureMiB,
        budget: budgetMiB,
        pressure,
        activeLODs: this.isLoading ? 1 : 0,
        maxConcurrentLODs: this.totalLODLevels,
        onDemandStrategy: true,
      },
      tileSystem,
    }

    this.debugInfoSetter.current(debugInfo)
  }

  /**
   * Compute tile debugger information based on current viewport and LOD.
   * This is an estimation to aid debugging; the engine does not schedule tiles yet.
   */
  private computeTileDebuggerInfo(): DebugInfo['tileSystem'] {
    if (
      !this.imageWidth ||
      !this.imageHeight ||
      !this.canvasWidth ||
      !this.canvasHeight
    ) {
      return undefined
    }

    const lodScale = SIMPLE_LOD_LEVELS[this.currentLOD]?.scale ?? 1
    const scaledWidth = this.imageWidth * lodScale
    const scaledHeight = this.imageHeight * lodScale

    const totalCols = Math.max(1, Math.ceil(scaledWidth / TILE_SIZE))
    const totalRows = Math.max(1, Math.ceil(scaledHeight / TILE_SIZE))

    // Compute the intersection between the drawn image rect and the canvas
    const {
      drawX,
      drawY,
      scaledWidth: drawW,
      scaledHeight: drawH,
    } = this.computeDrawMetadata(this.scaleInternal)

    const visX0 = Math.max(0, drawX)
    const visY0 = Math.max(0, drawY)
    const visX1 = Math.min(this.canvasWidth, drawX + drawW)
    const visY1 = Math.min(this.canvasHeight, drawY + drawH)

    const interW = Math.max(0, visX1 - visX0)
    const interH = Math.max(0, visY1 - visY0)
    if (interW === 0 || interH === 0) {
      return {
        cacheSize: 0,
        visibleTiles: 0,
        loadingTiles: 0,
        pendingRequests: 0,
        cacheLimit: totalCols * totalRows,
        maxTilesPerFrame: 0,
        tileSize: TILE_SIZE,
        cacheKeys: [],
        visibleKeys: [],
        loadingKeys: [],
        pendingKeys: [],
      }
    }

    // Map visible rect back to image coordinates, then into LOD-scaled tile space
    const imageX0 = (visX0 - drawX) / this.scaleInternal
    const imageY0 = (visY0 - drawY) / this.scaleInternal
    const imageW = interW / this.scaleInternal
    const imageH = interH / this.scaleInternal

    const lodX0 = imageX0 * lodScale
    const lodY0 = imageY0 * lodScale
    const lodX1 = (imageX0 + imageW) * lodScale
    const lodY1 = (imageY0 + imageH) * lodScale

    const startCol = Math.max(0, Math.floor(lodX0 / TILE_SIZE))
    const endCol = Math.min(totalCols - 1, Math.floor((lodX1 - 1) / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(lodY0 / TILE_SIZE))
    const endRow = Math.min(totalRows - 1, Math.floor((lodY1 - 1) / TILE_SIZE))

    let visibleTiles = 0
    if (endCol >= startCol && endRow >= startRow) {
      visibleTiles = (endCol - startCol + 1) * (endRow - startRow + 1)
    }

    // Generate a small sample of visible keys for display purposes (cap to 100)
    const visibleKeys: string[] = []
    const maxList = 100
    for (let r = startRow; r <= endRow && visibleKeys.length < maxList; r++) {
      for (let c = startCol; c <= endCol && visibleKeys.length < maxList; c++) {
        visibleKeys.push(`${this.currentLOD}_${c}_${r}`)
      }
    }

    return {
      cacheSize: this.tileCache.size,
      visibleTiles,
      loadingTiles: this.tileLoading.size,
      pendingRequests: this.tileLoading.size,
      cacheLimit: this.tileCacheLimit,
      maxTilesPerFrame: this.maxTilesPerFrame,
      tileSize: TILE_SIZE,
      cacheKeys: Array.from(this.tileCache.keys()).slice(0, 50),
      visibleKeys,
      loadingKeys: Array.from(this.tileLoading.values()).slice(0, 50),
      pendingKeys: Array.from(this.tileLoading.values()).slice(0, 50),
    }
  }

  private createPointerSnapshot(event: PointerEvent): PointerSnapshot {
    const rect = this.canvas.getBoundingClientRect()
    const cssX = event.clientX - rect.left
    const cssY = event.clientY - rect.top
    return {
      pointerId: event.pointerId,
      x: cssX * this.devicePixelRatio,
      y: cssY * this.devicePixelRatio,
    }
  }

  private computePinchDistance(): number | null {
    if (this.pointerSnapshots.size !== 2) return null
    const [first, second] = Array.from(this.pointerSnapshots.values())
    const dx = first.x - second.x
    const dy = first.y - second.y
    return Math.hypot(dx, dy)
  }

  private computePinchCenter(): { readonly x: number; readonly y: number } {
    const [first, second] = Array.from(this.pointerSnapshots.values())
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
  }

  private handleTileCreated({
    imageBitmap,
    lodLevel,
    x,
    y,
    width,
    height,
  }: {
    key: string
    imageBitmap: ImageBitmap
    lodLevel: number
    x: number
    y: number
    width: number
    height: number
  }): void {
    // Upload tile to a dedicated texture and cache
    const texture = this.createTextureFromBitmap(imageBitmap)
    imageBitmap.close()

    const key = this.composeTileKey(lodLevel, x, y)
    this.tileCache.set(key, { texture, width, height, lod: lodLevel, x, y })
    this.tileLoading.delete(key)

    this.currentLOD = Math.max(this.currentLOD, lodLevel)
    this.quality = qualityFromLOD(this.currentLOD)
    this.evictTilesIfNeeded()
    this.scheduleRender()
    this.updateDebugInfo()
  }

  private finishPendingLoad(): void {
    this.pendingLoadResolve?.()
    this.pendingLoadResolve = null
    this.pendingLoadReject = null
  }

  private handleLoadError(error: unknown): void {
    console.error('[WebGLImageViewerEngine] Failed to load image:', error)
    this.setLoadingState(false, LoadingState.IMAGE_LOADING, 'unknown')
    this.pendingLoadReject?.(error)
    this.pendingLoadResolve = null
    this.pendingLoadReject = null
  }

  private cancelPendingLoad(): void {
    if (this.pendingLoadReject) {
      this.pendingLoadReject(new Error('Image loading was cancelled'))
    }
    this.pendingLoadResolve = null
    this.pendingLoadReject = null
  }

  private releaseTexture(): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture)
      this.texture = null
    }
    // release tiles
    for (const { texture } of this.tileCache.values()) {
      this.gl.deleteTexture(texture)
    }
    this.tileCache.clear()
    this.tileLoading.clear()
  }

  private animateZoom(
    deviceX: number,
    deviceY: number,
    targetScale: number,
    duration: number,
  ): void {
    const cappedDuration = Math.max(0, duration)
    if (cappedDuration === 0) {
      this.applyZoomAt(deviceX, deviceY, targetScale)
      return
    }

    const now = performance.now()
    const animationPayload = {
      rafId: requestAnimationFrame(this.zoomAnimationStep),
      startTime: now,
      duration: cappedDuration,
      startScale: this.scaleInternal,
      targetScale,
      pivot: { x: deviceX, y: deviceY },
    }

    this.zoomAnimation = animationPayload
  }

  private stopZoomAnimation(): void {
    if (!this.zoomAnimation) return
    if (typeof this.zoomAnimation.rafId === 'number') {
      cancelAnimationFrame(this.zoomAnimation.rafId)
    }
    this.zoomAnimation = null
  }

  private updateScaleBounds(): void {
    const minScale = Math.min(this.minScale, this.fitToScreenScale)
    const maxScale = Math.max(this.maxScale, this.fitToScreenScale)
    this.effectiveMinScale = minScale
    this.effectiveMaxScale = maxScale
  }

  private handleContextLost(event: Event): void {
    event.preventDefault()
    this.setLoadingState(true, LoadingState.CONTEXT_LOST, 'unknown')
    this.cancelAnimationFrame()
  }

  private handleContextRestored(): void {
    // Recreate GL resources and texturing state
    this.setupGLResources()
    if (this.src) {
      // Fallback: reload image on main thread
      this.loadImageWithoutWorker(this.src)
        .then((bitmap) => {
          this.handleImageBitmap({
            imageBitmap: bitmap,
            imageHeight: bitmap.height,
            imageWidth: bitmap.width,
            lodLevel: 2,
          })
        })
        .catch((error) => this.handleLoadError(error))
    }
    this.setLoadingState(false, LoadingState.CONTEXT_RESTORED, this.quality)
    this.scheduleRender()
  }

  private composeTileKey(lod: number, x: number, y: number): string {
    return `${lod}_${x}_${y}`
  }

  private createTextureFromBitmap(imageBitmap: ImageBitmap): WebGLTexture {
    const { gl } = this
    const tex = gl.createTexture()
    if (!tex) throw new Error('Failed to create tile texture')
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageBitmap,
    )
    gl.bindTexture(gl.TEXTURE_2D, null)
    return tex
  }

  private evictTilesIfNeeded(): void {
    if (this.tileCache.size <= this.tileCacheLimit) return
    // Simple FIFO eviction for now
    const toRemove = this.tileCache.size - this.tileCacheLimit
    let removed = 0
    for (const [k, v] of this.tileCache) {
      this.gl.deleteTexture(v.texture)
      this.tileCache.delete(k)
      removed += 1
      if (removed >= toRemove) break
    }
  }

  private drawTiles(): { drewAny: boolean; complete: boolean } {
    if (!this.useTiling || !this.program)
      return { drewAny: false, complete: false }
    const { gl } = this
    const desiredLOD = this.currentLOD
    const lodScale = SIMPLE_LOD_LEVELS[desiredLOD]?.scale ?? 1
    const range = this.computeVisibleTileRange(lodScale, 0)
    if (!range) return { drewAny: false, complete: false }

    gl.useProgram(this.program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
    gl.enableVertexAttribArray(this.positionLocation)
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer)
    gl.enableVertexAttribArray(this.texCoordLocation)
    gl.vertexAttribPointer(this.texCoordLocation, 2, gl.FLOAT, false, 0, 0)

    let drew = 0
    let expected = 0
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        expected += 1
        const key = this.composeTileKey(desiredLOD, c, r)
        const entry = this.tileCache.get(key)
        if (!entry) continue
        // LRU touch
        this.touchTile(key)
        const {
          texture,
          width: tileLODWidth,
          height: tileLODHeight,
          x,
          y,
        } = entry

        // Convert LOD tile size/offset to original image pixels
        const tileImgW = tileLODWidth / lodScale
        const tileImgH = tileLODHeight / lodScale
        const tileImgX = (x * this.tileSize) / lodScale
        const tileImgY = (y * this.tileSize) / lodScale

        const { drawX, drawY } = this.computeDrawMetadata(this.scaleInternal)
        const dispX = drawX + tileImgX * this.scaleInternal
        const dispY = drawY + tileImgY * this.scaleInternal
        const dispW = tileImgW * this.scaleInternal
        const dispH = tileImgH * this.scaleInternal

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        const matrix = (() => {
          const projection = createProjectionMatrix(
            this.canvasWidth,
            this.canvasHeight,
          )
          const translation = createTranslationMatrix(dispX, dispY)
          const scale = createScaleMatrix(dispW, dispH)
          const combined = multiplyMatrix(projection, translation)
          return multiplyMatrix(combined, scale)
        })()
        gl.uniformMatrix3fv(this.matrixLocation, false, matrix)
        // Shrink UV to avoid sampling edges (seam reduction)
        const epsU = 0.5 / tileLODWidth
        const epsV = 0.5 / tileLODHeight
        gl.uniform4f(this.uvRectLocation, epsU, epsV, 1 - epsU, 1 - epsV)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        drew += 1
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.useProgram(null)
    // Progressive LOD: draw fallback LOD underneath if not complete
    if (drew !== expected) {
      const fallbackLOD = Math.max(0, desiredLOD - 1)
      if (fallbackLOD < desiredLOD) {
        this.drawTilesForLOD(fallbackLOD)
      }
    }

    return { drewAny: drew > 0, complete: drew === expected }
  }

  private drawTilesForLOD(lodLevel: number): void {
    const { gl } = this
    const lodScale = SIMPLE_LOD_LEVELS[lodLevel]?.scale ?? 1
    const range = this.computeVisibleTileRange(lodScale, 0)
    if (!range) return
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        const key = this.composeTileKey(lodLevel, c, r)
        const entry = this.tileCache.get(key)
        if (!entry) continue
        const {
          texture,
          width: tileLODWidth,
          height: tileLODHeight,
          x,
          y,
        } = entry
        const tileImgW = tileLODWidth / lodScale
        const tileImgH = tileLODHeight / lodScale
        const tileImgX = (x * this.tileSize) / lodScale
        const tileImgY = (y * this.tileSize) / lodScale
        const { drawX, drawY } = this.computeDrawMetadata(this.scaleInternal)
        const dispX = drawX + tileImgX * this.scaleInternal
        const dispY = drawY + tileImgY * this.scaleInternal
        const dispW = tileImgW * this.scaleInternal
        const dispH = tileImgH * this.scaleInternal
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        const matrix = (() => {
          const projection = createProjectionMatrix(
            this.canvasWidth,
            this.canvasHeight,
          )
          const translation = createTranslationMatrix(dispX, dispY)
          const scale = createScaleMatrix(dispW, dispH)
          const combined = multiplyMatrix(projection, translation)
          return multiplyMatrix(combined, scale)
        })()
        gl.uniformMatrix3fv(this.matrixLocation, false, matrix)
        const epsU = 0.5 / tileLODWidth
        const epsV = 0.5 / tileLODHeight
        gl.uniform4f(this.uvRectLocation, epsU, epsV, 1 - epsU, 1 - epsV)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
    }
  }

  private computeVisibleTileRange(
    lodScale: number,
    marginTiles = 0,
  ): {
    startCol: number
    endCol: number
    startRow: number
    endRow: number
  } | null {
    const scaledWidth = this.imageWidth * lodScale
    const scaledHeight = this.imageHeight * lodScale
    const cols = Math.max(1, Math.ceil(scaledWidth / this.tileSize))
    const rows = Math.max(1, Math.ceil(scaledHeight / this.tileSize))

    const {
      drawX,
      drawY,
      scaledWidth: drawW,
      scaledHeight: drawH,
    } = this.computeDrawMetadata(this.scaleInternal)
    const visX0 = Math.max(0, drawX)
    const visY0 = Math.max(0, drawY)
    const visX1 = Math.min(this.canvasWidth, drawX + drawW)
    const visY1 = Math.min(this.canvasHeight, drawY + drawH)
    const interW = Math.max(0, visX1 - visX0)
    const interH = Math.max(0, visY1 - visY0)
    if (interW === 0 || interH === 0) return null

    const imageX0 = (visX0 - drawX) / this.scaleInternal
    const imageY0 = (visY0 - drawY) / this.scaleInternal
    const imageW = interW / this.scaleInternal
    const imageH = interH / this.scaleInternal

    const lodX0 = imageX0 * lodScale
    const lodY0 = imageY0 * lodScale
    const lodX1 = (imageX0 + imageW) * lodScale
    const lodY1 = (imageY0 + imageH) * lodScale

    let startCol = Math.max(0, Math.floor(lodX0 / this.tileSize))
    let endCol = Math.min(cols - 1, Math.floor((lodX1 - 1) / this.tileSize))
    let startRow = Math.max(0, Math.floor(lodY0 / this.tileSize))
    let endRow = Math.min(rows - 1, Math.floor((lodY1 - 1) / this.tileSize))
    if (marginTiles > 0) {
      startCol = Math.max(0, startCol - marginTiles)
      endCol = Math.min(cols - 1, endCol + marginTiles)
      startRow = Math.max(0, startRow - marginTiles)
      endRow = Math.min(rows - 1, endRow + marginTiles)
    }
    return { startCol, endCol, startRow, endRow }
  }

  private getDesiredLOD(): number {
    // Choose the smallest LOD whose scale >= current zoom scale
    const s = this.scaleInternal
    for (let i = 0; i < this.totalLODLevels; i++) {
      if (SIMPLE_LOD_LEVELS[i].scale >= s) return i
    }
    return this.totalLODLevels - 1
  }

  private touchTile(key: string): void {
    const v = this.tileCache.get(key)
    if (!v) return
    // Reinsert to mark as most-recently-used
    this.tileCache.delete(key)
    this.tileCache.set(key, v)
  }

  private cancelAnimationFrame(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    const currentAnimation = this.zoomAnimation
    if (typeof currentAnimation?.rafId === 'number') {
      cancelAnimationFrame(currentAnimation.rafId)
    }
    this.zoomAnimation = null
    this.renderScheduled = false
  }
}
