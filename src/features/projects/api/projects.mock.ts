import member1 from '@/assets/mock/member-1.webp'
import member2 from '@/assets/mock/member-2.webp'
import member3 from '@/assets/mock/member-3.webp'
import member4 from '@/assets/mock/member-4.webp'
import projectFarm from '@/assets/mock/project-farm.webp'
import projectVideo from '@/assets/mock/project-video.webp'
import type { Membership, WorkspaceMember } from '@/features/workspace/types'
import type { Project, ProjectRole } from '../types'

/**
 * In-browser project store shared by the Projects list and the project workspace
 * mocks, seeded with the Figma content. Replaced by the API when a backend is configured.
 */
export interface ProjectRecord extends Omit<Project, 'isMine' | 'members'> {
  members: WorkspaceMember[]
  pitch: string
  problem: string
  solution: string
  impact: string
  videoPosterUrl?: string
  rolesNeeded: ProjectRole[]
  membership: Membership
  acceptRequests: boolean
  conversationId?: string
  createdAt: string
}

export const mockMembers: WorkspaceMember[] = [
  { id: 'm-1', name: 'Maryam Bello', avatarUrl: member1, role: 'Academic' },
  { id: 'm-2', name: 'Ann James', avatarUrl: member2, role: 'Artisan' },
  { id: 'm-3', name: 'Joshua Owoicho', avatarUrl: member3, role: 'Expert' },
  { id: 'm-4', name: 'Annie Okafor', avatarUrl: member4, role: 'Engineer' },
]

const DRONE = {
  pitch:
    'Our agro-drone system transforms farming with AI-driven insights, enabling precise crop management to boost yields and sustainability. This technology paves the way for a more sustainable future in agriculture.',
  problem:
    'Without drones, farmers face challenges in efficiently monitoring large fields for crop health, pests, and diseases, and applying pesticides or fertilizers with the precision needed to reduce waste and chemical runoff.',
  solution:
    "Our Agri-Drone System uses scout drones with AI to pinpoint crop health issues and create precise 'prescription maps.' Application drones then use these maps to apply treatments only where needed, cutting waste and increasing efficiency.",
  impact:
    "This technology's impact is twofold: it significantly boosts agricultural efficiency and yield by enabling precision farming, while reducing the environmental footprint by minimizing the wasteful use of water, fertilizers, and pesticides.",
}

export const projectRecords: ProjectRecord[] = [
  {
    id: 'pr-1',
    title: 'Agricultural Drone',
    owner: { id: 'u-joseph', name: 'Dr joseph feranmi' },
    status: 'in-progress',
    tags: [
      { label: 'Agriculture', tone: 'success' },
      { label: 'Ai-driven', tone: 'info' },
      { label: 'Sustainability', tone: 'warning' },
    ],
    description: DRONE.pitch,
    coverUrl: projectFarm,
    videoPosterUrl: projectVideo,
    membersCount: 12,
    members: mockMembers,
    ...DRONE,
    rolesNeeded: ['artisan', 'academic', 'expert'],
    // The signed-in user administers this project, so every workspace screen is reachable.
    membership: 'admin',
    acceptRequests: true,
    conversationId: 'c-drone',
    createdAt: '2026-05-13T09:00:00.000Z',
  },
  {
    id: 'pr-2',
    title: 'Solar Cold Storage for Farmers',
    owner: { id: 'u-tobi', name: 'Tobi Adeyemi' },
    status: 'open',
    tags: [
      { label: 'Agriculture', tone: 'success' },
      { label: 'Clean energy', tone: 'warning' },
    ],
    description:
      'Solar-powered cold rooms that help smallholder farmers cut post-harvest losses and sell produce at better prices.',
    coverUrl: projectFarm,
    videoPosterUrl: projectVideo,
    membersCount: 8,
    members: mockMembers.slice(1),
    pitch:
      'Solar-powered cold rooms that help smallholder farmers cut post-harvest losses and sell produce at better prices.',
    problem:
      'Up to 40% of fresh produce spoils before it reaches the market because farmers have no reliable, affordable way to keep it cool.',
    solution:
      'Modular cold rooms run on solar power with battery backup, rented to farmer cooperatives on a pay-per-crate model.',
    impact: 'Less food waste, higher incomes for farmers and more stable food prices, without adding load to the grid.',
    rolesNeeded: ['artisan', 'expert'],
    // Not joined yet — shows the "Join Project" → Accept Terms → request-sent flow.
    membership: 'none',
    acceptRequests: true,
    createdAt: '2026-06-02T09:00:00.000Z',
  },
]

export const findProjectRecord = (id: string) => projectRecords.find((project) => project.id === id)

export const toProject = (record: ProjectRecord): Project => ({
  id: record.id,
  title: record.title,
  owner: record.owner,
  status: record.status,
  tags: record.tags,
  description: record.description,
  coverUrl: record.coverUrl,
  membersCount: record.membersCount,
  members: record.members,
  isMine: record.membership === 'member' || record.membership === 'admin',
})

export const mockDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
