import { useState } from 'react'
import { PageColumns } from '@/components/layout/AppShell'
import { Tabs } from '@/components/ui'
import { CreatePost } from '../components/CreatePost'
import { PostList } from '../components/PostList'
import { RightRail } from '../components/RightRail'
import { SearchHeader } from '../components/SearchHeader'
import { useFeed } from '../hooks/queries'
import type { FeedTab } from '../types'

const FEED_TABS = [
  { value: 'for-you', label: 'For You' },
  { value: 'following', label: 'Following' },
] as const

export function HomePage() {
  const [tab, setTab] = useState<FeedTab>('for-you')
  const feed = useFeed(tab)

  return (
    <PageColumns aside={<RightRail />}>
      <SearchHeader>
        <Tabs label="Feed" items={FEED_TABS} value={tab} onChange={setTab} />
      </SearchHeader>

      <div className="flex flex-col gap-3 p-0 sm:p-2.5">
        <CreatePost />
        <PostList
          posts={feed.data}
          isPending={feed.isPending}
          error={feed.error}
          onRetry={() => feed.refetch()}
          empty={
            tab === 'following'
              ? { title: 'Nothing here yet', description: 'Posts from people you follow will show up here.' }
              : { title: 'No posts yet', description: 'Be the first to share something with the community.' }
          }
        />
      </div>
    </PageColumns>
  )
}
