import decodeAvif from '@jsquash/avif/decode.js'

export async function decodeAvifToImageData(
  buffer: ArrayBuffer,
): Promise<ImageData> {
  const result = await decodeAvif(buffer, { bitDepth: 8 })

  if (!result) {
    throw new Error('AVIF 解码失败：返回结果为空')
  }

  const pixels = toUint8ClampedArray(result.data)
  return new ImageData(
    pixels as unknown as ImageDataArray,
    result.width,
    result.height,
  )
}

export function isAvifSource(src: string): boolean {
  return /\.avif(?:$|[?#])/i.test(src)
}

function toUint8ClampedArray(
  source: ImageData['data'] | Uint8Array,
): Uint8ClampedArray {
  if (source instanceof Uint8ClampedArray) {
    return source
  }

  return new Uint8ClampedArray(
    source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength,
    ),
  )
}
