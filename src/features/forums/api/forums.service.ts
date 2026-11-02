import highlight2 from '@/assets/mock/explore/highlight-2.webp'
import forumTractor from '@/assets/mock/forum-tractor.webp'
import member1 from '@/assets/mock/member-1.webp'
import member2 from '@/assets/mock/member-2.webp'
import member3 from '@/assets/mock/member-3.webp'
import member4 from '@/assets/mock/member-4.webp'
import { postsApi, type Post } from '@/lib/api'
import { ApiError } from '@/lib/api/errors'
import { apiRequest, USE_MOCK_API } from '@/lib/api/legacy'
import type { Forum, ForumPostSort, ForumsTab, NewForum } from '../types'

/** Forums API contract. See README for the endpoint list. */
export interface ForumsApi {
  getForums(tab: ForumsTab): Promise<Forum[]>
  getForum(id: string): Promise<Forum>
  createForum(input: NewForum): Promise<Forum>
  setMembership(id: string, joined: boolean): Promise<Forum>
  setMuted(id: string, muted: boolean): Promise<Forum>
  getForumPosts(id: string, sort: ForumPostSort): Promise<Post[]>
}

const httpForumsApi: ForumsApi = {
  getForums: (tab) => apiRequest(`/forums?scope=${tab}`),
  getForum: (id) => apiRequest(`/forums/${id}`),
  createForum: ({ header, topics, ...fields }) => {
    const form = new FormData()
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    topics.forEach((topic) => form.append('topics', topic))
    if (header) form.append('header', header)
    return apiRequest('/forums', { method: 'POST', body: form })
  },
  setMembership: (id, joined) => apiRequest(`/forums/${id}/membership`, { method: joined ? 'PUT' : 'DELETE' }),
  setMuted: (id, muted) => apiRequest(`/forums/${id}`, { method: 'PATCH', body: { muted } }),
  getForumPosts: (id, sort) => apiRequest(`/forums/${id}/posts?sort=${sort}`),
}

/* ------------------------- Mock (Figma content) ------------------------- */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const members = [member1, member2, member3, member4].map((avatarUrl, index) => ({
  id: `fm-${index + 1}`,
  name: `Member ${index + 1}`,
  avatarUrl,
}))

let forums: Forum[] = [
  {
    id: 'agricultural-technology',
    name: 'Agricultural technology',
    description:
      'Discuss innovative farming practices, AgriTech solutions, sustainable agriculture, and infrastructure that shape the future of food production.',
    createdAt: '2024-03-22',
    topics: [
      { label: 'Agriculture', tone: 'success' },
      { label: 'Ai-driven', tone: 'info' },
      { label: 'Sustainability', tone: 'warning' },
    ],
    coverUrl: forumTractor,
    headerUrl: highlight2,
    membersCount: 122,
    members,
    joined: false,
    isMine: false,
    muted: false,
  },
  {
    id: 'tech-innovators-hub',
    name: 'Tech Innovators Hub',
    description:
      'Explore emerging technologies, share coding tips, collaborate on software projects, and discuss the impact of tech on society.',
    createdAt: '2012-03-01',
    topics: [
      { label: 'Technology', tone: 'success' },
      { label: 'Community-driven', tone: 'info' },
      { label: 'Innovation', tone: 'warning' },
    ],
    coverUrl: forumTractor,
    membersCount: 86,
    members,
    joined: true,
    isMine: false,
    muted: false,
  },
  {
    id: 'creative-arts-collective',
    name: 'Creative Arts Collective',
    description:
      'Share artistic techniques, critique works, discuss cultural trends, and collaborate on projects spanning visual arts, music, and performance.',
    createdAt: '2015-09-01',
    topics: [
      { label: 'Arts & Culture', tone: 'success' },
      { label: 'Artist-led', tone: 'info' },
      { label: 'Expression', tone: 'warning' },
    ],
    coverUrl: forumTractor,
    membersCount: 54,
    members,
    joined: false,
    isMine: true,
    muted: false,
  },
]

const TONES = ['success', 'info', 'warning'] as const

const find = (id: string) => {
  const forum = forums.find((item) => item.id === id)
  if (!forum) throw new ApiError('This forum could not be found.', 404)
  return forum
}
const update = (id: string, patch: Partial<Forum>) => {
  forums = forums.map((item) => (item.id === id ? { ...item, ...patch } : item))
  return find(id)
}

const mockForumsApi: ForumsApi = {
  async getForums(tab) {
    await delay()
    if (tab === 'joined') return forums.filter((forum) => forum.joined)
    if (tab === 'mine') return forums.filter((forum) => forum.isMine)
    return forums
  },
  async getForum(id) {
    await delay()
    return find(id)
  },
  async createForum({ name, topics, about, header }) {
    await delay()
    const forum: Forum = {
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      name,
      description: about,
      createdAt: new Date().toISOString(),
      topics: topics.map((label, index) => ({ label, tone: TONES[index % TONES.length] })),
      coverUrl: header ? URL.createObjectURL(header) : forumTractor,
      membersCount: 1,
      members: [],
      joined: true,
      isMine: true,
      muted: false,
    }
    forums = [forum, ...forums]
    return forum
  },
  async setMembership(id, joined) {
    await delay()
    const forum = find(id)
    return update(id, { joined, membersCount: forum.membersCount + (joined === forum.joined ? 0 : joined ? 1 : -1) })
  },
  async setMuted(id, muted) {
    await delay(150)
    return update(id, { muted })
  },
  async getForumPosts(_id, sort) {
    // These sample forums don't exist on the backend, so they show the home feed.
    const { data: posts } = await postsApi.getFeed({ tab: 'for-you' })
    if (sort === 'popular') return [...posts].sort((a, b) => b.likeCount - a.likeCount)
    if (sort === 'my-posts') return posts.filter((post) => post.isMine)
    if (sort === 'my-replies') return []
    return posts
  },
}

export const forumsApi: ForumsApi = USE_MOCK_API ? mockForumsApi : httpForumsApi
