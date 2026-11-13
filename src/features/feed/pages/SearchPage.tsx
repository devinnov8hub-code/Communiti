import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { Avatar, EmptyState, SearchField, Spinner, Tabs, VerifyTick, type TabItem } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { EventCard } from '@/features/explore/components/EventCard'
import { HighlightsMosaic } from '@/features/explore/components/HighlightsMosaic'
import { toExploreEvent, toHighlight } from '@/features/explore/mappers'
import { useProfilePath } from '@/features/profile/profilePath'
import type { SearchResponse } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { formatCount } from '@/lib/format'
import { PostList } from '../components/PostList'
import { RightRail } from '../components/RightRail'
import { MIN_SEARCH_LENGTH, useSearchPosts, useSearchResults, useSearchTopics } from '../hooks/queries'
import { searchUrl } from '../searchUrl'
import type { SearchScope } from '../types'

/** Search results (Figma "Search fryer"). */
export function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') ?? ''
  const topicId = params.get('topic') ?? undefined
  const topics = useSearchTopics()
  const topic = topics.data?.find((item) => item.id === topicId)

  const [draft, setDraft] = useState(query)
  const [scope, setScope] = useState<SearchScope>('posts')
  const results = useSearchPosts(query, topicId)
  const people = useSearchResults(query, 'people', scope === 'people')
  const events = useSearchResults(query, 'events', scope === 'events')
  const highlights = useSearchResults(query, 'highlights', scope === 'highlights')

  // Keep the input in sync when the URL changes (e.g. browser back).
  const [lastQuery, setLastQuery] = useState(query)
  if (query !== lastQuery) {
    setLastQuery(query)
    setDraft(query)
  }

  const tabs: TabItem<SearchScope>[] = [
    { value: 'posts', label: 'Posts' },
    { value: 'people', label: 'People' },
    { value: 'events', label: 'Events' },
    { value: 'highlights', label: 'Highlights' },
    ...(topic ? [{ value: 'topic' as const, label: topic.name }] : []),
  ]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    navigate(searchUrl(draft, topicId))
  }

  const subject = [query && `“${query}”`, topic?.name].filter(Boolean).join(' in ')

  return (
    <PageColumns aside={<RightRail />}>
      <header className="sticky top-14 z-10 flex flex-col gap-gap-md border-b border-hairline bg-background px-4 pt-2.5 sm:px-5 md:top-0">
        <form role="search" onSubmit={submit}>
          <SearchField value={draft} onChange={(event) => setDraft(event.target.value)} className="[&_input]:text-fg" />
        </form>
        <p className="text-body-s font-semibold text-fg">Search in:</p>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Tabs
            label="Search in"
            accent="green"
            items={tabs}
            value={scope}
            onChange={setScope}
            className="min-w-[480px]"
          />
        </div>
      </header>

      <div className="sm:p-2.5">
        {query.length < MIN_SEARCH_LENGTH ? (
          <EmptyState
            title="Search CommUniti"
            description={
              query || topic
                ? `Type at least ${MIN_SEARCH_LENGTH} characters to search${topic ? ` in ${topic.name}` : ''}.`
                : 'Find posts, people, events and topics.'
            }
          />
        ) : scope === 'posts' || scope === 'topic' ? (
          <PostList
            variant="detail"
            posts={results.data}
            isPending={results.isPending}
            error={results.error}
            onRetry={() => results.refetch()}
            empty={{ title: 'No results', description: `We couldn’t find any posts for ${subject}.` }}
          />
        ) : scope === 'people' ? (
          <Results query={people} subject={subject} kind="people">
            {(items) => <PeopleResults people={items} />}
          </Results>
        ) : scope === 'events' ? (
          <Results query={events} subject={subject} kind="events">
            {(items) => (
              <ul className="grid grid-cols-1 gap-3 px-4 py-2.5 sm:grid-cols-2 sm:px-0">
                {items.map((event) => (
                  <li key={event.id}>
                    <EventCard event={toExploreEvent(event)} />
                  </li>
                ))}
              </ul>
            )}
          </Results>
        ) : (
          <Results query={highlights} subject={subject} kind="highlights">
            {(items) => (
              <div className="px-4 py-2.5 sm:px-0">
                <HighlightsMosaic highlights={items.map(toHighlight).filter((item) => item.imageUrl)} />
              </div>
            )}
          </Results>
        )}
      </div>
    </PageColumns>
  )
}

/** Loading, error and empty states shared by the People / Events / Highlights tabs. */
function Results<T>({
  query,
  subject,
  kind,
  children,
}: {
  query: { data?: T[]; isPending: boolean; isError: boolean; error: unknown }
  subject: string
  kind: string
  children: (items: T[]) => ReactNode
}) {
  if (query.isPending) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="text-brand-orange" />
      </div>
    )
  }
  if (query.isError) return <EmptyState title="Search failed" description={getErrorMessage(query.error)} />
  if (!query.data?.length) {
    return <EmptyState title="No results" description={`We couldn’t find any ${kind} for ${subject}.`} />
  }
  return <>{children(query.data)}</>
}

type PersonResult = SearchResponse['people'][number]

/** People results: tap a person to open their profile, where you can follow or collaborate. */
function PeopleResults({ people }: { people: PersonResult[] }) {
  const profilePath = useProfilePath()
  return (
    <ul className="flex flex-col">
      {people.map((person) => (
        <li key={person.id}>
          <Link
            to={profilePath(person.id)}
            className="flex items-center gap-3 border-b border-hairline px-4 py-3 hover:bg-fg/5 sm:px-3"
          >
            <Avatar src={person.avatarUrl ?? undefined} name={person.fullName} size={46} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-1 text-body-m text-fg">
                <span className="truncate">{person.fullName}</span>
                {person.verified && <VerifyTick active />}
              </span>
              <span className="truncate text-caption text-fg-muted">
                <span className="text-brand-orange">{getRoleLabel({ role: person.memberRole ?? undefined })}</span>
                {person.headline && ` · ${person.headline}`}
              </span>
            </span>
            <span className="shrink-0 text-caption text-fg-muted">{formatCount(person.followerCount)} followers</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
