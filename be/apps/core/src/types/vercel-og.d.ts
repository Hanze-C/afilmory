declare module '@vercel/og' {
  import type { ReactElement } from 'react'

  export type EmojiStyle = 'twemoji' | 'apple' | 'blobmoji' | 'noto'

  export interface FontConfig {
    name: string
    data: ArrayBuffer
    weight?: number
    style?: 'normal' | 'italic'
  }

  export interface ImageResponseOptions {
    width?: number
    height?: number
    emoji?: EmojiStyle
    fonts?: FontConfig[]
    headers?: Record<string, string>
    debug?: boolean
  }

  export class ImageResponse extends Response {
    constructor(element: ReactElement, options?: ImageResponseOptions)
  }
}
