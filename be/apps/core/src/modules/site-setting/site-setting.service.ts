import { injectable } from 'tsyringe'

import type { SettingEntryInput } from '../setting/setting.service'
import { SettingService } from '../setting/setting.service'
import type { UiNode } from '../ui-schema/ui-schema.type'
import type { SiteSettingEntryInput, SiteSettingKey, SiteSettingUiSchemaResponse } from './site-setting.type'
import { ONBOARDING_SITE_SETTING_KEYS, SITE_SETTING_KEYS } from './site-setting.type'
import { SITE_SETTING_UI_SCHEMA, SITE_SETTING_UI_SCHEMA_KEYS } from './site-setting.ui-schema'

@injectable()
export class SiteSettingService {
  constructor(private readonly settingService: SettingService) {}

  async getUiSchema(): Promise<SiteSettingUiSchemaResponse> {
    const values = await this.settingService.getMany(SITE_SETTING_UI_SCHEMA_KEYS, {})
    const typedValues: SiteSettingUiSchemaResponse['values'] = {}

    for (const key of SITE_SETTING_KEYS) {
      typedValues[key] = values[key] ?? null
    }

    return {
      schema: SITE_SETTING_UI_SCHEMA,
      values: typedValues,
    }
  }

  async getOnboardingUiSchema(): Promise<SiteSettingUiSchemaResponse> {
    const allowedKeys = new Set<SiteSettingKey>(ONBOARDING_SITE_SETTING_KEYS)
    const schema = this.filterSchema(SITE_SETTING_UI_SCHEMA, allowedKeys)

    return {
      schema,
      values: {},
    }
  }

  async setMany(entries: readonly SiteSettingEntryInput[]): Promise<void> {
    if (entries.length === 0) {
      return
    }

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      value: typeof entry.value === 'string' ? entry.value : String(entry.value),
    })) as readonly SettingEntryInput[]

    await this.settingService.setMany(normalizedEntries)
  }

  async get(key: SiteSettingKey) {
    return await this.settingService.get(key, {})
  }

  private filterSchema(
    schema: SiteSettingUiSchemaResponse['schema'],
    allowed: Set<SiteSettingKey>,
  ): SiteSettingUiSchemaResponse['schema'] {
    const filterNodes = (nodes: ReadonlyArray<UiNode<SiteSettingKey>>): Array<UiNode<SiteSettingKey>> => {
      const filtered: Array<UiNode<SiteSettingKey>> = []

      for (const node of nodes) {
        if (node.type === 'field') {
          if (allowed.has(node.key)) {
            filtered.push(node)
          }
          continue
        }

        const filteredChildren = filterNodes(node.children)
        if (filteredChildren.length === 0) {
          continue
        }

        filtered.push({ ...node, children: filteredChildren })
      }

      return filtered
    }

    return {
      ...schema,
      sections: filterNodes(schema.sections) as SiteSettingUiSchemaResponse['schema']['sections'],
    }
  }
}
