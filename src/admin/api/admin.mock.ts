import avatarJemima from '@/assets/mock/avatar-jemima.webp'
import avatarTerry from '@/assets/mock/avatar-terry.webp'
import eventCard from '@/assets/mock/explore/event-card.webp'
import eventHero from '@/assets/mock/explore/event-hero.webp'
import highlightHero from '@/assets/mock/explore/highlight-hero.webp'
import organizerLogo from '@/assets/mock/explore/organizer.webp'
import member1 from '@/assets/mock/member-1.webp'
import member2 from '@/assets/mock/member-2.webp'
import member3 from '@/assets/mock/member-3.webp'
import member4 from '@/assets/mock/member-4.webp'
import { ApiError } from '@/lib/api/errors'
import type {
  AdminEvent,
  AdminInboxItem,
  AdminLog,
  AdminProjectRow,
  AdminUser,
  HighlightGroup,
  ModerationAction,
  Page,
  RecordAction,
  RecordStatus,
  Report,
  ReportedContent,
  ReportFilter,
  StatCardData,
} from '../types'
import type { AdminApi, ListQuery } from './admin.service'

/* ------------------------------- Seed data ------------------------------ */

const PAGE_SIZE = 7 // rows per queue / table page, as in Figma
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))
const STAMP = '2024-10-15T12:30:22'

let admin: AdminUser = {
  id: 'admin-1',
  firstName: 'Terry',
  lastName: 'Jamerson',
  email: 'admin@communiti.com',
  phone: '',
  avatarUrl: avatarTerry,
}

const members = [member1, member2, member3, member4].map((avatarUrl, index) => ({
  id: `m-${index + 1}`,
  name: `Member ${index + 1}`,
  avatarUrl,
}))

const POST_TEXT =
  "🚀 We're excited to announce the launch of our new platform! A space where innovators, researchers, investors, and changemakers can connect, collaborate, and turn bold ideas into meaningful impact. Whether you're looking to join exciting projects, share expertise, discover opportunities, or build solutions that matter, our platform is designed to bring the right people together."
const GROUP_ABOUT =
  "Discover a space designed for open dialogue, knowledge sharing, and collaboration. Whether you're seeking advice, exploring new ideas, discussing industry trends, or showcasing your expertise, the Forum provides an opportunity to connect with a diverse community dedicated to learning and innovation."
const FOCUS: { label: string; tone: 'success' | 'info' | 'warning' }[] = [
  { label: 'Agriculture', tone: 'success' },
  { label: 'Ai-driven', tone: 'info' },
  { label: 'Sustainability', tone: 'warning' },
]

const postContent = (name: string, kind: 'post' | 'user' = 'post'): ReportedContent => ({
  kind,
  author: { name, role: 'Expert', avatarUrl: avatarJemima },
  postedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  text: POST_TEXT,
  likes: 2,
  comments: 2,
})
const groupContent = (kind: 'forum' | 'project', title: string): ReportedContent => ({
  kind,
  title,
  owner: kind === 'project' ? 'Dr joseph feranmi' : undefined,
  membersCount: 122,
  members,
  focus: FOCUS,
  about: GROUP_ABOUT,
})

let reportNumber = 2341
function report(
  section: Report['section'],
  subject: string,
  type: Report['type'],
  reason: string,
  status: Report['status'],
  content: ReportedContent,
): Report {
  const number = reportNumber++
  return {
    id: `rp-${number}`,
    number,
    section,
    subject,
    type,
    reason,
    status,
    reportsCount: 6,
    previousReports: 8,
    previousWarnings: 6,
    accountStatus: status === 'banned' || status === 'suspended' ? 'Suspended' : 'Active',
    content,
    createdAt: new Date(Date.now() - number * 60_000).toISOString(),
  }
}

const CONTENT_QUEUE: [string, Report['type'], string, Report['status']][] = [
  ['John', 'Post', 'Spam', 'pending'],
  ['Elvis', 'Project', 'Spam', 'pending'],
  ['Damian Jubilee', 'Post', 'Spam', 'banned'],
  ['Adeolu Projects limited', 'Forum', 'Spam', 'banned'],
  ['Joshua', 'Post', 'Insults', 'banned'],
  ['Chiamaka', 'Post', 'Spam', 'pending'],
  ['Favour', 'Post', 'Spam', 'pending'],
]
const USER_QUEUE: [string, Report['status']][] = [
  ['Jemima inoske', 'suspended'],
  ['Solar Pulse', 'suspended'],
  ['Aqua Nexus', 'pending'],
  ['NeuroLink', 'suspended'],
  ['EcoGrid', 'suspended'],
  ['Quantum Bloom', 'suspended'],
  ['BioSynth', 'pending'],
  ['SkyForge', 'pending'],
]
const GROUP_QUEUE: [string, Report['status']][] = [
  ['Crypto Holders', 'suspended'],
  ['Crypto Bros', 'pending'],
  ['Adelabu Investments', 'suspended'],
  ['Adelabu Investments II', 'suspended'],
  ['Chukwudifu arrangements', 'suspended'],
  ['Real Housing', 'pending'],
  ['Agric Investments', 'pending'],
]
const PROJECT_QUEUE: [string, Report['status']][] = [
  ['Aurora', 'pending'],
  ['Nebula', 'pending'],
  ['Orion', 'suspended'],
  ['Zephyr', 'suspended'],
  ['Vortex', 'suspended'],
  ['Eclipse', 'pending'],
  ['Solstice', 'pending'],
]

let reports: Report[] = [
  ...CONTENT_QUEUE.map(([subject, type, reason, status]) =>
    report(
      type === 'Forum' ? 'forums' : type === 'Project' ? 'projects' : 'users',
      subject,
      type,
      reason,
      status,
      type === 'Post' ? postContent('Jemima inoske') : groupContent(type === 'Forum' ? 'forum' : 'project', subject),
    ),
  ),
  ...USER_QUEUE.map(([subject, status]) =>
    report('users', subject, 'User', 'Scam', status, postContent(subject, 'user')),
  ),
  ...GROUP_QUEUE.map(([subject, status]) =>
    report('forums', subject, 'Forum', 'Scam', status, groupContent('forum', subject)),
  ),
  ...PROJECT_QUEUE.map(([subject, status]) =>
    report('projects', subject, 'Project', 'Scam', status, groupContent('project', 'Agricultural drone')),
  ),
]

const PROJECT_NAMES = [
  'Smart Agriculture',
  'Renewable Energy',
  'HealthTech Innovation',
  'Agricultural Drone',
  'Water Watch',
]
let projects: AdminProjectRow[] = Array.from({ length: 31 }, (_, index) => ({
  id: ['a7f3b9d2', '4c2e1f8b', '9d3a7e6c'][index] ?? Math.random().toString(16).slice(2, 10),
  name: PROJECT_NAMES[index % PROJECT_NAMES.length],
  creator: ['David beckham', 'elvis troy', 'chimdi ebube'][index % 3],
  members: [32, 12, 2][index % 3],
  reports: [3, 0, 2][index % 3],
  createdAt: STAMP,
  status: (['warned', 'active', 'suspended'] as const)[index % 3],
}))

const ABOUT =
  "Innovate Challenge 2026 is a 48-hour hackathon that brings together innovators, developers, designers, entrepreneurs, and problem-solvers to collaborate on real-world challenges. Participants will work in teams to develop creative solutions, receive guidance from experienced mentors, expand their professional networks, and showcase their ideas to a panel of judges. Whether you're an experienced innovator or just getting started, this event offers a unique opportunity to learn, collaborate, and turn bold ideas into impactful solutions."

let events: AdminEvent[] = Array.from({ length: 10 }, (_, index) => ({
  id: `aev-${index + 1}`,
  category: 'Hackathon',
  title: 'Innovate Challenge 2026',
  summary: 'Solve a 48 hr challenge solution for real problems',
  about: ABOUT,
  startsAt: index < 5 ? '2026-11-26T09:00:00' : '2025-06-26T09:00:00',
  endsAt: index < 5 ? '2026-11-30T17:00:00' : '2025-06-30T17:00:00',
  location: 'Innovation Hub, Lugbe',
  fullLocation: 'Innovation Hub, Lugbe, Abuja',
  imageUrl: eventCard,
  coverUrl: eventHero,
  organizer: { name: 'Innovation Hub', subtitle: 'Creative Media', logoUrl: organizerLogo },
  status: index < 5 ? 'upcoming' : 'concluded',
  registered: false,
}))

const highlightImages = Object.entries(
  import.meta.glob<string>('@/assets/mock/explore/highlight-*.webp', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => Number(a.match(/(\d+)\.webp$/)?.[1]) - Number(b.match(/(\d+)\.webp$/)?.[1]))
  .map(([, url]) => url)

const photo = (groupId: string, url: string, index: number) => ({
  id: `${groupId}-p${index}`,
  title: 'Research for impact',
  imageUrl: url,
})
let highlightGroups: HighlightGroup[] = [
  { id: 'tetfair-2025', title: 'Tetfair 2025', images: highlightImages.slice(0, 8) },
  { id: 'r4i-2025', title: 'R4i 2025 pt II', images: highlightImages.slice(6, 15) },
  { id: 'tetfair-2026', title: 'Tetfair 2026', images: [highlightHero, ...highlightImages.slice(2, 9)] },
].map(({ id, title, images }) => {
  const photos = images.map((url, index) => photo(id, url, index))
  return { id, title, cover: photos[0], images: photos }
})

let inbox: AdminInboxItem[] = [
  { id: 'in-1', title: 'Admin', message: 'Admin logged into account', at: '2026-09-29T11:43:00', read: false },
  { id: 'in-2', title: 'Admin', message: 'Admin logged into account', at: '2026-09-29T11:43:00', read: false },
]

const LOG_ROWS: [string, string][] = [
  ['User login successful', 'User permissions updated successfully'],
  ['Password changed', 'Scheduled maintenance completed'],
  ['New user account created', 'Info'],
  ['User permissions updated', 'New administrator account created'],
  ['Failed login attempt', 'New administrator account created'],
  ['Database backup completed', 'Password reset request approved'],
  ['Configuration file modified', 'New administrator account created'],
  ['Email notification sent', 'Password reset request approved'],
  ['User account locked', 'System configuration saved'],
  ['API key generated', 'System configuration saved'],
  ['Security settings updated', 'System configuration saved'],
  ['Data export initiated', 'System configuration saved'],
  ['Scheduled task executed', 'Failed login attempt detected'],
  ['System error logged', 'System configuration saved'],
  ['Server restarted', 'Failed login attempt detected'],
]
let logs: AdminLog[] = Array.from({ length: 45 }, (_, index) => {
  const [action, message] = LOG_ROWS[index % LOG_ROWS.length]
  return { id: `log-${index + 1}`, action, at: STAMP, message }
})

function log(action: string, message: string) {
  logs = [{ id: `log-${Date.now()}`, action, at: new Date().toISOString(), message }, ...logs]
}

/* -------------------------------- Helpers ------------------------------- */

function paginate<T>(items: T[], { page }: ListQuery, pageSize = PAGE_SIZE): Page<T> {
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}

const matches = (value: string, search?: string) => !search || value.toLowerCase().includes(search.toLowerCase())

const stat = (id: string, label: string, caption: string, value: number, tone: StatCardData['tone']): StatCardData => ({
  id,
  label,
  caption,
  value,
  change: 24,
  tone,
})

const REVIEWED: Report['status'][] = ['banned', 'suspended', 'resolved']

function filterReports(filter: ReportFilter) {
  return (item: Report) =>
    filter === 'all' ||
    (filter === 'pending' && item.status === 'pending') ||
    (filter === 'reviewed' && REVIEWED.includes(item.status)) ||
    (filter === 'dismissed' && item.status === 'dismissed')
}

const ACTION_RESULT: Record<ModerationAction, Report['status']> = {
  dismiss: 'dismissed',
  'remove-content': 'resolved',
  warn: 'resolved',
  'suspend-user': 'suspended',
  'block-user': 'banned',
  'suspend-group': 'suspended',
  'delete-group': 'banned',
}

const RECORD_RESULT: Record<RecordAction, RecordStatus> = {
  activate: 'active',
  restrict: 'restricted',
  warn: 'warned',
  suspend: 'suspended',
}

/* -------------------------------- Mock API ------------------------------ */

export const mockAdminApi: AdminApi = {
  async login(email, password) {
    await delay(600)
    if (!email.includes('@')) throw new ApiError('Enter a valid admin email', 422)
    if (password.length < 6) throw new ApiError('Incorrect email or password', 401)
    admin = { ...admin, email }
    log('User login successful', `${email} signed in`)
    return { token: 'mock-admin-token', admin }
  },
  async requestPasswordReset() {
    await delay(500)
  },
  async verifyResetCode(_email, code) {
    await delay(500)
    if (!/^\d{5}$/.test(code)) throw new ApiError('That code is not valid', 422)
    return { resetToken: 'mock-reset-token' }
  },
  async setNewPassword() {
    await delay(500)
    log('Password changed', 'Password reset request approved')
  },
  async updateProfile({ avatar, ...fields }) {
    await delay(500)
    admin = {
      ...admin,
      ...fields,
      avatarUrl: avatar === null ? undefined : avatar ? URL.createObjectURL(avatar) : admin.avatarUrl,
    }
    log('Profile updated', 'Administrator profile saved')
    return admin
  },
  async changePassword(oldPassword) {
    await delay(500)
    if (oldPassword.length < 6) throw new ApiError('Your old password is incorrect', 422)
    log('Password changed', 'Administrator password updated')
  },

  async getSectionDashboard(section) {
    await delay()
    const queue = reports.filter((item) => item.section === section && item.type !== 'Post').slice(0, 7)
    return {
      stats: [
        stat('total', 'Total', 'Created projects', projects.length * 7 + 22, 'violet'),
        stat('active', 'Active', 'Last 30 days', 209, 'green'),
      ],
      activity: [],
      distribution: [
        { label: 'Featured', value: 11.2, tone: 'blue' },
        { label: 'In Development', value: 52.1, tone: 'orange' },
        { label: 'Inactive', value: 22.8, tone: 'grey' },
        { label: 'Completed', value: 13.9, tone: 'green' },
      ],
      queue,
    }
  },

  async getReports(section, filter, query) {
    await delay()
    const inSection = section === 'overview' ? reports : reports.filter((item) => item.section === section)
    return paginate(
      inSection.filter(filterReports(filter)).filter((item) => matches(item.subject, query.search)),
      query,
    )
  },
  async moderate(reportId, action) {
    await delay(500)
    const target = reports.find((item) => item.id === reportId)
    if (!target) throw new ApiError('This report no longer exists.', 404)
    const updated: Report = {
      ...target,
      status: ACTION_RESULT[action],
      previousWarnings: target.previousWarnings + (action === 'warn' ? 1 : 0),
      accountStatus:
        action === 'block-user' ? 'Blocked' : action.startsWith('suspend') ? 'Suspended' : target.accountStatus,
    }
    reports = reports.map((item) => (item.id === reportId ? updated : item))
    log('Moderation action', `Report #${target.number}: ${action.replace('-', ' ')}`)
    return updated
  },

  async getProjects(query) {
    await delay()
    return paginate(
      projects.filter((row) => matches(`${row.name} ${row.creator}`, query.search)),
      query,
    )
  },
  async updateRecord(kind, id, action) {
    await delay(400)
    const status = RECORD_RESULT[action]
    if (kind === 'projects') projects = projects.map((row) => (row.id === id ? { ...row, status } : row))
    log('Status updated', `${kind.slice(0, -1)} ${id} set to ${status}`)
  },

  async getEvents() {
    await delay()
    return events
  },
  async getEvent(id) {
    await delay()
    const event = events.find((item) => item.id === id)
    if (!event) throw new ApiError('This event no longer exists.', 404)
    return event
  },
  async createEvent({ cover, ...input }) {
    await delay(600)
    const imageUrl = cover ? URL.createObjectURL(cover) : eventCard
    const event: AdminEvent = {
      id: `aev-${Date.now()}`,
      category: input.category,
      title: input.title,
      summary: input.about.slice(0, 60),
      about: input.about,
      startsAt: `${input.startsAt}T09:00:00`,
      endsAt: `${input.endsAt}T17:00:00`,
      location: input.location || 'Online',
      fullLocation: input.location || 'Online',
      imageUrl,
      coverUrl: cover ? imageUrl : eventHero,
      organizer: { name: input.organizer, subtitle: 'Organizer', logoUrl: organizerLogo },
      status: new Date(input.endsAt) >= new Date() ? 'upcoming' : 'concluded',
      registered: false,
    }
    events = [event, ...events]
    log('Event created', event.title)
    return event
  },
  async deleteEvent(id) {
    await delay()
    events = events.filter((item) => item.id !== id)
    log('Event deleted', id)
  },

  async getHighlightGroups() {
    await delay()
    return highlightGroups
  },
  async getHighlightGroup(id) {
    await delay()
    const group = highlightGroups.find((item) => item.id === id)
    if (!group) throw new ApiError('These highlights no longer exist.', 404)
    return group
  },
  async createHighlightGroup({ title, eventId, images }) {
    await delay(700)
    const id = `hg-${Date.now()}`
    const event = events.find((item) => item.id === eventId)
    const photos = images.map((file, index) => photo(id, URL.createObjectURL(file), index))
    const group: HighlightGroup = { id, title: title || event?.title || 'Highlights', cover: photos[0], images: photos }
    highlightGroups = [group, ...highlightGroups]
    log('Highlights added', group.title)
    return group
  },
  async deleteHighlightGroup(id) {
    await delay()
    highlightGroups = highlightGroups.filter((item) => item.id !== id)
  },

  async sendNotification(input) {
    await delay(600)
    log('Email notification sent', `“${input.title}” sent to ${input.audience}`)
  },
  async getInbox() {
    await delay(200)
    return inbox
  },
  async markInboxRead() {
    await delay(200)
    inbox = inbox.map((item) => ({ ...item, read: true }))
  },

  async getLogs(query) {
    await delay()
    // The Logs page lists 15 rows per page in Figma.
    return paginate(
      logs.filter((row) => matches(`${row.action} ${row.message}`, query.search)),
      query,
      15,
    )
  },
}
