import { redirect } from 'react-router'

import type { PhotoPageTab } from '~/modules/photos'

const DEFAULT_TAB: PhotoPageTab = 'library'

export function Component() {
  return null
}

export const loader = () => {
  return redirect(`/photos/${DEFAULT_TAB}`)
}
