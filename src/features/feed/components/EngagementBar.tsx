import { ChatCenteredText, ShareNetwork, ThumbsUp } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface EngagementBarProps {
  liked: boolean
  likes: number
  comments: number
  /** When set, the comment count links to the post page. */
  commentsHref?: string
  onLike: () => void
  onShare: () => void
}

/** Like / comment / share row under posts and comments. */
export function EngagementBar({ liked, likes, comments, commentsHref, onLike, onShare }: EngagementBarProps) {
  const commentContent = (
    <>
      <ChatCenteredText aria-hidden className="size-6" />
      <span>{comments}</span>
    </>
  )
  const itemClass = 'flex items-center gap-1.5 rounded-sm text-body-s text-fg transition-colors'

  return (
    <div className="flex items-center gap-6">
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? `Unlike (${likes} likes)` : `Like (${likes} likes)`}
        onClick={onLike}
        className={cn(itemClass, liked ? 'text-brand-orange' : 'hover:text-brand-orange')}
      >
        <ThumbsUp aria-hidden weight={liked ? 'fill' : 'regular'} className="size-6" />
        <span>{likes}</span>
      </button>

      {commentsHref ? (
        <Link
          to={commentsHref}
          aria-label={`${comments} comments`}
          className={cn(itemClass, 'hover:text-brand-orange')}
        >
          {commentContent}
        </Link>
      ) : (
        <span aria-label={`${comments} comments`} className={itemClass}>
          {commentContent}
        </span>
      )}

      <button type="button" aria-label="Share" onClick={onShare} className={cn(itemClass, 'hover:text-brand-orange')}>
        <ShareNetwork aria-hidden className="size-6" />
      </button>
    </div>
  )
}
