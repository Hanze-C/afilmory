import { Navigate, useParams } from 'react-router'

import type { PhotoPageTab } from '~/modules/photos'
import { PhotoPage } from '~/modules/photos'

const isValidTab = (value: string | undefined): value is PhotoPageTab =>
  value === 'sync' || value === 'library' || value === 'storage'

export function Component() {
  const { tab } = useParams<{ tab?: string }>()

  if (!isValidTab(tab)) {
    return <Navigate to="/photos/sync" replace />
  }

  return <PhotoPage />
}
