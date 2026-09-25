import { FadersHorizontal, GearSix, SignOut } from '@phosphor-icons/react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import { AvatarStack, EmptyState, IconButton, Menu, MenuRadioItem, Spinner, Tag, useToast } from '@/components/ui'
import { PostList } from '@/features/feed/components/PostList'
import { RightRail } from '@/features/feed/components/RightRail'
import { getErrorMessage } from '@/lib/api/client'
import { formatPostTimestamp } from '@/lib/format'
import { useForum, useForumMembership, useForumPosts, useMuteForum } from '../hooks/queries'
import type { ForumPostSort } from '../types'

const SORTS: { value: ForumPostSort; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'my-posts', label: 'My posts' },
  { value: 'my-replies', label: 'My replies' },
]

/** Single forum (Figma "Forumns view"). */
export function ForumPage() {
  const { forumId = '' } = useParams()
  const forum = useForum(forumId)
  const membership = useForumMembership()
  const mute = useMuteForum()
  const [sort, setSort] = useState<ForumPostSort>('latest')
  const posts = useForumPosts(forumId, sort, Boolean(forum.data?.joined))
  const toast = useToast()
  const onError = (error: unknown) => toast(getErrorMessage(error))

  const created = forum.data ? formatPostTimestamp(forum.data.createdAt).split('  ')[0] : ''

  return (
    <PageColumns aside={<RightRail />} className="flex min-h-[calc(100dvh-56px)] flex-col md:min-h-dvh">
      <BackHeader
        title="Forum"
        fallback={paths.forums}
        actions={
          forum.data?.joined && (
            <Menu
              className="w-[min(350px,calc(100vw-32px))] rounded-search"
              trigger={
                <IconButton label="Forum settings" className="size-10 bg-fg/5 p-2 hover:bg-fg/10">
                  <GearSix className="size-6 text-fg" />
                </IconButton>
              }
            >
              {(close) => (
                <>
                  <MenuRadioItem
                    checked={forum.data.muted}
                    onSelect={() =>
                      mute.mutate(
                        { id: forumId, muted: !forum.data.muted },
                        {
                          onSuccess: (updated) =>
                            toast(updated.muted ? 'Notifications muted' : 'Notifications unmuted'),
                          onError,
                        },
                      )
                    }
                  >
                    <span className="text-body-s font-semibold text-fg-muted">Mute notifications &amp; messages</span>
                  </MenuRadioItem>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      membership.mutate(
                        { id: forumId, joined: false },
                        { onSuccess: () => toast('You left the forum'), onError },
                      )
                    }}
                    className="mt-4 flex w-full items-center justify-between gap-3 bg-surface px-1 py-2.5 text-left hover:opacity-80"
                  >
                    <span className="flex flex-col">
                      <span className="text-body-s font-semibold text-error">Leave Forum</span>
                      <span className="text-caption text-fg-muted">
                        leave this forum, all your messages would remain
                      </span>
                    </span>
                    <SignOut aria-hidden className="size-[18px] shrink-0 text-error" />
                  </button>
                </>
              )}
            </Menu>
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
              {(forum.data.headerUrl ?? forum.data.coverUrl) && (
                <img src={forum.data.headerUrl ?? forum.data.coverUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-2.5">
              <h1 className="text-h4 font-semibold text-fg">{forum.data.name}</h1>
              <div className="flex items-center gap-1.5">
                <AvatarStack people={forum.data.members} />
                <span className="text-body-s text-fg-subtle">{forum.data.membersCount} members</span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-body-m font-semibold text-fg">Focus:</p>
                <ul className="flex flex-wrap gap-2.5">
                  {forum.data.topics.map((topic) => (
                    <li key={topic.label}>
                      <Tag tone={topic.tone} className="text-body-s">
                        {topic.label}
                      </Tag>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-body-m font-semibold text-fg">About:</p>
              <p className="text-body-m text-fg">{forum.data.description}</p>
            </div>
          </section>

          {forum.data.joined ? (
            <section className="flex w-full flex-col gap-2" aria-label="Forum posts">
              <div className="flex justify-end px-5">
                <Menu
                  title="Sort posts by"
                  className="rounded-search [&>p]:text-fg"
                  trigger={
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-[4px] border border-border-default bg-popover px-2.5 py-1.5 text-body-s font-semibold text-fg-muted hover:text-fg"
                    >
                      {SORTS.find((item) => item.value === sort)?.label}
                      <FadersHorizontal aria-hidden className="size-4" />
                    </button>
                  }
                >
                  {(close) =>
                    SORTS.map((item) => (
                      <MenuRadioItem
                        key={item.value}
                        checked={item.value === sort}
                        onSelect={() => {
                          setSort(item.value)
                          close()
                        }}
                      >
                        {item.label}
                      </MenuRadioItem>
                    ))
                  }
                </Menu>
              </div>
              <PostList
                posts={posts.data}
                isPending={posts.isPending}
                error={posts.error}
                onRetry={() => posts.refetch()}
                empty={{ title: 'Nothing here yet', description: 'Posts in this forum will show up here.' }}
              />
            </section>
          ) : (
            <p className="w-[353px] max-w-full text-center text-body-l text-fg-muted">Created {created}</p>
          )}
        </div>
      )}

      {forum.data && !forum.data.joined && (
        <div className="pointer-events-none sticky bottom-6 flex justify-end px-6">
          <button
            type="button"
            disabled={membership.isPending}
            onClick={() =>
              membership.mutate(
                { id: forumId, joined: true },
                { onSuccess: () => toast(`Welcome to ${forum.data.name}!`), onError },
              )
            }
            className="pointer-events-auto flex h-20 w-[234px] items-center justify-center rounded-full bg-brand-orange px-[13px] text-h3 font-semibold text-white shadow-popover transition hover:brightness-95 disabled:opacity-70"
          >
            {membership.isPending ? <Spinner /> : 'Join Forum'}
          </button>
        </div>
      )}
    </PageColumns>
  )
}
