import { Button, EmptyState } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/client'
import type { Post } from '../types'
import { PostCard } from './PostCard'

interface PostListProps {
  posts: Post[] | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
  variant?: 'feed' | 'detail'
  empty: { title: string; description?: string }
}

/** Loading / error / empty / list states for a stream of posts. */
export function PostList({ posts, isPending, error, onRetry, variant, empty }: PostListProps) {
  if (isPending) {
    return (
      <div aria-busy className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-body-m text-fg-muted">{getErrorMessage(error)}</p>
        <Button variant="outline" fullWidth={false} className="h-10 rounded-full text-body-m" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  if (!posts?.length) return <EmptyState {...empty} />

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} variant={variant} />
      ))}
    </div>
  )
}

function PostSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-3 border-b border-hairline px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="size-[58px] rounded-full bg-surface dark:bg-grey-50" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 rounded bg-surface dark:bg-grey-50" />
          <div className="h-3 w-16 rounded bg-surface dark:bg-grey-50" />
        </div>
      </div>
      <div className="h-4 w-full rounded bg-surface dark:bg-grey-50" />
      <div className="h-4 w-5/6 rounded bg-surface dark:bg-grey-50" />
      <div className="h-[239px] w-full bg-surface dark:bg-grey-50" />
    </div>
  )
}
