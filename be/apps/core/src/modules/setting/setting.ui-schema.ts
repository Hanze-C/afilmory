import type { UiNode } from '../ui-schema/ui-schema.type'
import { DEFAULT_SETTING_METADATA } from './setting.constant'
import type { SettingKeyType, SettingUiSchema } from './setting.type'

function getIsSensitive(key: SettingKeyType): boolean {
  return DEFAULT_SETTING_METADATA[key]?.isSensitive ?? false
}

export const SETTING_UI_SCHEMA_VERSION = '1.2.0'

export const SETTING_UI_SCHEMA: SettingUiSchema = {
  version: SETTING_UI_SCHEMA_VERSION,
  title: '系统设置',
  description: '管理 Memora 平台的全局行为与第三方服务接入。',
  sections: [
    {
      type: 'section',
      id: 'ai',
      title: 'AI 与智能功能',
      description: '配置 OpenAI 以及嵌入式模型以启用智能特性。',
      icon: 'i-lucide-brain-circuit',
      children: [
        {
          type: 'group',
          id: 'ai-openai',
          title: 'OpenAI 接入',
          description: '为 API 请求配置服务端所需的 OpenAI 凭据。',
          icon: 'i-lucide-bot',
          children: [
            {
              type: 'field',
              id: 'ai.openai.apiKey',
              title: 'API Key',
              description: '用于调用 OpenAI 接口的密钥，通常以 “sk-” 开头。',
              helperText: '出于安全考虑仅在受信环境中填写，提交后会进行加密存储。',
              key: 'ai.openai.apiKey',
              isSensitive: getIsSensitive('ai.openai.apiKey'),
              component: {
                type: 'secret',
                placeholder: 'sk-********************************',
                autoComplete: 'off',
                revealable: true,
              },
            },
            {
              type: 'field',
              id: 'ai.openai.baseUrl',
              title: '自定义 Base URL',
              description: '可选，若你使用自建代理，填写代理的完整 URL。',
              key: 'ai.openai.baseUrl',
              helperText: '例如 https://api.openai.com/v1，末尾无需斜杠。',
              isSensitive: getIsSensitive('ai.openai.baseUrl'),
              component: {
                type: 'text',
                inputType: 'url',
                placeholder: 'https://api.openai.com/v1',
                autoComplete: 'off',
              },
            },
          ],
        },
        {
          type: 'group',
          id: 'ai-embedding',
          title: '向量嵌入模型',
          description: '用于语义搜索或文本向量化的模型。',
          icon: 'i-lucide-fingerprint',
          children: [
            {
              type: 'field',
              id: 'ai.embedding.model',
              title: 'Embedding 模型标识',
              description: '例如 text-embedding-3-large、text-embedding-3-small 等。',
              key: 'ai.embedding.model',
              helperText: '填写完整的模型名称，留空将导致相关功能不可用。',
              isSensitive: getIsSensitive('ai.embedding.model'),
              component: {
                type: 'text',
                placeholder: 'text-embedding-3-large',
                autoComplete: 'off',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'section',
      id: 'auth',
      title: '登录与认证',
      description: '配置第三方 OAuth 登录用于后台访问控制。',
      icon: 'i-lucide-shield-check',
      children: [
        {
          type: 'group',
          id: 'auth-google',
          title: 'Google OAuth',
          description: '在 Google Cloud Console 中创建 OAuth 应用后填写以下信息。',
          icon: 'i-lucide-badge-check',
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
          icon: 'i-lucide-github',
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
      icon: 'i-lucide-globe-2',
      children: [
        {
          type: 'group',
          id: 'http-cors',
          title: '跨域策略 (CORS)',
          description: '配置允许访问后台接口的来源列表。',
          icon: 'i-lucide-shield-alert',
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
    {
      type: 'section',
      id: 'services',
      title: '地图与定位',
      description: '配置地图底图与地理编码等服务。',
      icon: 'i-lucide-map',
      children: [
        {
          type: 'group',
          id: 'services-amap',
          title: '高德地图接入',
          description: '填写高德地图 Web 服务 Key 以启用后台地图选点与地理搜索能力。',
          icon: 'i-lucide-map-pinned',
          children: [
            {
              type: 'field',
              id: 'services.amap.apiKey',
              title: '高德地图 Key',
              description: '前往高德开发者控制台创建 Web 服务 Key，并授权所需的 IP/域名后填入。',
              helperText: '提交后将加密存储，仅后台调用地图与地理编码接口。',
              key: 'services.amap.apiKey',
              isSensitive: getIsSensitive('services.amap.apiKey'),
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
