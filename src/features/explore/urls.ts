import { paths } from '@/app/paths'
import type { ExploreTab } from './types'

export const exploreTabUrl = (tab: ExploreTab) => (tab === 'suggested' ? paths.explore : `${paths.explore}?tab=${tab}`)
