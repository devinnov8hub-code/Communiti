import { CaretDown } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { Button, EmptyState, Menu, MenuRadioItem } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { CommentCard } from '../components/CommentCard'
import { PostCard } from '../components/PostCard'
import { RightRail } from '../components/RightRail'
import { useComments, usePost } from '../hooks/queries'
import type { CommentSort } from '../types'

const SORT_LABELS: Record<CommentSort, string> = { latest: 'Latest', popular: 'Popular' }

/** Single post with its comments (Figma "Post view"). */
export function PostPage() {
  const { postId = '' } = useParams()
  const navigate = useNavigate()
  const [sort, setSort] = useState<CommentSort>('latest')
  const post = usePost(postId)
  const comments = useComments(postId, sort)

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(paths.home))

  return (
    <PageColumns aside={<RightRail />}>
      <BackHeader title="Post" fallback={paths.home} />

      <div className="flex flex-col gap-3 sm:p-2.5">
        {post.isPending ? (
          <div aria-busy className="h-[600px] animate-pulse bg-surface" />
        ) : post.isError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-body-m text-fg-muted">{getErrorMessage(post.error)}</p>
            <Button variant="outline" fullWidth={false} className="h-10 rounded-full text-body-m" onClick={goBack}>
              Go back
            </Button>
          </div>
        ) : (
          <>
            <PostCard post={post.data} variant="detail">
              <div className="flex items-center border-b border-hairline p-2.5">
                <Menu
                  align="start"
                  trigger={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-body-m text-fg-muted hover:text-fg sm:text-body-l"
                    >
                      Sort by: {SORT_LABELS[sort]}
                      <CaretDown aria-hidden className="size-[18px]" />
                    </button>
                  }
                >
                  {(close) =>
                    (Object.keys(SORT_LABELS) as CommentSort[]).map((value) => (
                      <MenuRadioItem
                        key={value}
                        checked={value === sort}
                        onSelect={() => {
                          setSort(value)
                          close()
                        }}
                      >
                        {SORT_LABELS[value]}
                      </MenuRadioItem>
                    ))
                  }
                </Menu>
              </div>
            </PostCard>

            <section aria-label="Comments" className="flex flex-col gap-3">
              {comments.isPending ? (
                <div aria-busy className="h-40 animate-pulse bg-surface" />
              ) : comments.data?.length ? (
                comments.data.map((comment) => <CommentCard key={comment.id} comment={comment} />)
              ) : (
                <EmptyState title="No comments yet" description="Start the conversation." />
              )}
            </section>
          </>
        )}
      </div>
    </PageColumns>
  )
}
