import { DotsThreeVertical, GlobeHemisphereWest, Prohibit, Sparkle, User } from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/paths'
import { PageColumns } from '@/components/layout/AppShell'
import { BackHeader } from '@/components/layout/BackHeader'
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  TextAreaField,
  useToast,
  VerifyTick,
} from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { PostList } from '@/features/feed/components/PostList'
import { ReportModal } from '@/features/feed/components/ReportModal'
import { RightRail } from '@/features/feed/components/RightRail'
import { useUserPosts } from '@/features/feed/hooks/queries'
import type { Profile } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import {
  useBlockPerson,
  useCancelCollaboration,
  useFollowPerson,
  useMessagePerson,
  usePerson,
  useRequestCollaboration,
} from '../hooks/people'

type Sheet = 'collaborate' | 'report' | 'block' | null

const pillButton =
  'flex h-[38px] min-w-0 flex-1 items-center justify-center gap-[3px] rounded-full px-3 text-body-m transition disabled:opacity-60'

/**
 * Someone else's profile. Not in Figma: it follows the "Profile" frame, with Follow / Message /
 * Collaborate in place of Edit Profile.
 */
export function PersonPage() {
  const { userId = '' } = useParams()
  const person = usePerson(userId)
  const [sheet, setSheet] = useState<Sheet>(null)
  const block = useBlockPerson()
  const toast = useToast()
  const close = () => setSheet(null)

  if (person.data?.isMe) return <Navigate to={paths.profile} replace />

  return (
    <PageColumns aside={<RightRail />}>
      <BackHeader
        title="Profile"
        fallback={paths.home}
        actions={
          person.data && (
            <Menu
              className="w-[min(300px,calc(100vw-32px))] rounded-search"
              trigger={
                <IconButton label="More options" className="size-10 bg-fg/5 p-2">
                  <DotsThreeVertical weight="bold" className="size-6 text-fg" />
                </IconButton>
              }
            >
              {(closeMenu) => (
                <>
                  <MenuItem
                    size="sm"
                    tone="danger"
                    icon={<User />}
                    onSelect={() => {
                      closeMenu()
                      setSheet('report')
                    }}
                  >
                    Report this user
                  </MenuItem>
                  <MenuItem
                    size="sm"
                    tone="danger"
                    icon={<Prohibit />}
                    onSelect={() => {
                      closeMenu()
                      if (!person.data.blockedByMe) return setSheet('block')
                      block.mutate(
                        { id: userId, block: false },
                        {
                          onSuccess: () => toast(`You unblocked ${person.data.fullName}`),
                          onError: (error) => toast(getErrorMessage(error)),
                        },
                      )
                    }}
                  >
                    {person.data.blockedByMe ? 'Unblock' : 'Block'} {person.data.fullName}
                  </MenuItem>
                </>
              )}
            </Menu>
          )
        }
      />

      {person.isPending ? (
        <div className="h-[420px] animate-pulse bg-surface" />
      ) : person.isError ? (
        <EmptyState title="Profile not found" description={getErrorMessage(person.error)} />
      ) : (
        <div className="flex flex-col items-center gap-gap-sm">
          <ProfileHeader profile={person.data} onCollaborate={() => setSheet('collaborate')} />

          <div className="flex w-full flex-col gap-px">
            <p className="border-b border-hairline pb-[5px] text-center text-body-m text-fg">Posts</p>
            {person.data.blockedByMe ? (
              <EmptyState title="You blocked this account" description="Unblock them to see their posts." />
            ) : person.data.isPrivate ? (
              <EmptyState
                title="This profile is private"
                description={`Follow ${person.data.fullName} to see their posts.`}
              />
            ) : (
              <PersonPosts userId={userId} />
            )}
          </div>
        </div>
      )}

      {person.data && (
        <>
          {sheet === 'collaborate' && <CollaborateModal profile={person.data} onClose={close} />}
          {sheet === 'report' && <ReportModal target="user" targetId={userId} onClose={close} />}
          <ConfirmDialog
            open={sheet === 'block'}
            title={`Block ${person.data.fullName}?`}
            message="They won’t be able to message you or see your posts, and you won’t see theirs."
            confirmLabel="Block"
            loading={block.isPending}
            onClose={close}
            onConfirm={() =>
              block.mutate(
                { id: userId, block: true },
                {
                  onSuccess: () => {
                    close()
                    toast(`You blocked ${person.data.fullName}`)
                  },
                  onError: (error) => toast(getErrorMessage(error)),
                },
              )
            }
          />
        </>
      )}
    </PageColumns>
  )
}

function ProfileHeader({ profile, onCollaborate }: { profile: Profile; onCollaborate: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const follow = useFollowPerson()
  const message = useMessagePerson()
  const cancel = useCancelCollaboration()
  const onError = (error: unknown) => toast(getErrorMessage(error))
  const request = profile.collaborationRequest

  const collaborate = () => {
    if (request?.direction === 'received') return navigate(paths.chatRequest(request.id))
    if (request?.direction === 'sent')
      return cancel.mutate(
        { id: profile.id, requestId: request.id },
        { onSuccess: () => toast('Collaboration request withdrawn'), onError },
      )
    onCollaborate()
  }

  const collabLabel =
    request?.direction === 'received'
      ? 'Respond to request'
      : request?.direction === 'sent'
        ? 'Request sent · Withdraw'
        : profile.openToCollaborate
          ? 'Collaborate'
          : 'Not open to collaborations'

  return (
    <section className="flex w-full flex-col">
      <div className="-mb-[60px] h-[127px] w-full bg-brand-orange-tint">
        {profile.coverUrl && <img src={profile.coverUrl} alt="" className="size-full object-cover" />}
      </div>
      <div className="flex flex-col items-center gap-gap-sm px-4 sm:px-5">
        <Avatar
          src={profile.avatarUrl ?? undefined}
          name={profile.fullName}
          size={113}
          className="relative border-5 border-popover"
        />
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="flex items-center gap-1.5 text-h3 font-semibold text-fg">
            {profile.fullName}
            {profile.verified && <VerifyTick active />}
          </h1>
          <p className="flex items-center gap-2 text-body-m">
            <span className="font-semibold text-brand-orange">
              {getRoleLabel({ role: profile.memberRole ?? undefined })}
            </span>
            {profile.headline && <span className="text-grey-50 dark:text-grey-30">{profile.headline}</span>}
          </p>
          <p className="text-caption font-semibold text-brand-green">
            {formatCount(profile.collaborationCount)} collaborations
          </p>
          {profile.bio && <p className="max-w-[560px] text-body-s text-fg-muted">{profile.bio}</p>}
          {(profile.location || profile.country) && (
            <p className="flex items-center gap-[7px] text-body-s text-fg-muted">
              <GlobeHemisphereWest aria-hidden className="size-[18px]" />
              {[profile.location, profile.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <p className="flex items-center gap-1">
            <span className="text-body-s text-brand-green">{formatCount(profile.followingCount)}</span>
            <span className="text-caption text-fg-muted">Following</span>
          </p>
          <p className="flex items-center gap-1">
            <span className="text-body-s text-brand-green">{formatCount(profile.followerCount)}</span>
            <span className="text-caption text-fg-muted">followers</span>
          </p>
          {profile.followsYou && <span className="text-caption text-fg-muted">· Follows you</span>}
        </div>

        {!profile.blockedByMe && (
          <div className="flex w-full gap-2 sm:gap-3.5">
            <button
              type="button"
              disabled={(!profile.openToCollaborate && !request) || cancel.isPending}
              onClick={collaborate}
              className={cn(
                pillButton,
                'text-caption',
                profile.openToCollaborate || request
                  ? 'bg-[linear-gradient(-30deg,var(--color-brand-green)_15%,#ffffff_238%)] text-white hover:brightness-95'
                  : 'border border-border-default text-fg-muted',
              )}
            >
              <Sparkle aria-hidden className="size-[18px] shrink-0" />
              <span className="truncate">{collabLabel}</span>
            </button>
            <button
              type="button"
              aria-pressed={profile.isFollowing}
              disabled={follow.isPending}
              onClick={() => follow.mutate({ id: profile.id, follow: !profile.isFollowing }, { onError })}
              className={cn(
                pillButton,
                profile.isFollowing
                  ? 'border border-border-default text-fg hover:bg-fg/5'
                  : 'bg-brand-orange-tint text-brand-orange hover:brightness-95',
              )}
            >
              {profile.isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              type="button"
              disabled={message.isPending}
              onClick={() =>
                message.mutate(profile.id, {
                  onSuccess: (conversation) => navigate(paths.chat(conversation.id)),
                  onError,
                })
              }
              className={cn(pillButton, 'bg-brand-orange text-white hover:brightness-95')}
            >
              Message
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function PersonPosts({ userId }: { userId: string }) {
  const posts = useUserPosts(userId)
  return (
    <PostList
      posts={posts.data}
      isPending={posts.isPending}
      error={posts.error}
      onRetry={() => posts.refetch()}
      empty={{ title: 'No posts yet' }}
    />
  )
}

function CollaborateModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [message, setMessage] = useState('')
  const request = useRequestCollaboration()
  const toast = useToast()

  return (
    <Modal open onClose={onClose} title="Request to collaborate" className="max-w-[480px]">
      <p className="text-body-m text-fg-muted">
        {profile.fullName} will see your request in their chats and can accept or decline it.
      </p>
      <TextAreaField
        label="Message (optional)"
        placeholder="I would like to collab with you on a project that…"
        maxLength={500}
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button
        className="h-[38px] rounded-full bg-brand-orange text-body-l"
        loading={request.isPending}
        onClick={() =>
          request.mutate(
            { id: profile.id, message: message.trim() || undefined },
            {
              onSuccess: () => {
                toast(`Request sent to ${profile.fullName}`)
                onClose()
              },
              onError: (error) => toast(getErrorMessage(error)),
            },
          )
        }
      >
        Send Request
      </Button>
    </Modal>
  )
}
