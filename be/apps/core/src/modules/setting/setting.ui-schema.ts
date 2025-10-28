import type { UiNode } from '../ui-schema/ui-schema.type'
import { DEFAULT_SETTING_METADATA } from './setting.constant'
import type { SettingKeyType, SettingUiSchema } from './setting.type'

function getIsSensitive(key: SettingKeyType): boolean {
  return DEFAULT_SETTING_METADATA[key]?.isSensitive ?? false
}

export const SETTING_UI_SCHEMA_VERSION = '1.1.0'

export const SETTING_UI_SCHEMA: SettingUiSchema = {
  version: SETTING_UI_SCHEMA_VERSION,
  title: '系统设置',
  description: '管理 AFilmory 系统的全局行为与第三方服务接入。',
  sections: [
    {
      type: 'section',
      id: 'auth',
      title: '登录与认证',
      description: '配置第三方 OAuth 登录用于后台访问控制。',
      icon: 'shield-check',
      children: [
        {
          type: 'group',
          id: 'auth-google',
          title: 'Google OAuth',
          description: '在 Google Cloud Console 中创建 OAuth 应用后填写以下信息。',
          icon: 'badge-check',
          children: [
            {
              type: 'field',
              id: 'auth.google.clientId',
              title: 'Client ID',
              description: 'Google OAuth 的客户端 ID。',
              key: 'auth.google.clientId',
              helperText: '通常以 .apps.googleusercontent.com 结尾。',
              isSensitive: getIsSensitive('auth.google.clientId'),
              component: {
                type: 'text',
                placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
                autoComplete: 'off',
              },
            },
            {
              type: 'field',
              id: 'auth.google.clientSecret',
              title: 'Client Secret',
              description: 'Google OAuth 的客户端密钥。',
              key: 'auth.google.clientSecret',
              isSensitive: getIsSensitive('auth.google.clientSecret'),
              component: {
                type: 'secret',
                placeholder: '************',
                autoComplete: 'off',
                revealable: true,
              },
            },
          ],
        },
        {
          type: 'group',
          id: 'auth-github',
          title: 'GitHub OAuth',
          description: '在 GitHub OAuth Apps 中创建应用后填写。',
          icon: 'github',
          children: [
            {
              type: 'field',
              id: 'auth.github.clientId',
              title: 'Client ID',
              description: 'GitHub OAuth 的客户端 ID。',
              key: 'auth.github.clientId',
              helperText: '在 GitHub Developer settings 中可以找到。',
              isSensitive: getIsSensitive('auth.github.clientId'),
              component: {
                type: 'text',
                placeholder: 'Iv1.xxxxxxxxxxxxxxxx',
                autoComplete: 'off',
              },
            },
            {
              type: 'field',
              id: 'auth.github.clientSecret',
              title: 'Client Secret',
              description: 'GitHub OAuth 的客户端密钥。',
              key: 'auth.github.clientSecret',
              isSensitive: getIsSensitive('auth.github.clientSecret'),
              component: {
                type: 'secret',
                placeholder: '****************',
                autoComplete: 'off',
                revealable: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'section',
      id: 'http',
      title: 'HTTP 与安全',
      description: '控制跨域访问等 Web 层配置。',
      icon: 'globe-2',
      children: [
        {
          type: 'group',
          id: 'http-cors',
          title: '跨域策略 (CORS)',
          description: '配置允许访问后台接口的来源列表。',
          icon: 'shield-alert',
          children: [
            {
              type: 'field',
              id: 'http.cors.allowedOrigins',
              title: '允许的域名列表',
              description: '以逗号分隔的域名或通配符，必须至少填写一个。',
              helperText: '例如 https://example.com, https://admin.example.com',
              key: 'http.cors.allowedOrigins',
              isSensitive: getIsSensitive('http.cors.allowedOrigins'),
              component: {
                type: 'textarea',
                placeholder: 'https://example.com, https://admin.example.com',
                minRows: 3,
                maxRows: 6,
              },
            },
          ],
        },
      ],
    },
  ],
} satisfies SettingUiSchema

function collectKeys(nodes: ReadonlyArray<UiNode<SettingKeyType>>): SettingKeyType[] {
  const keys: SettingKeyType[] = []

  for (const node of nodes) {
    if (node.type === 'field') {
      keys.push(node.key)
      continue
    }

    keys.push(...collectKeys(node.children))
  }

  return keys
}

export const SETTING_UI_SCHEMA_KEYS = Array.from(new Set(collectKeys(SETTING_UI_SCHEMA.sections))) as SettingKeyType[]
