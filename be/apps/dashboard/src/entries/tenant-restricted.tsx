import '../styles/index.css'

import { createRoot } from 'react-dom/client'

import { TenantRestrictedStandalone } from '../modules/welcome/components/TenantRestrictedStandalone'

const root = document.querySelector('#root')

if (!root) {
  throw new Error('Root element not found for tenant restricted entry.')
}

createRoot(root).render(<TenantRestrictedStandalone />)
