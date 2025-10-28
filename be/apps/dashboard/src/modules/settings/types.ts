import type { UiSchema } from '../schema-form/types'

export type {
  UiFieldComponentDefinition,
  UiFieldComponentType,
  UiFieldNode,
  UiGroupNode,
  UiNode,
  UiSecretInputComponent,
  UiSectionNode,
  UiSelectComponent,
  UiSlotComponent,
  UiTextareaComponent,
  UiTextInputComponent,
} from '../schema-form/types'

export interface SettingUiSchemaResponse<Key extends string = string> {
  readonly schema: UiSchema<Key>
  readonly values: Partial<Record<Key, string | null>>
}

export type SettingValueState<Key extends string = string> = Record<Key, string>

export type SettingEntryInput<Key extends string = string> = {
  readonly key: Key
  readonly value: string
}
