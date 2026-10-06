import agricultureIcon from '@/assets/topics/agriculture.svg'
import educationIcon from '@/assets/topics/education.svg'
import sustainabilityIcon from '@/assets/topics/sustainability.svg'
import avatarJemima from '@/assets/mock/avatar-jemima.webp'
import avatarTobi from '@/assets/mock/avatar-tobi.webp'
import event1 from '@/assets/mock/event-1.webp'
import event2 from '@/assets/mock/event-2.webp'
import event3 from '@/assets/mock/event-3.webp'
import forumCover from '@/assets/mock/forum-cover.webp'
import postLaunch from '@/assets/mock/post-launch.webp'
import { ApiError } from '@/lib/api/errors'
import { local } from '@/lib/storage'
import type { Session } from '@/features/auth/types'
import { getDisplayName, getRoleLabel } from '@/features/auth/user'
import type { Author, Comment, CommunityEvent, Post, SearchTopic, TrendingGroup } from '../types'
import type { FeedApi } from './feed.service'

/**
 * In-browser stand-in for the feed backend, seeded with the Figma content.
 * State lives in memory for the tab's lifetime.
 */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

const LAUNCH_POST =
  "🚀 We're excited to announce the launch of our new platform! A space where innovators, researchers, investors, and changemakers can connect, collaborate, and turn bold ideas into meaningful impact. Whether you're looking to join exciting projects, share expertise, discover opportunities, or build solutions that matter, our platform is designed to bring the right people together. This is just the beginning, and we can't wait to see the ideas, partnerships, and innovations that emerge from this community. Join us and let's build the future together. #LaunchDay #Innovation #Collaboration #Research #Technology #Community"

const jemima: Author = { id: 'u-jemima', name: 'Jemima inoske', role: 'Expert', avatarUrl: avatarJemima }
const tobi: Author = { id: 'u-tobi', name: 'Tobi Adeyemi', role: 'Researcher', avatarUrl: avatarTobi }
const amaka: Author = { id: 'u-amaka', name: 'Amaka Obi', role: 'Artisan' }

let posts: Post[] = [
  {
    id: 'p-1',
    author: jemima,
    content: LAUNCH_POST,
    imageUrl: postLaunch,
    createdAt: hoursAgo(10),
    audience: 'everyone',
    likes: 2,
    likedByMe: false,
    commentsCount: 2,
    views: 400_000,
    followingAuthor: false,
    isMine: false,
  },
  {
    id: 'p-2',
    author: tobi,
    content:
      'Our team just finished field-testing a solar-powered garri fryer with cooperatives in Oyo. Fuel costs dropped by 40% and processing time is down by a third. Looking for partners to scale this to more communities! #Agritech #Sustainability',
    createdAt: hoursAgo(26),
    audience: 'everyone',
    likes: 14,
    likedByMe: false,
    commentsCount: 1,
    views: 12_400,
    followingAuthor: true,
    isMine: false,
  },
  {
    id: 'p-3',
    author: amaka,
    content:
      'Hosting a free weekend workshop on product photography for artisans at the Innovation Hub, Lugbe. Bring your crafts and a phone — we will handle the rest. #Artisans #Education',
    createdAt: hoursAgo(50),
    audience: 'everyone',
    likes: 5,
    likedByMe: false,
    commentsCount: 0,
    views: 3_210,
    followingAuthor: false,
    isMine: false,
  },
]

let comments: Comment[] = [
  {
    id: 'c-1',
    postId: 'p-1',
    author: jemima,
    content: LAUNCH_POST,
    imageUrl: postLaunch,
    createdAt: hoursAgo(10),
    likes: 2,
    likedByMe: false,
    repliesCount: 2,
    isMine: false,
  },
  {
    id: 'c-2',
    postId: 'p-1',
    author: tobi,
    content: 'Congratulations to the whole team — this is exactly what the ecosystem needed!',
    createdAt: hoursAgo(4),
    likes: 6,
    likedByMe: false,
    repliesCount: 0,
    isMine: false,
  },
  {
    id: 'c-3',
    postId: 'p-2',
    author: amaka,
    content: 'Would love to see a demo at the next hub meetup.',
    createdAt: hoursAgo(20),
    likes: 1,
    likedByMe: false,
    repliesCount: 0,
    isMine: false,
  },
]

const hiddenPostIds = new Set<string>()
const blockedUserIds = new Set<string>()
const blockedAuthors = new Map<string, Author>()

const trending: TrendingGroup[] = [
  {
    id: 'forums',
    title: 'Trending in Forums',
    href: '/forums',
    topics: [
      {
        id: 't-1',
        title: 'Agricultural Financing in Nigeria: Opportunities and Challenges',
        postsCount: 34,
        coverUrl: forumCover,
      },
      { id: 't-2', title: 'Empowering Nigerian Farmers with Better Financing', postsCount: 34, coverUrl: forumCover },
    ],
  },
  {
    id: 'agriculture',
    title: 'Trending in Agriculture topics',
    href: '/explore?topic=agriculture',
    topics: [
      {
        id: 't-3',
        title: 'Agricultural Financing in Nigeria: Opportunities and Challenges',
        postsCount: 34,
        coverUrl: forumCover,
      },
      { id: 't-4', title: 'Empowering Nigerian Farmers with Better Financing', postsCount: 34, coverUrl: forumCover },
    ],
  },
]

const events: CommunityEvent[] = [event1, event2, event3].map((imageUrl, index) => ({
  id: `ev-${index + 1}`,
  category: 'Hackathon',
  title: 'Innovate Challenge 2026',
  description: 'Solve a 48 hr challenge solution for real problems',
  startsAt: '2026-06-26T09:00:00',
  endsAt: '2026-06-30T17:00:00',
  location: 'Innovation Hub, Lugbe',
  imageUrl,
}))

const searchTopics: SearchTopic[] = [
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Farming, agritech, food security and more',
    iconUrl: agricultureIcon,
    tone: 'green',
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    description: 'Clean energy, climate action, circular economy',
    iconUrl: sustainabilityIcon,
    tone: 'blue',
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Learning, skills, research and development',
    iconUrl: educationIcon,
    tone: 'orange',
  },
]

const TOPIC_KEYWORDS: Record<string, string[]> = {
  agriculture: ['agri', 'farm', 'garri', 'food'],
  sustainability: ['solar', 'climate', 'energy', 'sustainab'],
  education: ['workshop', 'learn', 'education', 'skill'],
}

function me(): Author {
  const user = local.get<Session>('communiti-session')?.user
  return {
    id: user?.id ?? 'me',
    name: user ? getDisplayName(user) : 'You',
    role: user ? getRoleLabel(user) : 'Member',
    avatarUrl: user?.avatarUrl,
  }
}

const visible = (post: Post) => !hiddenPostIds.has(post.id) && !blockedUserIds.has(post.author.id)
const findPost = (id: string) => {
  const post = posts.find((item) => item.id === id)
  if (!post) throw new ApiError('This post is no longer available.', 404)
  return post
}
const updatePost = (id: string, patch: (post: Post) => Partial<Post>) => {
  posts = posts.map((post) => (post.id === id ? { ...post, ...patch(post) } : post))
  return findPost(id)
}
const newest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt)

export const mockFeedApi: FeedApi = {
  async getFeed(tab) {
    await delay()
    return posts
      .filter(visible)
      .filter((post) => tab === 'for-you' || post.followingAuthor || post.isMine)
      .sort(newest)
  },

  async getUserPosts() {
    await delay()
    // Seed one post for the signed-in user so their profile isn't empty.
    if (!posts.some((post) => post.isMine)) {
      posts = [
        { ...posts[0], id: 'p-me', author: me(), createdAt: hoursAgo(10), isMine: true, likes: 2, commentsCount: 2 },
        ...posts,
      ]
    }
    return posts.filter((post) => post.isMine).sort(newest)
  },

  async getPost(id) {
    await delay()
    const post = findPost(id)
    return updatePost(post.id, () => ({ views: post.views + 1 }))
  },

  async createPost({ content, audience, attachments }) {
    await delay()
    const image = attachments.find((file) => file.type.startsWith('image/'))
    const post: Post = {
      id: crypto.randomUUID(),
      author: me(),
      content,
      imageUrl: image ? URL.createObjectURL(image) : undefined,
      createdAt: new Date().toISOString(),
      audience,
      likes: 0,
      likedByMe: false,
      commentsCount: 0,
      views: 0,
      followingAuthor: false,
      isMine: true,
    }
    posts = [post, ...posts]
    return post
  },

  async deletePost(id) {
    await delay()
    posts = posts.filter((post) => post.id !== id)
  },

  async setPostLiked(id, liked) {
    await delay(150)
    return updatePost(id, (post) => ({
      likedByMe: liked,
      likes: post.likes + (liked === post.likedByMe ? 0 : liked ? 1 : -1),
    }))
  },

  async hidePost(id) {
    await delay()
    hiddenPostIds.add(id)
  },

  async reportPost() {
    await delay()
  },

  async blockUser(userId) {
    await delay()
    blockedUserIds.add(userId)
    const author = posts.find((post) => post.author.id === userId)?.author
    if (author) blockedAuthors.set(userId, author)
  },

  async unblockUser(userId) {
    await delay()
    blockedUserIds.delete(userId)
    blockedAuthors.delete(userId)
  },

  async getBlockedUsers() {
    await delay()
    return [...blockedAuthors.values()]
  },

  async setFollowing(userId, following) {
    await delay(150)
    posts = posts.map((post) => (post.author.id === userId ? { ...post, followingAuthor: following } : post))
  },

  async getComments(postId, sort) {
    await delay()
    return comments
      .filter((comment) => comment.postId === postId && !blockedUserIds.has(comment.author.id))
      .sort(sort === 'popular' ? (a, b) => b.likes - a.likes : newest)
  },

  async addComment({ postId, content, attachments }) {
    await delay()
    const image = attachments.find((file) => file.type.startsWith('image/'))
    const comment: Comment = {
      id: crypto.randomUUID(),
      postId,
      author: me(),
      content,
      imageUrl: image ? URL.createObjectURL(image) : undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      repliesCount: 0,
      isMine: true,
    }
    comments = [comment, ...comments]
    updatePost(postId, (post) => ({ commentsCount: post.commentsCount + 1 }))
    return comment
  },

  async deleteComment(id) {
    await delay()
    const comment = comments.find((item) => item.id === id)
    comments = comments.filter((item) => item.id !== id)
    if (comment) updatePost(comment.postId, (post) => ({ commentsCount: Math.max(0, post.commentsCount - 1) }))
  },

  async setCommentLiked(id, liked) {
    await delay(150)
    comments = comments.map((comment) =>
      comment.id === id
        ? { ...comment, likedByMe: liked, likes: comment.likes + (liked === comment.likedByMe ? 0 : liked ? 1 : -1) }
        : comment,
    )
  },

  async reportComment() {
    await delay()
  },

  async getTrending() {
    await delay()
    return trending
  },

  async getEvents() {
    await delay()
    return events
  },

  async getSearchTopics() {
    await delay(150)
    return searchTopics
  },

  async searchPosts({ query, topic }) {
    await delay()
    const q = query.trim().toLowerCase()
    const words = q.split(/\s+/).filter(Boolean)
    const keywords = topic ? (TOPIC_KEYWORDS[topic] ?? [topic]) : []
    return posts
      .filter(visible)
      .filter((post) => {
        const text = `${post.content} ${post.author.name}`.toLowerCase()
        const matchesQuery = words.length === 0 || words.some((word) => text.includes(word))
        const matchesTopic = keywords.length === 0 || keywords.some((word) => text.includes(word))
        return matchesQuery && matchesTopic
      })
      .sort(newest)
  },
}
