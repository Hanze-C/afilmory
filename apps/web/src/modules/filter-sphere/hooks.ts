import type { PhotoManifestItem } from '@afilmory/builder'
import { photoLoader } from '@afilmory/data'
import { useFilterSphere } from '@fn-sphere/filter'
import { atom, useAtomValue } from 'jotai'
import { useMemo } from 'react'

import { jotaiStore } from '~/lib/jotai'

import { photoFilters } from './filters'
import { photoManifestItemSchema } from './schema'

/**
 * Hook for using filter sphere with photos
 * Provides a predicate function and context for filtering photos
 */
export const usePhotoFilterSphere = () => {
  const { filterRule, predicate, context } = useFilterSphere({
    fieldDeepLimit: Infinity,
    schema: photoManifestItemSchema,
    filterFnList: photoFilters,
    onRuleChange: ({ predicate }) => {
      jotaiStore.set(photoFilterPredicateAtom, { predicate: predicate as (photo: PhotoManifestItem) => boolean })
    },
  })

  // Wrap the predicate to work with PhotoManifestItem type
  const typedPredicate = useMemo(() => {
    return (photo: PhotoManifestItem) => predicate(photo as any)
  }, [predicate])

  return {
    filterRule,
    predicate: typedPredicate,
    context,
  }
}

// Atom to store the predicate function
const photoFilterPredicateAtom = atom<{ predicate: (photo: PhotoManifestItem) => boolean }>({ predicate: () => true })

const data = photoLoader.getPhotos()

/**
 * Get filtered photos using the current predicate from Jotai store
 * This function can be used outside of React components
 */
export const getAdvancedFilterPhotos = () => {
  // 直接从 jotaiStore 中读取当前状态
  const { predicate } = jotaiStore.get(photoFilterPredicateAtom)
  return data.filter(predicate)
}

export const useAdvancedFilterPhotos = () => {
  const { predicate } = useAtomValue(photoFilterPredicateAtom)
  const masonryItems = useMemo(() => {
    return data.filter(predicate)
  }, [predicate])

  return masonryItems
}
