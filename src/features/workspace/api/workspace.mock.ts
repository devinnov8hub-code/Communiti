import avatarTerry from '@/assets/mock/avatar-terry.webp'
import avatarTobi from '@/assets/mock/avatar-tobi.webp'
import prototypeBike from '@/assets/mock/prototype-bike.webp'
import member1 from '@/assets/mock/member-1.webp'
import member2 from '@/assets/mock/member-2.webp'
import member3 from '@/assets/mock/member-3.webp'
import member4 from '@/assets/mock/member-4.webp'
import prototypeCad from '@/assets/mock/prototype-cad.webp'
import { ApiError } from '@/lib/api/errors'
import type {
  Evaluation,
  EvaluationSummary,
  LedgerEntry,
  ProjectTask,
  Prototype,
  PrototypeVersion,
  WorkspaceMember,
} from '../types'
import type { WorkspaceApi } from './workspace.service'

/**
 * TEMPORARY — sample data for the workspace tabs that are not connected yet (Prototype, Expert,
 * Ledger, Tasks). The project, members, join requests, notification settings, contracts and
 * research use the backend. Deleted once every tab is connected.
 */

/* ------------------------------ Seed data ------------------------------ */

const mockDelay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

const mockMembers: WorkspaceMember[] = [
  { id: 'm-1', name: 'Maryam Bello', avatarUrl: member1, role: 'Academic' },
  { id: 'm-2', name: 'Ann James', avatarUrl: member2, role: 'Artisan' },
  { id: 'm-3', name: 'Joshua Owoicho', avatarUrl: member3, role: 'Expert' },
  { id: 'm-4', name: 'Annie Okafor', avatarUrl: member4, role: 'Engineer' },
]

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}
const atTime = (daysAgo: number, hours = 11, minutes = 34) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

const you: WorkspaceMember = { id: 'me', name: 'Eunice Micheal', avatarUrl: avatarTerry, role: 'Expert', isYou: true }

const PROTOTYPE_NAMES = [
  'Agro CAD Blueprints',
  'Drone Frame CAD',
  'Spray Nozzle Assembly',
  'Landing Gear',
  'Battery Housing',
  'Camera Gimbal Mount',
]

const VERSION_NAMES = ['Version 1.0', 'Version 1.1', 'Version 1.2', 'Version 2.0', 'Version 2.1', 'Version 2.8']

interface WorkspaceState {
  record: { id: string; title: string }
  prototypes: Prototype[]
  versions: PrototypeVersion[]
  evaluations: Evaluation[]
  ledger: LedgerEntry[]
  tasks: ProjectTask[]
}

const artisans = mockMembers.slice(0, 3)
const annJames = mockMembers[1]
const annie = mockMembers[3]

function seed(record: WorkspaceState['record']): WorkspaceState {
  const prototypes: Prototype[] = PROTOTYPE_NAMES.map((name, index) => ({
    id: `${record.id}-proto-${index + 1}`,
    name,
    thumbnailUrl: prototypeCad,
    createdAt: '2025-05-13T09:00:00.000Z',
    artisans,
  }))

  return {
    record,
    prototypes,
    versions: prototypes.flatMap((prototype) =>
      VERSION_NAMES.map((name, index) => ({
        id: `${prototype.id}-v${index + 1}`,
        prototypeId: prototype.id,
        name,
        thumbnailUrl: prototypeCad,
        imageUrl: prototypeBike,
        editedBy: index === 0 ? annie : annJames,
        updatedAt: hoursAgo(22 + index * 24),
        commentsCount: 12,
      })),
    ),
    evaluations: [
      {
        id: 'ev-1',
        author: { id: 'u-olayinka', name: 'Mrs O. Olayinka', avatarUrl: avatarTerry },
        comment: 'The drone landing gear is not so strong and i do not like the way it comes out at night.',
        target: { kind: 'research', id: `${record.id}-doc-2`, label: 'Drone flight stability Analysis.docx' },
        scores: { feasibility: 5, sustainability: 5, novelty: 4 },
        createdAt: hoursAgo(5),
      },
      {
        id: 'ev-2',
        author: { id: 'u-olayinka-2', name: 'Mr K. Balogun', avatarUrl: avatarTobi },
        comment:
          'Spray coverage is uneven on the outer rows. Worth recalibrating the nozzle angle before the next test.',
        target: { kind: 'research', id: `${record.id}-doc-4`, label: 'Spray nozzle calibration notes.docx' },
        scores: { feasibility: 3, sustainability: 3, novelty: 2 },
        createdAt: hoursAgo(30),
      },
      {
        id: 'ev-3',
        author: { id: 'u-olayinka-3', name: 'Dr A. Nwosu', avatarUrl: avatarTerry },
        comment: 'The frame is solid, but battery endurance needs work before this can cover a full farm.',
        target: {
          kind: 'prototype',
          id: prototypes[0].id,
          label: prototypes[0].name,
          versionId: `${prototypes[0].id}-v2`,
          versionLabel: 'Version 1.1',
        },
        scores: { feasibility: 2, sustainability: 3, novelty: 3 },
        createdAt: hoursAgo(54),
      },
    ],
    ledger: [
      {
        id: 'lg-1',
        kind: 'chat',
        actor: 'Davide',
        action: 'shared an update in the project chat',
        detail: '“The AI model now detects leaf diseases with 97% accuracy”',
        at: atTime(0),
      },
      {
        id: 'lg-2',
        kind: 'research',
        actor: 'Davide',
        action: 'uploaded a research document',
        detail: 'Drone flight stability Analysis.docx',
        at: atTime(0, 10, 12),
      },
      {
        id: 'lg-3',
        kind: 'review',
        actor: 'Charles',
        action: 'left a review on a project',
        detail: 'Drone flight stability Analysis.docx',
        at: atTime(0, 9, 5),
      },
      {
        id: 'lg-4',
        kind: 'prototype',
        actor: 'Fatima',
        action: `uploaded a new prototype to ${record.title}`,
        detail: 'Version 2.8',
        at: atTime(2),
      },
      { id: 'lg-5', kind: 'team', actor: 'Sarah', action: 'Joined the project', at: atTime(2, 9, 40) },
    ],
    tasks: [
      {
        id: 't-1',
        title: 'Expecting insight on Eco-lab',
        description: 'Please inspect the updated version of the Eco-lab website and post an evaluation.',
        dueDate: daysFromNow(0),
        completed: false,
        assignees: mockMembers.slice(0, 2),
      },
      {
        id: 't-2',
        title: 'Expecting insight on Eco-lab',
        description: 'Please inspect the updated version of the Eco-lab website and post an evaluation.',
        dueDate: daysFromNow(-1),
        completed: true,
        assignees: mockMembers.slice(0, 2),
      },
    ],
  }
}

const states = new Map<string, WorkspaceState>()

function state(projectId: string) {
  let current = states.get(projectId)
  if (!current) {
    current = seed({ id: projectId, title: 'the project' })
    states.set(projectId, current)
  }
  return current
}

/** Record an activity in the project ledger. */
function log(current: WorkspaceState, entry: Omit<LedgerEntry, 'id' | 'at' | 'actor'>) {
  current.ledger = [{ id: `lg-${Date.now()}`, actor: 'You', at: new Date().toISOString(), ...entry }, ...current.ledger]
}

const summarize = (evaluations: Evaluation[]): EvaluationSummary => {
  const scores = evaluations.flatMap((evaluation) => Object.values(evaluation.scores))
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
  return { score: Math.round((average / 5) * 1000) / 10, evaluations }
}

function requireItem<T>(item: T | undefined, message = 'That item no longer exists.'): T {
  if (!item) throw new ApiError(message, 404)
  return item
}

/* ------------------------------- Mock API ------------------------------- */

// Reads return copies so in-place edits never leak into the query cache.

export const mockWorkspaceApi: WorkspaceApi = {
  async getPrototypes(projectId) {
    await mockDelay()
    return structuredClone(state(projectId).prototypes)
  },
  async createPrototype(projectId, input) {
    await mockDelay(500)
    const prototype: Prototype = {
      id: `proto-${Date.now()}`,
      name: input.name,
      thumbnailUrl: input.thumbnail ? URL.createObjectURL(input.thumbnail) : prototypeCad,
      createdAt: new Date().toISOString(),
      artisans: [you],
    }
    const current = state(projectId)
    current.prototypes = [prototype, ...current.prototypes]
    return prototype
  },
  async deletePrototype(projectId, prototypeId) {
    await mockDelay()
    const current = state(projectId)
    current.prototypes = current.prototypes.filter((prototype) => prototype.id !== prototypeId)
  },
  async getVersions(projectId, prototypeId) {
    await mockDelay()
    return structuredClone(state(projectId).versions.filter((version) => version.prototypeId === prototypeId))
  },
  async createVersion(projectId, prototypeId, input) {
    await mockDelay(600)
    const imageUrl = input.file.type.startsWith('image/') ? URL.createObjectURL(input.file) : prototypeBike
    const version: PrototypeVersion = {
      id: `ver-${Date.now()}`,
      prototypeId,
      name: input.name,
      thumbnailUrl: imageUrl,
      imageUrl,
      editedBy: you,
      updatedAt: new Date().toISOString(),
      commentsCount: 0,
    }
    const current = state(projectId)
    current.versions = [version, ...current.versions]
    const prototype = current.prototypes.find((item) => item.id === prototypeId)
    log(current, {
      kind: 'prototype',
      action: `uploaded a new version of ${prototype?.name ?? 'a prototype'}`,
      detail: version.name,
    })
    return version
  },
  async commentOnVersion(projectId, versionId) {
    await mockDelay(300)
    const version = requireItem(state(projectId).versions.find((item) => item.id === versionId))
    version.commentsCount += 1
    return { ...version }
  },

  async getEvaluations(projectId) {
    await mockDelay()
    return structuredClone(summarize(state(projectId).evaluations))
  },
  async createEvaluation(projectId, input) {
    await mockDelay(600)
    const current = state(projectId)
    current.evaluations = [
      {
        id: `ev-${Date.now()}`,
        author: { id: you.id, name: you.name, avatarUrl: you.avatarUrl },
        createdAt: new Date().toISOString(),
        ...input,
      },
      ...current.evaluations,
    ]
    log(current, {
      kind: 'review',
      action: 'left a review on a project',
      detail:
        input.target.kind === 'prototype' ? `${input.target.label} · ${input.target.versionLabel}` : input.target.label,
    })
    return summarize(current.evaluations)
  },

  async getLedger(projectId) {
    await mockDelay()
    return structuredClone(state(projectId).ledger)
  },

  async getTasks(projectId) {
    await mockDelay()
    return structuredClone(state(projectId).tasks)
  },
  async createTask(projectId, input) {
    await mockDelay(500)
    const current = state(projectId)
    const assignee = [you, ...mockMembers].find((member) => member.id === input.assigneeId)
    const task: ProjectTask = {
      id: `t-${Date.now()}`,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      completed: false,
      assignees: assignee ? [assignee] : [],
    }
    current.tasks = [task, ...current.tasks]
    return task
  },
  async updateTask(projectId, taskId, patch) {
    await mockDelay(200)
    const task = requireItem(state(projectId).tasks.find((item) => item.id === taskId))
    Object.assign(task, patch)
    return { ...task }
  },
  async deleteTask(projectId, taskId) {
    await mockDelay()
    const current = state(projectId)
    current.tasks = current.tasks.filter((task) => task.id !== taskId)
  },
}
