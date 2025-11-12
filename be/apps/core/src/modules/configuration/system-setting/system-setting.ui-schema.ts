import type { UiNode, UiSchema } from 'core/modules/ui/ui-schema/ui-schema.type'

import type { SystemSettingField } from './system-setting.constants'

export const SYSTEM_SETTING_UI_SCHEMA_VERSION = '1.3.0'

export const SYSTEM_SETTING_UI_SCHEMA: UiSchema<SystemSettingField> = {
  version: SYSTEM_SETTING_UI_SCHEMA_VERSION,
  title: '系统设置',
  description: '管理整个平台的注册入口、登录策略与第三方 OAuth 配置。',
  sections: [
    {
      type: 'section',
      id: 'registration-control',
      title: '全局注册策略',
      description: '控制新用户注册配额以及本地账号登录能力。',
      icon: 'user-cog',
      children: [
        {
          type: 'field',
          id: 'registration-allow',
          title: '允许新用户注册',
          description: '关闭后仅超级管理员可以手动添加新账号。',
          key: 'allowRegistration',
          component: {
            type: 'switch',
          },
        },
        {
          type: 'field',
          id: 'local-provider-enabled',
          title: '启用本地登录（邮箱 / 密码）',
          description: '关闭后普通用户只能使用第三方登录渠道。',
          key: 'localProviderEnabled',
          component: {
            type: 'switch',
          },
        },
        {
          type: 'field',
          id: 'platform-base-domain',
          title: '平台基础域名',
          description: '用于解析子域名租户，如 example.{{value}}。更新后请确保证书和 DNS 已正确配置。',
          helperText: '留空使用默认域名 afilmory.art。',
          key: 'baseDomain',
          component: {
            type: 'text',
            placeholder: 'afilmory.art',
          },
        },
        {
          type: 'field',
          id: 'registration-max-users',
          title: '全局可注册用户上限',
          description: '达到上限后将阻止新的注册，留空表示不限制用户数量。',
          helperText: '设置为 0 时将立即阻止新的用户注册。',
          key: 'maxRegistrableUsers',
          component: {
            type: 'text',
            inputType: 'number',
            placeholder: '无限制',
          },
        },
      ],
    },
    {
      type: 'section',
      id: 'oauth-providers',
      title: 'OAuth 登录渠道',
      description: '统一配置所有租户可用的第三方登录渠道。',
      icon: 'shield-check',
      children: [
        {
          type: 'field',
          id: 'oauth-gateway-url',
          title: 'OAuth 网关地址',
          description: '所有第三方登录统一走该回调入口（例如 https://auth.afilmory.art）。留空则回退到租户域名。',
          helperText: '必须包含 http/https 协议，结尾无需斜杠。',
          key: 'oauthGatewayUrl',
          component: {
            type: 'text',
            placeholder: 'https://auth.afilmory.art',
          },
        },
        {
          type: 'group',
          id: 'oauth-google',
          title: 'Google OAuth',
          description: '在 Google Cloud Console 中创建 OAuth 应用后填入以下信息。',
          icon: 'badge-check',
          children: [
            {
              type: 'field',
              id: 'oauth-google-client-id',
              title: 'Client ID',
              description: 'Google OAuth 的客户端 ID。',
              key: 'oauthGoogleClientId',
              component: {
                type: 'text',
                placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
              },
            },
            {
              type: 'field',
              id: 'oauth-google-client-secret',
              title: 'Client Secret',
              description: 'Google OAuth 的客户端密钥。',
              key: 'oauthGoogleClientSecret',
              component: {
                type: 'secret',
                placeholder: '************',
                revealable: true,
                autoComplete: 'off',
              },
            },
          ],
        },
        {
          type: 'group',
          id: 'oauth-github',
          title: 'GitHub OAuth',
          description: 'GitHub Developer settings 中创建 OAuth App 后填入以下信息。',
          icon: 'github',
          children: [
            {
              type: 'field',
              id: 'oauth-github-client-id',
              title: 'Client ID',
              description: 'GitHub OAuth 的客户端 ID。',
              key: 'oauthGithubClientId',
              component: {
                type: 'text',
                placeholder: 'Iv1.xxxxxxxxxxxxxxxx',
              },
            },
            {
              type: 'field',
              id: 'oauth-github-client-secret',
              title: 'Client Secret',
              description: 'GitHub OAuth 的客户端密钥。',
              key: 'oauthGithubClientSecret',
              component: {
                type: 'secret',
                placeholder: '****************',
                revealable: true,
                autoComplete: 'off',
              },
            },
          ],
        },
      ],
    },
  ],
}

function collectKeys(nodes: ReadonlyArray<UiNode<SystemSettingField>>): SystemSettingField[] {
  const keys: SystemSettingField[] = []

  for (const node of nodes) {
    if (node.type === 'field') {
      keys.push(node.key)
      continue
    }

    keys.push(...collectKeys(node.children))
  }

  return keys
}

export const SYSTEM_SETTING_UI_SCHEMA_KEYS = Array.from(
  new Set(collectKeys(SYSTEM_SETTING_UI_SCHEMA.sections)),
) as SystemSettingField[]
