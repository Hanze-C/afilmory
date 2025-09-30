import decodeAvif from '@jsquash/avif/decode.js'
import sharp from 'sharp'

import { logger } from '../logger/index.js'

type PixelChannels = 1 | 2 | 3 | 4

interface RawAvifImage {
  width: number
  height: number
  data: Uint8Array
  channels: PixelChannels
}

type DecodeAvif = typeof decodeAvif

let cachedDecoder: DecodeAvif | null = null

export async function decodeAvifToRaw(buffer: Buffer): Promise<RawAvifImage> {
  const decoder = await resolveDecoder()
  const segment = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer

  const result = await decoder(segment, { bitDepth: 8 })
  if (!result) {
    throw new Error('AVIF 解码失败：返回结果为空')
  }

  const pixelArray = toUint8Array(result.data)
  const channels = inferChannelCount(
    pixelArray.length,
    result.width,
    result.height,
  )

  return {
    width: result.width,
    height: result.height,
    data: pixelArray,
    channels,
  }
}

export async function convertAvifToJpeg(
  buffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  logger.image.info(
    `开始 AVIF → JPEG 转换 (${Math.round(buffer.byteLength / 1024)}KB)`,
  )

  const startedAt = Date.now()
  const decoded = await decodeAvifToRaw(buffer)

  const jpegBuffer = await sharp(decoded.data, {
    raw: {
      width: decoded.width,
      height: decoded.height,
      channels: decoded.channels,
    },
  })
    .jpeg({ quality: 95 })
    .toBuffer()

  logger.image.success(`AVIF 转换完成 (${Date.now() - startedAt}ms)`)

  return {
    buffer: jpegBuffer,
    width: decoded.width,
    height: decoded.height,
  }
}

async function resolveDecoder(): Promise<DecodeAvif> {
  if (cachedDecoder) {
    return cachedDecoder
  }

  cachedDecoder = decodeAvif
  return cachedDecoder
}

function toUint8Array(source: ImageData['data'] | Uint8Array): Uint8Array {
  if (source instanceof Uint8Array) {
    return source
  }

  return new Uint8Array(
    source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength,
    ),
  )
}

function inferChannelCount(
  byteLength: number,
  width: number,
  height: number,
): PixelChannels {
  const pixels = width * height
  if (pixels <= 0) {
    throw new Error('AVIF 解码结果尺寸无效')
  }

  const estimate = byteLength / pixels
  if (!Number.isFinite(estimate) || estimate <= 0) {
    return 4
  }

  const clamped = Math.min(4, Math.max(1, Math.round(estimate)))
  return clamped as PixelChannels
}
