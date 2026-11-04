import { DotsThreeOutline, ShieldCheck, ShieldSlash, UserMinus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState, IconButton, Menu, MenuItem, Modal, Tag, useToast } from '@/components/ui'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { getRoleLabel } from '@/features/auth/user'
import { useProfilePath } from '@/features/profile/profilePath'
import type { Forum } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/errors'
import { useForumMembers, useRemoveForumMember, useSetForumRole } from '../hooks/queries'

const ROLE_TAGS = { owner: 'Owner', moderator: 'Moderator' } as const

/** Everyone in a forum; owners and moderators can manage them from here. */
export function ForumMembersModal({ forum, onClose }: { forum: Forum; onClose: () => void }) {
  const { user } = useAuth()
  const members = useForumMembers(forum.id)
  const profilePath = useProfilePath()
  const setRole = useSetForumRole()
  const remove = useRemoveForumMember()
  const toast = useToast()
  const onError = (error: unknown) => toast(getErrorMessage(error))

  return (
    <Modal open onClose={onClose} title={`${forum.memberCount} members`} gap="sm" className="max-w-[480px]">
      {members.isPending ? (
        <div className="h-[240px] animate-pulse rounded-card bg-surface" />
      ) : members.isError ? (
        <EmptyState title="Couldn’t load members" description={getErrorMessage(members.error)} className="py-8" />
      ) : (
        <ul className="flex flex-col">
          {members.data.map((member) => {
            // Owners manage everyone; moderators manage ordinary members. Nobody manages themselves.
            const canManage =
              member.id !== user?.id &&
              member.role !== 'owner' &&
              (forum.myRole === 'owner' || (forum.myRole === 'moderator' && member.role === 'member'))
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0"
              >
                <Link to={profilePath(member.id)} className="flex min-w-0 items-center gap-2.5 hover:opacity-80">
                  <Avatar src={member.avatarUrl ?? undefined} name={member.fullName} size={40} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body-m text-fg">{member.fullName}</span>
                    <span className="text-caption text-brand-orange">
                      {getRoleLabel({ role: member.memberRole ?? undefined })}
                    </span>
                  </span>
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  {member.role !== 'member' && (
                    <Tag tone={member.role === 'owner' ? 'orange' : 'info'} className="text-caption">
                      {ROLE_TAGS[member.role]}
                    </Tag>
                  )}
                  {canManage && (
                    <Menu
                      trigger={
                        <IconButton label={`Manage ${member.fullName}`} className="size-7 text-fg-muted">
                          <DotsThreeOutline weight="fill" className="size-6" />
                        </IconButton>
                      }
                    >
                      {(close) => (
                        <>
                          {forum.myRole === 'owner' && (
                            <MenuItem
                              icon={member.role === 'moderator' ? <ShieldSlash /> : <ShieldCheck />}
                              onSelect={() => {
                                close()
                                const role = member.role === 'moderator' ? 'member' : 'moderator'
                                setRole.mutate(
                                  { id: forum.id, userId: member.id, role },
                                  {
                                    onSuccess: () =>
                                      toast(
                                        role === 'moderator'
                                          ? `${member.fullName} is now a moderator`
                                          : `${member.fullName} is no longer a moderator`,
                                      ),
                                    onError,
                                  },
                                )
                              }}
                            >
                              {member.role === 'moderator' ? 'Remove as moderator' : 'Make moderator'}
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<UserMinus />}
                            tone="danger"
                            onSelect={() => {
                              close()
                              remove.mutate(
                                { id: forum.id, userId: member.id },
                                { onSuccess: () => toast(`${member.fullName} was removed`), onError },
                              )
                            }}
                          >
                            Remove from forum
                          </MenuItem>
                        </>
                      )}
                    </Menu>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
