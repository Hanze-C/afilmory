import { FilterBuilder, FilterSphereProvider } from '@fn-sphere/filter'

import { usePhotoFilterSphere } from './hooks'
import { filterSphereTheme } from './theme'

interface AdvancedPhotoFilterProps {
  className?: string
}

/**
 * Advanced photo filter component using Filter Sphere
 * Provides a rich UI for building complex photo filter queries
 */
export const AdvancedPhotoFilter = ({ className }: AdvancedPhotoFilterProps) => {
  return (
    <div className={className}>
      <FilterBuilder />
    </div>
  )
}

export const AdvancedFilterProvider = ({ children }: { children: React.ReactNode }) => {
  const { context } = usePhotoFilterSphere()
  return (
    <FilterSphereProvider context={context} theme={filterSphereTheme}>
      {children}
    </FilterSphereProvider>
  )
}
