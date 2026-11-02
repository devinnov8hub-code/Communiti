import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, SearchField, Tabs, type TabItem } from '@/components/ui'
import { PostList } from '../components/PostList'
import { RightRail } from '../components/RightRail'
import { MIN_SEARCH_LENGTH, useSearchPosts, useSearchTopics } from '../hooks/queries'
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
        ) : (
          <EmptyState title="No results" description={`We couldn’t find any ${scope} for ${subject}.`} />
        )}
      </div>
    </PageColumns>
  )
}
