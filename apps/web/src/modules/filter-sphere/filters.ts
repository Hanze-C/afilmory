import type { FnSchema } from '@fn-sphere/filter'
import { presetFilter } from '@fn-sphere/filter'

export const photoFilters: FnSchema[] = presetFilter.map((i) => {
  i.skipValidate = true
  return i
})
