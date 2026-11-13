import { getRoleLabel } from '@/features/auth/user'
import type { ListSuggestedUsersResponse } from '@/lib/api'

export type SuggestedPerson = ListSuggestedUsersResponse['data'][number]

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/** Why someone was suggested, strongest reason first: "2 shared interests · Also a Researcher". */
export function similarityReason({ similarity, memberRole }: SuggestedPerson) {
  const role = getRoleLabel({ role: memberRole ?? undefined })
  const reasons = [
    similarity.sharedInterests > 0 && plural(similarity.sharedInterests, 'shared interest'),
    similarity.mutualFollows > 0 && `Followed by ${plural(similarity.mutualFollows, 'person', 'people')} you follow`,
    similarity.sameRole && `Also ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`,
    similarity.sharedForums > 0 && plural(similarity.sharedForums, 'forum') + ' in common',
    similarity.sameCountry && 'Same country as you',
  ].filter((reason): reason is string => Boolean(reason))
  return reasons.slice(0, 2).join(' · ') || 'Popular on CommUniti'
}
