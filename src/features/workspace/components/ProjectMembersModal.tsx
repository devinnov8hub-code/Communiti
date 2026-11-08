import { Check, DotsThree, UserMinus, X } from '@phosphor-icons/react'
import { useDeferredValue, useState, type ReactNode } from 'react'
import membersIllustration from '@/assets/workspace/members-illustration.webp'
import { Avatar, IconButton, Menu, MenuItem, Modal, SearchField, Spinner, Tabs, useToast } from '@/components/ui'
import { getErrorMessage } from '@/lib/api/errors'
import { useJoinRequests, useMembers, useRemoveMember, useRespondToJoinRequest } from '../hooks/queries'
import type { ProjectWorkspace, WorkspaceMember } from '../types'

type View = 'members' | 'requests'

/** "Project members" sheet — admins also manage join requests (Figma "Members (Admin Only)"). */
export function ProjectMembersModal({ workspace, onClose }: { workspace: ProjectWorkspace; onClose: () => void }) {
  const isAdmin = workspace.membership === 'admin'
  const [view, setView] = useState<View>('members')
  const [query, setQuery] = useState('')
  const search = useDeferredValue(query.trim().toLowerCase())
  const members = useMembers(workspace.id)
  const requests = useJoinRequests(workspace.id, isAdmin)

  const matches = (member: WorkspaceMember) => !search || member.name.toLowerCase().includes(search)
  const requestCount = requests.data?.length ?? 0

  return (
    <Modal open onClose={onClose} title="Project members" gap="sm" className="min-h-[min(672px,calc(100dvh-32px))]">
      <div className="flex flex-col items-center gap-gap-md">
        <p className="text-body-s text-grey-40">
          <span className="text-brand-orange">{workspace.title}</span>
          <span className="text-fg"> | </span>
          {members.data?.length ?? workspace.membersCount} Members
        </p>
        <span className="flex size-[125px] items-center justify-center rounded-full bg-brand-orange-peach">
          <img src={membersIllustration} alt="" width={92} height={93} className="size-[92px]" />
        </span>
      </div>
      <p className="text-body-s text-fg-body">
        Organize your project team by managing members, assigning responsibilities, and fostering effective
        collaboration.
      </p>
      <SearchField size="sm" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />

      {isAdmin ? (
        // The design's "Accept Requests" switch is left out: the backend can't pause join requests.
        <Tabs
          label="Members and requests"
          value={view}
          onChange={setView}
          items={[
            { value: 'members', label: 'Members' },
            { value: 'requests', label: requestCount ? `Requests (${requestCount})` : 'Requests' },
          ]}
          className="[&_button]:text-body-s [&_button[aria-selected=false]]:text-grey-40"
        />
      ) : (
        <h3 className="pt-2 text-body-m text-fg-subtle">Members</h3>
      )}

      {view === 'members' || !isAdmin ? (
        <MemberList loading={members.isPending} error={members.error} empty="No members match your search.">
          {members.data?.filter(matches).map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              title={
                <>
                  {member.name}
                  {member.isYou && <span className="text-grey-40"> • You</span>}
                </>
              }
              actions={
                isAdmin &&
                !member.isYou &&
                !member.isOwner && <MemberActions projectId={workspace.id} member={member} />
              }
            />
          ))}
        </MemberList>
      ) : (
        <MemberList loading={requests.isPending} error={requests.error} empty="No pending requests.">
          {requests.data
            ?.filter((request) => matches(request.user))
            .map((request) => (
              <MemberRow
                key={request.id}
                member={request.user}
                title={
                  <>
                    {request.user.name} is requesting to join your project
                    {request.message && <span className="block text-body-s text-fg-body">“{request.message}”</span>}
                  </>
                }
                actions={<RequestActions projectId={workspace.id} requestId={request.id} name={request.user.name} />}
              />
            ))}
        </MemberList>
      )}
    </Modal>
  )
}

function MemberList({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean
  error: Error | null
  empty: string
  children: ReactNode[] | undefined
}) {
  if (loading)
    return (
      <div className="flex justify-center py-6 text-brand-orange">
        <Spinner />
      </div>
    )
  if (error) return <p className="py-6 text-center text-body-s text-fg-muted">{getErrorMessage(error)}</p>
  if (!children?.length) return <p className="py-6 text-center text-body-s text-fg-muted">{empty}</p>
  return <ul className="flex flex-col">{children}</ul>
}

function MemberRow({ member, title, actions }: { member: WorkspaceMember; title: ReactNode; actions?: ReactNode }) {
  return (
    <li className="flex items-center gap-2 border-b border-hairline py-2 last:border-b-0">
      <Avatar src={member.avatarUrl} name={member.name} size={36} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body-m text-fg">{title}</p>
        <p className="text-caption text-brand-orange">{member.role}</p>
      </div>
      {actions}
    </li>
  )
}

const dotsTrigger = (label: string) => (
  <IconButton label={label} className="size-8 text-fg">
    <DotsThree weight="bold" className="size-6" />
  </IconButton>
)

function MemberActions({ projectId, member }: { projectId: string; member: WorkspaceMember }) {
  const remove = useRemoveMember(projectId)
  const toast = useToast()
  return (
    <Menu trigger={dotsTrigger(`Actions for ${member.name}`)} className="w-[220px]">
      {(close) => (
        <MenuItem
          size="sm"
          tone="danger"
          icon={<UserMinus />}
          onSelect={() => {
            close()
            remove.mutate(member.id, {
              onSuccess: () => toast(`${member.name} was removed from the project`),
              onError: (error) => toast(getErrorMessage(error)),
            })
          }}
        >
          Remove from project
        </MenuItem>
      )}
    </Menu>
  )
}

function RequestActions({ projectId, requestId, name }: { projectId: string; requestId: string; name: string }) {
  const respond = useRespondToJoinRequest(projectId)
  const toast = useToast()
  const answer = (accept: boolean, close: () => void) => {
    close()
    respond.mutate(
      { requestId, accept },
      {
        onSuccess: () => toast(accept ? `${name} joined the project` : `Request from ${name} declined`),
        onError: (error) => toast(getErrorMessage(error)),
      },
    )
  }
  return (
    <Menu trigger={dotsTrigger(`Respond to ${name}`)} className="w-[200px]">
      {(close) => (
        <>
          <MenuItem size="sm" icon={<Check />} onSelect={() => answer(true, close)}>
            Accept
          </MenuItem>
          <MenuItem size="sm" tone="danger" icon={<X />} onSelect={() => answer(false, close)}>
            Decline
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
