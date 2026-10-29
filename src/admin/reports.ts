import type { AdminReport } from '@/lib/api'
import { titleCase } from '@/lib/format'
import type { ReportStatus } from './types'

/** Queue pill from the backend status + outcome (Figma: Pending / Banned / Suspended / …). */
export function reportPill(report: Pick<AdminReport, 'status' | 'outcome'>): ReportStatus {
  if (report.status === 'pending') return 'pending'
  if (report.status === 'dismissed' || report.outcome === 'dismissed') return 'dismissed'
  if (report.outcome === 'blocked' || report.outcome === 'content_removed') return 'banned'
  if (report.outcome === 'suspended') return 'suspended'
  return 'resolved'
}

/** "Spam", "Intellectual property" — reason codes for display. */
export const reasonLabel = (reason: AdminReport['reason']) => titleCase(reason)

/** Who or what was reported: forum / project name, the person, or the content excerpt. */
export const reportSubject = (report: AdminReport) =>
  report.targetName ?? report.targetUser?.fullName ?? report.preview ?? '—'
