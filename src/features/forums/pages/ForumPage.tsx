import { Plus, TrendDown } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import {
  AvatarStack,
  ConfirmDialog,
  EmptyState,
  Menu,
  MenuRadioItem,
  Modal,
  Spinner,
  Tag,
  useToast,
} from '@/components/ui'
import { CreatePost } from '@/features/feed/components/CreatePost'
import { PostList } from '@/features/feed/components/PostList'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/errors'
import { formatPostTimestamp } from '@/lib/format'
import { ForumFormModal } from '../components/ForumFormModal'
import { ForumMembersModal } from '../components/ForumMembersModal'
import { ForumSettingsMenu } from '../components/ForumSettingsMenu'
import { topicTone } from '../format'
import { useDeleteForum, useForum, useForumPosts, useJoinForum } from '../hooks/queries'
import type { ForumPostSort } from '../types'

const SORTS: { value: ForumPostSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'mine', label: 'My posts' },
  { value: 'my_replies', label: 'My replies' },
]

type Sheet = 'post' | 'edit' | 'members' | 'delete' | null

const fabClass =
  'pointer-events-auto flex items-center justify-center rounded-full bg-brand-orange text-white shadow-popover transition hover:brightness-95 disabled:opacity-70'

/** Single forum (Figma "Forumns view" / "Forumn view after joining"). */
export function ForumPage() {
  const { forumId = '' } = useParams()
  const navigate = useNavigate()
  const forum = useForum(forumId)
  const join = useJoinForum()
  const remove = useDeleteForum()
  const [sort, setSort] = useState<ForumPostSort>('latest')
  const [sheet, setSheet] = useState<Sheet>(null)
  const posts = useForumPosts(forumId, sort, Boolean(forum.data?.isMember))
  const toast = useToast()
  const onError = (error: unknown) => toast(getErrorMessage(error))
  const close = () => setSheet(null)

  const created = forum.data ? formatPostTimestamp(forum.data.createdAt).split('  ')[0] : ''

  return (
    <PageColumns aside={<RightRail />} className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
      <BackHeader
        title="Forum"
        fallback={paths.forums}
        actions={
          forum.data?.isMember && (
            <ForumSettingsMenu forum={forum.data} onEdit={() => setSheet('edit')} onDelete={() => setSheet('delete')} />
          )
        }
      />

      {forum.isPending ? (
        <div className="h-[420px] animate-pulse bg-surface" />
      ) : forum.isError ? (
        <EmptyState title="Forum not found" description={getErrorMessage(forum.error)} />
      ) : (
        <div className="flex flex-1 flex-col items-center gap-gap-md pb-28">
          <section className="flex w-full flex-col border-b border-hairline">
            <div className="h-[137px] w-full bg-grey-30">
              {forum.data.coverUrl && <img src={forum.data.coverUrl} alt="" className="size-full object-cover" />}
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-2.5">
              <h1 className="text-h4 font-semibold text-fg">{forum.data.name}</h1>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSheet('members')}
                  className="flex items-center gap-1.5 hover:opacity-80"
                >
                  <AvatarStack
                    people={forum.data.memberAvatars.map((member) => ({
                      id: member.id,
                      name: member.fullName,
                      avatarUrl: member.avatarUrl ?? undefined,
                    }))}
                  />
                  <span className="text-body-s text-fg-subtle">{forum.data.memberCount} members</span>
                </button>
                {forum.data.isMember && (
                  <Menu
                    title="Sort posts by"
                    className="rounded-search [&>p]:text-fg"
                    trigger={
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full bg-background p-2 text-caption text-fg hover:bg-fg/5"
                      >
                        <TrendDown aria-hidden className="size-3.5" />
                        {SORTS.find((item) => item.value === sort)?.label}
                      </button>
                    }
                  >
                    {(closeMenu) =>
                      SORTS.map((item) => (
                        <MenuRadioItem
                          key={item.value}
                          checked={item.value === sort}
                          onSelect={() => {
                            setSort(item.value)
                            closeMenu()
                          }}
                        >
                          {item.label}
                        </MenuRadioItem>
                      ))
                    }
                  </Menu>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-body-m font-semibold text-fg">Focus:</p>
                <ul className="flex flex-wrap gap-2.5">
                  {forum.data.topics.map((topic, index) => (
                    <li key={topic.id}>
                      <Tag tone={topicTone(index)} className="text-body-s">
                        {topic.name}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-body-m font-semibold text-fg">About:</p>
              <p className="text-body-m text-fg">{forum.data.about}</p>
            </div>
          </section>

          {forum.data.isMember ? (
            <section className="w-full" aria-label="Forum posts">
              <PostList
                posts={posts.data}
                isPending={posts.isPending}
                error={posts.error}
                onRetry={() => posts.refetch()}
                empty={{ title: 'Nothing here yet', description: 'Use the + button to start the conversation.' }}
              />
            </section>
          ) : (
            <p className="w-[353px] max-w-full text-center text-body-l text-fg-muted">Created {created}</p>
          )}
        </div>
      )}

      {forum.data && (
        <div className="pointer-events-none sticky bottom-6 flex justify-end px-6">
          {forum.data.isMember ? (
            <button
              type="button"
              aria-label="Create a post in this forum"
              onClick={() => setSheet('post')}
              className={`${fabClass} size-20`}
            >
              <Plus className="size-[34px]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={join.isPending}
              onClick={() =>
                join.mutate(forumId, { onSuccess: () => toast(`Welcome to ${forum.data.name}!`), onError })
              }
              className={`${fabClass} h-20 w-[234px] px-[13px] text-h3 font-semibold`}
            >
              {join.isPending ? <Spinner /> : 'Join Forum'}
            </button>
          )}
        </div>
      )}

      {forum.data && (
        <>
          <Modal open={sheet === 'post'} onClose={close} title="Create Post" gap="sm">
            {sheet === 'post' && <CreatePost forumId={forumId} onPosted={close} />}
          </Modal>
          {sheet === 'edit' && <ForumFormModal forum={forum.data} onClose={close} />}
          {sheet === 'members' && <ForumMembersModal forum={forum.data} onClose={close} />}
          <ConfirmDialog
            open={sheet === 'delete'}
            title="Delete forum?"
            message={`${forum.data.name} and all its posts will be permanently removed for everyone.`}
            confirmLabel="Delete"
            loading={remove.isPending}
            onClose={close}
            onConfirm={() =>
              remove.mutate(forumId, {
                onSuccess: () => {
                  toast('Forum deleted')
                  navigate(paths.forums, { replace: true })
                },
                onError,
              })
            }
          />
        </>
      )}
    </PageColumns>
  )
}
