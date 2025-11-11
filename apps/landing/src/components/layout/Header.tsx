'use client'

import { m } from 'motion/react'
import Link from 'next/link'

import { Button } from '~/components/ui/button/Button'
import { blur } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

export const Header = () => {
  return (
    <m.header
      className={clsxm(
        'fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/60',
        blur.lg,
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-0">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-semibold text-gray-900 transition hover:text-gray-700"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-purple-500 text-white">
            <i className="i-lucide-camera size-5" />
          </span>
          <span className="hidden sm:inline">Afilmory</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            功能特色
          </Link>
          <Link
            href="#showcase"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            在线示例
          </Link>
          <Link
            href="https://github.com/Afilmory/photo-gallery-site"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            GitHub
          </Link>
        </nav>

        {/* CTA Button */}
        <Button
          asChild
          size="sm"
          className="to-accent text-background bg-gradient-to-r from-sky-400"
        >
          <Link
            href="https://afilmory.innei.in"
            target="_blank"
            rel="noreferrer"
          >
            <span className="hidden sm:inline">立即体验</span>
            <span className="sm:hidden">体验</span>
          </Link>
        </Button>
      </div>
    </m.header>
  )
}
