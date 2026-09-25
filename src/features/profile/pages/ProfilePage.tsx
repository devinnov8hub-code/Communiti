import { GlobeHemisphereWest, LinkSimple, Sparkle } from '@phosphor-icons/react'
import { useState } from 'react'
import { PageColumns } from '@/components/layout/AppShell'
import { EmptyState, useToast } from '@/components/ui'
import { getRoleLabel } from '@/features/auth/user'
import { PostList } from '@/features/feed/components/PostList'
import { RightRail } from '@/features/feed/components/RightRail'
import { SearchHeader } from '@/features/feed/components/SearchHeader'
import { useUserPosts } from '@/features/feed/hooks/queries'
import { ProjectCard } from '@/features/projects/components/ProjectCard'
import { useProjects } from '@/features/projects/hooks/queries'
import { getErrorMessage } from '@/lib/api/client'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import { AboutTab } from '../components/AboutTab'
import { AddExperienceModal } from '../components/AddExperienceModal'
import { AddSkillsModal } from '../components/AddSkillsModal'
import { AvatarUpload } from '../components/AvatarUpload'
import { EditProfileModal } from '../components/EditProfileModal'
import { useMyProfile, useSetOpenToCollaborations, useUpdateProfile } from '../hooks/queries'

type ProfileTab = 'posts' | 'projects' | 'about'
type Sheet = 'edit' | 'skills' | 'experience' | null

const TABS: { value: ProfileTab; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'projects', label: 'Projects' },
  { value: 'about', label: 'About' },
]

/** Current user's profile (Figma "Profile" + "Profile About"). */
export function ProfilePage() {
  const profile = useMyProfile()
  const [tab, setTab] = useState<ProfileTab>('posts')
  const [sheet, setSheet] = useState<Sheet>(null)
  const openToCollab = useSetOpenToCollaborations()
  const updateProfile = useUpdateProfile()
  const toast = useToast()

  return (
    <PageColumns aside={<RightRail />}>
      <SearchHeader />
      {profile.isPending ? (
        <div className="h-[420px] animate-pulse bg-surface" />
      ) : profile.isError ? (
        <EmptyState title="Couldn’t load your profile" description={getErrorMessage(profile.error)} />
      ) : (
        <div className="flex flex-col items-center gap-gap-sm">
          <section className="flex w-full flex-col">
            <div className="-mb-[60px] h-[127px] w-full bg-brand-orange-tint">
              {profile.data.coverUrl && <img src={profile.data.coverUrl} alt="" className="size-full object-cover" />}
            </div>
            <div className="flex flex-col items-center gap-gap-sm px-4 sm:px-5">
              <AvatarUpload
                src={profile.data.avatarUrl}
                name={profile.data.name}
                onSelect={(avatar) =>
                  updateProfile.mutate(
                    { name: profile.data.name, role: profile.data.role, profession: profile.data.profession, avatar },
                    {
                      onSuccess: () => toast('Profile photo updated'),
                      onError: (error) => toast(getErrorMessage(error)),
                    },
                  )
                }
              />
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <h1 className="text-h3 font-semibold text-fg">{profile.data.name}</h1>
                <p className="flex items-center gap-2 text-body-m">
                  <span className="font-semibold text-brand-orange">{getRoleLabel(profile.data)}</span>
                  <span className="text-grey-50 dark:text-grey-30">{profile.data.profession}</span>
                </p>
                <p className="text-caption font-semibold text-brand-green">
                  {profile.data.collaborations} collaborations
                </p>
                <p className="max-w-[560px] text-body-s text-fg-muted">{profile.data.bio}</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-body-s text-fg-muted">
                  <span className="flex items-center gap-[7px]">
                    <GlobeHemisphereWest aria-hidden className="size-[18px]" />
                    {profile.data.location}
                  </span>
                  {profile.data.website && (
                    <a
                      href={`https://${profile.data.website.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-[7px] text-info-strong hover:underline"
                    >
                      <LinkSimple aria-hidden className="size-[18px]" />
                      {profile.data.website}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <p className="flex items-center gap-1">
                  <span className="text-body-s text-brand-green">{formatCount(profile.data.following)}</span>
                  <span className="text-caption text-fg-muted">Following</span>
                </p>
                <p className="flex items-center gap-1">
                  <span className="text-body-s text-brand-green">{formatCount(profile.data.followers)}</span>
                  <span className="text-caption text-fg-muted">followers</span>
                </p>
              </div>
              <div className="flex w-full gap-3.5">
                <button
                  type="button"
                  aria-pressed={profile.data.openToCollaborations}
                  disabled={openToCollab.isPending}
                  onClick={() =>
                    openToCollab.mutate(!profile.data.openToCollaborations, {
                      onSuccess: (updated) =>
                        toast(
                          updated.openToCollaborations
                            ? 'You’re open to collaborations'
                            : 'You’re no longer open to collaborations',
                        ),
                      onError: (error) => toast(getErrorMessage(error)),
                    })
                  }
                  className={cn(
                    'flex h-[38px] flex-1 items-center justify-center gap-[3px] rounded-full px-5 py-2.5 text-caption transition',
                    profile.data.openToCollaborations
                      ? 'bg-[linear-gradient(-30deg,var(--color-brand-green)_15%,#ffffff_238%)] text-white'
                      : 'border border-border-default text-fg-muted',
                  )}
                >
                  <Sparkle aria-hidden className="size-[18px]" />
                  {profile.data.openToCollaborations ? 'Open to Collaborations' : 'Not open to collaborations'}
                </button>
                <button
                  type="button"
                  onClick={() => setSheet('edit')}
                  className="h-[38px] flex-1 rounded-full bg-brand-orange px-5 text-body-l text-white hover:brightness-95"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          <div className="flex w-full flex-col gap-px">
            <div role="tablist" aria-label="Profile" className="flex justify-center gap-3.5 border-b border-hairline">
              {TABS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.value}
                  onClick={() => setTab(item.value)}
                  className={cn(
                    'w-[95px] border-b-3 px-2 py-[5px] text-body-m text-fg-muted transition-colors',
                    tab === item.value ? 'border-brand-green text-fg' : 'border-transparent hover:text-fg',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {tab === 'posts' && <MyPosts />}
            {tab === 'projects' && <MyProjects />}
            {tab === 'about' && (
              <AboutTab
                profile={profile.data}
                onEditSkills={() => setSheet('skills')}
                onAddExperience={() => setSheet('experience')}
              />
            )}
          </div>

          {sheet === 'edit' && <EditProfileModal profile={profile.data} onClose={() => setSheet(null)} />}
          {sheet === 'skills' && <AddSkillsModal initial={profile.data.skills} onClose={() => setSheet(null)} />}
          {sheet === 'experience' && <AddExperienceModal onClose={() => setSheet(null)} />}
        </div>
      )}
    </PageColumns>
  )
}

function MyPosts() {
  const posts = useUserPosts('me')
  return (
    <PostList
      posts={posts.data}
      isPending={posts.isPending}
      error={posts.error}
      onRetry={() => posts.refetch()}
      empty={{ title: 'No posts yet', description: 'Share an update from the Home feed.' }}
    />
  )
}

function MyProjects() {
  const projects = useProjects('mine')
  if (projects.isPending) return <div className="h-[300px] animate-pulse bg-surface" />
  if (!projects.data?.length) return <EmptyState title="No projects yet" />
  return (
    <div className="flex flex-col gap-3">
      {projects.data.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
