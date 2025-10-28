import type { UiNode, UiSchema } from '../ui-schema/ui-schema.type'
import type { SuperAdminSettingField } from './super-admin-setting.constants'

export const SUPER_ADMIN_SETTING_UI_SCHEMA_VERSION = '1.0.0'

export const SUPER_ADMIN_SETTING_UI_SCHEMA: UiSchema<SuperAdminSettingField> = {
  version: SUPER_ADMIN_SETTING_UI_SCHEMA_VERSION,
  title: '超级管理员设置',
  description: '管理整个平台的注册入口和本地登录策略。',
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
            trueLabel: '允许',
            falseLabel: '禁止',
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
            trueLabel: '启用',
            falseLabel: '禁用',
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
  ],
}

function collectKeys(nodes: ReadonlyArray<UiNode<SuperAdminSettingField>>): SuperAdminSettingField[] {
  const keys: SuperAdminSettingField[] = []

  for (const node of nodes) {
    if (node.type === 'field') {
      keys.push(node.key)
      continue
    }

    keys.push(...collectKeys(node.children))
  }

  return keys
}

export const SUPER_ADMIN_SETTING_UI_SCHEMA_KEYS = Array.from(
  new Set(collectKeys(SUPER_ADMIN_SETTING_UI_SCHEMA.sections)),
) as SuperAdminSettingField[]
