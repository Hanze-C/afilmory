'use client'

import Link from 'next/link'

import { blur } from '~/lib/design-tokens'
import { clsxm } from '~/lib/helper'

const footerLinks = {
  product: [
    { label: '在线示例', href: 'https://afilmory.innei.in' },
    {
      label: '使用文档',
      href: 'https://github.com/Afilmory/photo-gallery-site#readme',
    },
    { label: 'GitHub', href: 'https://github.com/Afilmory/photo-gallery-site' },
  ],
  community: [
    {
      label: '讨论区',
      href: 'https://github.com/Afilmory/photo-gallery-site/discussions',
    },
    {
      label: '问题反馈',
      href: 'https://github.com/Afilmory/photo-gallery-site/issues',
    },
    {
      label: '贡献指南',
      href: 'https://github.com/Afilmory/photo-gallery-site/blob/main/CONTRIBUTING.md',
    },
  ],
  resources: [
    {
      label: '快速开始',
      href: 'https://github.com/Afilmory/photo-gallery-site#-quick-start',
    },
    {
      label: '配置说明',
      href: 'https://github.com/Afilmory/photo-gallery-site#-configuration',
    },
    {
      label: '部署教程',
      href: 'https://github.com/Afilmory/photo-gallery-site#-deployment',
    },
  ],
}

const socialLinks = [
  {
    icon: 'i-lucide-github',
    label: 'GitHub',
    href: 'https://github.com/Afilmory/photo-gallery-site',
  },
  { icon: 'i-lucide-twitter', label: 'Twitter', href: 'https://twitter.com' },
  { icon: 'i-lucide-message-circle', label: 'Discord', href: '#' },
]

export const Footer = () => {
  return (
    <footer className={clsxm('border-t border-white/10 bg-white/40', blur.lg)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-0">
        {/* Main Footer */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-900">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-purple-500 text-white">
                <i className="i-lucide-camera size-5" />
              </span>
              <span>Afilmory</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              为摄影师打造的专业作品展示平台，让每一张照片都值得被看见。
            </p>
            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg border border-white/20 bg-white/40 text-gray-600 transition hover:bg-white/60 hover:text-gray-900"
                  aria-label={social.label}
                >
                  <i className={clsxm(social.icon, 'size-4')} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8 lg:col-span-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">产品</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600 transition hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">社区</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.community.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600 transition hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">资源</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-600 transition hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-600 sm:flex-row">
          <p>© 2025 Afilmory. 完全开源，永久免费。</p>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/Afilmory/photo-gallery-site/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-gray-900"
            >
              MIT License
            </Link>
            <Link
              href="https://github.com/Afilmory/photo-gallery-site#-features"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-gray-900"
            >
              版本 v1.0
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
