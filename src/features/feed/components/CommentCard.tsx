import { DotsThreeOutline, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { ConfirmDialog, IconButton, Menu, MenuItem, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useDeleteComment, useReportComment, useToggleCommentLike } from '../hooks/queries'
import { useSharePost } from '../hooks/useShare'
import type { Comment } from '../types'
import { EngagementBar } from './EngagementBar'
import { AuthorLine } from './PostCard'

/** A comment on the post page (Figma "post expanded", property "comment"). */
export function CommentCard({ comment }: { comment: Comment }) {
  const toast = useToast()
  const share = useSharePost()
  const like = useToggleCommentLike()
  const report = useReportComment()
  const remove = useDeleteComment()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const onError = (error: unknown) => toast(getErrorMessage(error))

  return (
    <article className="flex flex-col gap-gap-sm border-b border-hairline bg-background px-4 py-2.5 sm:px-5">
      <header className="flex items-start justify-between gap-3">
        <AuthorLine author={comment.author} createdAt={comment.createdAt} />
        <Menu
          trigger={
            <IconButton label="Comment options" className="size-7 text-fg-muted">
              <DotsThreeOutline weight="fill" className="size-7" />
            </IconButton>
          }
        >
          {(close) =>
            comment.isMine ? (
              <MenuItem
                icon={<Trash />}
                tone="danger"
                onSelect={() => {
                  close()
                  setConfirmDelete(true)
                }}
              >
                Delete Comment
              </MenuItem>
            ) : (
              <MenuItem
                icon={<Warning />}
                tone="warning"
                onSelect={() => {
                  close()
                  report.mutate(comment.id, { onSuccess: () => toast('Comment reported'), onError })
                }}
              >
                Report
              </MenuItem>
            )
          }
        </Menu>
      </header>

      <div className="flex flex-col gap-3">
        {comment.content && (
          <p className="text-body-m break-words whitespace-pre-line text-fg sm:text-body-l">{comment.content}</p>
        )}
        {comment.imageUrl && (
          <img src={comment.imageUrl} alt="" loading="lazy" className="h-[239px] w-full object-cover" />
        )}
        <EngagementBar
          liked={comment.likedByMe}
          likes={comment.likes}
          comments={comment.repliesCount}
          onLike={() => like.mutate({ comment, liked: !comment.likedByMe }, { onError })}
          onShare={() => share(comment.postId, comment.content)}
        />
      </div>

      {confirmDelete && (
        <ConfirmDialog
          open
          title="Delete comment?"
          message="This comment will be permanently removed."
          confirmLabel="Delete"
          loading={remove.isPending}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() =>
            remove.mutate(comment, {
              onSuccess: () => {
                setConfirmDelete(false)
                toast('Comment deleted')
              },
              onError,
            })
          }
        />
      )}
    </article>
  )
}
