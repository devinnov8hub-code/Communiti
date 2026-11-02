import { Paperclip } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Avatar, ConfirmDialog, useToast } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import type { Media, Post, UserSummary } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { formatCount, formatPostTimestamp, timeAgo } from '@/lib/format'
import { useBlockUser, useDeletePost, useHidePost, useToggleFollow, useTogglePostLike } from '../hooks/queries'
import { useSharePost } from '../hooks/useShare'
import { CommentComposer } from './CommentComposer'
import { EngagementBar } from './EngagementBar'
import { PostMenu } from './PostMenu'
import { ReportPostModal } from './ReportPostModal'

interface PostCardProps {
  post: Post
  /** `feed`: compact card with comment bar. `detail`: Follow button, timestamp/views row (Figma "comment expanded"). */
  variant?: 'feed' | 'detail'
  /** Rendered between the stats and the comment bar (e.g. "Sort by"). */
  children?: ReactNode
  /** Called after the post is deleted, hidden or its author blocked. */
  onRemoved?: () => void
}

export function PostCard({ post, variant = 'feed', children, onRemoved }: PostCardProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const share = useSharePost()
  const like = useTogglePostLike()
  const follow = useToggleFollow()
  const hide = useHidePost()
  const block = useBlockUser()
  const remove = useDeletePost()
  const [reporting, setReporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isDetail = variant === 'detail'
  const postUrl = paths.post(post.id)
  const onError = (error: unknown) => toast(getErrorMessage(error))

  return (
    <article className="flex flex-col gap-gap-sm border-b border-hairline bg-background px-4 py-2.5 sm:px-5">
      <header className="flex items-start justify-between gap-3">
        <AuthorLine author={post.author} createdAt={post.createdAt} />
        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          {isDetail && !post.isMine && (
            <button
              type="button"
              aria-pressed={post.followingAuthor}
              disabled={follow.isPending}
              onClick={() => follow.mutate({ userId: post.author.id, following: !post.followingAuthor }, { onError })}
              className={cn(
                'min-w-[75px] rounded-full px-2 py-[5px] text-body-m whitespace-nowrap transition-colors disabled:opacity-60',
                post.followingAuthor
                  ? 'border border-brand-orange px-3 text-brand-orange'
                  : 'bg-brand-orange text-white hover:brightness-95',
              )}
            >
              {post.followingAuthor ? 'Following' : 'Follow'}
            </button>
          )}
          <PostMenu
            post={post}
            onShare={() => share(post.id, post.body)}
            onNotInterested={() =>
              hide.mutate(post.id, {
                onSuccess: () => {
                  toast('We’ll show you fewer posts like this')
                  onRemoved?.()
                },
                onError,
              })
            }
            onBlock={() =>
              block.mutate(post.author.id, {
                onSuccess: () => {
                  toast(`You blocked ${post.author.fullName}`)
                  onRemoved?.()
                },
                onError,
              })
            }
            onReport={() => setReporting(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {isDetail ? (
          <PostBody post={post} />
        ) : (
          <Link to={postUrl} className="flex flex-col gap-3 rounded-sm">
            <PostBody post={post} />
          </Link>
        )}
        <MediaFiles media={post.media} />

        {isDetail && (
          <p className="border-b border-hairline px-[5px] py-2.5 text-body-m whitespace-pre text-fg-muted sm:text-body-l">
            {formatPostTimestamp(post.createdAt)}{' '}
            <span className="font-semibold text-fg">{formatCount(post.viewCount)}</span> Views
          </p>
        )}

        <EngagementBar
          liked={post.likedByMe}
          likes={post.likeCount}
          comments={post.commentCount}
          commentsHref={isDetail ? undefined : postUrl}
          onLike={() => like.mutate({ id: post.id, liked: !post.likedByMe }, { onError })}
          onShare={() => share(post.id, post.body)}
        />
      </div>

      {children}
      <CommentComposer postId={post.id} />

      {reporting && <ReportPostModal postId={post.id} onClose={() => setReporting(false)} />}
      {confirmDelete && (
        <ConfirmDialog
          open
          title="Delete post?"
          message="This post and its comments will be permanently removed."
          confirmLabel="Delete"
          loading={remove.isPending}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() =>
            remove.mutate(post.id, {
              onSuccess: () => {
                setConfirmDelete(false)
                toast('Post deleted')
                if (isDetail) navigate(paths.home, { replace: true })
                onRemoved?.()
              },
              onError,
            })
          }
        />
      )}
    </article>
  )
}

export function AuthorLine({ author, createdAt }: { author: UserSummary; createdAt: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar src={author.avatarUrl ?? undefined} name={author.fullName} size={58} className="size-12 sm:size-[58px]" />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="flex flex-wrap items-baseline gap-x-[26px] gap-y-1 text-body-m sm:text-body-l">
          <span className="truncate text-fg">{author.fullName}</span>
          <time dateTime={createdAt} className="text-fg-muted">
            {timeAgo(createdAt)}
          </time>
        </p>
        <p className="text-body-s text-brand-orange sm:text-body-m">
          {getRoleLabel({ role: author.memberRole ?? undefined })}
        </p>
      </div>
    </div>
  )
}

function PostBody({ post }: { post: Pick<Post, 'body' | 'media'> }) {
  return (
    <>
      {post.body && <p className="text-body-m break-words whitespace-pre-line text-fg sm:text-body-l">{post.body}</p>}
      <MediaImages media={post.media} />
    </>
  )
}

export function MediaImages({ media }: { media: Media[] }) {
  return media.map(
    (item) =>
      item.kind === 'image' &&
      item.url && <img key={item.id} src={item.url} alt="" loading="lazy" className="h-[239px] w-full object-cover" />,
  )
}

/** Documents and other non-image attachments, as links. */
export function MediaFiles({ media }: { media: Media[] }) {
  const files = media.filter((item) => item.kind !== 'image' && item.url)
  if (files.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {files.map((file) => (
        <li key={file.id}>
          <a
            href={file.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-full bg-brand-orange-tint px-3 py-1 text-caption text-brand-orange hover:underline"
          >
            <Paperclip aria-hidden className="size-3.5" />
            <span className="max-w-[180px] truncate">{file.originalName ?? 'Attachment'}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
