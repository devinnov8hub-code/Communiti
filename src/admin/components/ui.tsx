import {
  CalendarBlank,
  CalendarCheck,
  CalendarDots,
  CaretDown,
  ChatsCircle,
  Flag,
  Folder,
  MagnifyingGlass,
  Prohibit,
  TrendUp,
  UserCheck,
  UserPlus,
  Users,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import { DATE_RANGES, type DateRange, type RecordStatus, type ReportStatus, type StatCardData } from '../types'

/** Content area under the admin top bar. */
export function AdminContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-gap-md px-4 pt-4 pb-10 sm:px-5 lg:px-[21px]', className)}>{children}</div>
  )
}

/** White rounded card (Figma dashboard panels). */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  // min-w-0 lets panels shrink inside dashboard grids on phones.
  return <section className={cn('min-w-0 rounded-modal bg-surface-raised', className)}>{children}</section>
}

export function PanelHeader({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 p-2.5', className)}>
      <h2 className="text-h4 font-semibold text-fg">{title}</h2>
      {action}
    </div>
  )
}

export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-body-m font-semibold text-brand-orange hover:underline">
      {children}
    </Link>
  )
}

/** "Overview / Moderation queue" trail. */
export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-body-l text-fg-muted">
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <span aria-hidden> / </span>}
          {item.to ? (
            <Link to={item.to} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-fg">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

/* -------------------------------- Stats --------------------------------- */

const TONES: Record<StatCardData['tone'], string> = {
  orange: 'bg-brand-orange-tint text-brand-orange',
  green: 'bg-stat-green-tint text-stat-green',
  indigo: 'bg-stat-indigo-tint text-stat-indigo',
  violet: 'bg-stat-violet-tint text-stat-violet',
  red: 'bg-error-tint text-error',
  grey: 'bg-grey-30/50 text-grey-40',
  blue: 'bg-info-tint text-info-strong',
}

/** Icon per stat id, falling back to the tone's default. */
const ICONS: Record<string, Icon> = {
  users: Users,
  events: CalendarCheck,
  forums: ChatsCircle,
  projects: Folder,
  active: UserCheck,
  new: UserPlus,
  blocked: Prohibit,
  restricted: Prohibit,
  flagged: Flag,
  concluded: CalendarBlank,
  upcoming: CalendarDots,
}

/** Row of stat cards; `icons` maps stat ids to icons for pages whose ids overlap (e.g. "total"). */
export function StatGrid({ stats, icons }: { stats: StatCardData[]; icons?: Record<string, Icon> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-[28px]">
      {stats.map((item) => (
        <StatCard key={item.id} stat={item} icon={icons?.[item.id] ?? ICONS[item.id] ?? UsersThree} />
      ))}
    </div>
  )
}

function StatCard({ stat, icon: StatIcon }: { stat: StatCardData; icon: Icon }) {
  return (
    <article className="flex flex-col gap-gap-xl rounded-modal bg-surface-raised px-5 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-[7px]">
          <h3 className="truncate text-body-l font-semibold text-fg">{stat.label}</h3>
          <p className="truncate text-body-s text-fg-muted">{stat.caption}</p>
        </div>
        <span className={cn('flex size-[31px] shrink-0 items-center justify-center rounded-full', TONES[stat.tone])}>
          <StatIcon aria-hidden className="size-3.5" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[28px] leading-none font-bold text-fg">{formatCount(stat.value)}</p>
        <p className="flex items-center gap-[7px] text-caption text-brand-green">
          <TrendUp aria-hidden className="size-[18px]" />
          {stat.change > 0 ? '+' : ''}
          {stat.change}%<span className="sr-only"> vs previous period</span>
        </p>
      </div>
    </article>
  )
}

/** "📅 Last 30 days ⌄" selector (Figma "Date Selector Container"). */
export function DateRangeSelect({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) {
  return (
    <label className="relative flex items-center self-end rounded-control border border-hairline bg-surface-raised dark:border-border-default">
      <span className="pointer-events-none flex items-center gap-3 border-r border-hairline p-2 dark:border-border-default">
        <CalendarDots aria-hidden className="size-7 text-fg" />
        <span className="text-body-m text-fg">{DATE_RANGES.find((range) => range.value === value)?.label}</span>
      </span>
      <CaretDown aria-hidden className="pointer-events-none mx-2.5 size-7 text-fg-muted" />
      <select
        aria-label="Date range"
        value={value}
        onChange={(event) => onChange(event.target.value as DateRange)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {DATE_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------------------------- Status indicators --------------------------- */

const REPORT_STATUS: Record<ReportStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'border-warning bg-warning-wash text-warning dark:bg-warning/10' },
  banned: { label: 'Banned', className: 'border-error bg-error-wash text-error dark:bg-error/10' },
  suspended: { label: 'Suspended', className: 'border-error bg-error-wash text-error dark:bg-error/10' },
  dismissed: { label: 'Dismissed', className: 'border-grey-40 bg-offwhite text-grey-40 dark:bg-grey-40/10' },
  resolved: { label: 'Resolved', className: 'border-success bg-success-tint text-success dark:bg-success/10' },
}

/** Outlined queue status pill (Figma "Pending" / "Banned"). */
export function ReportStatusPill({ status, size = 'sm' }: { status: ReportStatus; size?: 'xs' | 'sm' | 'md' }) {
  const { label, className } = REPORT_STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border whitespace-nowrap',
        size === 'xs' && 'px-[21px] py-1.5 text-xs',
        size === 'sm' && 'min-w-[77px] px-3.5 py-1 text-caption',
        size === 'md' && 'px-[21px] py-1.5 text-body-s',
        className,
      )}
    >
      {label}
    </span>
  )
}

const RECORD_STATUS: Record<RecordStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-brand-green-tint text-success dark:bg-success/15 dark:text-brand-green' },
  restricted: { label: 'Restricted', className: 'bg-error-tint text-error dark:bg-error/15' },
  flagged: { label: 'Flagged', className: 'bg-brand-orange-tint text-warning dark:bg-warning/15' },
  warned: { label: 'Warned', className: 'bg-brand-orange-tint text-warning dark:bg-warning/15' },
  suspended: { label: 'Suspended', className: 'bg-error-tint text-error dark:bg-error/15' },
}

/** Filled record status (Figma "Status": Active / Restricted / Flagged). */
export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  const { label, className } = RECORD_STATUS[status]
  return (
    <span className={cn('inline-flex h-7 items-center rounded-full px-2.5 text-body-s font-semibold', className)}>
      {label}
    </span>
  )
}

/* -------------------------------- Pagination ------------------------------ */

function pageList(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)
  const head = [1, 2, 3]
  const tail = [pages - 2, pages - 1, pages]
  if (page > 3 && page < pages - 2) return [1, '…', page - 1, page, page + 1, '…', pages]
  return [...head, '…', ...tail]
}

/** "15 of 2000 row(s) shown · Previous 1 2 3 … 7 8 9 Next" */
export function Pagination({
  page,
  pageSize,
  total,
  shown,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  shown: number
  onPage: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const cell = 'flex h-[38px] min-w-[29px] items-center justify-center rounded-control px-2.5 text-body-s font-medium'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline p-2.5">
      <p className="text-body-s text-fg-muted">
        {shown} of {formatCount(total)} row(s) shown
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-[7px]">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn(cell, 'border border-hairline bg-offwhite text-fg-muted disabled:opacity-50 dark:bg-grey-50')}
        >
          Previous
        </button>
        {pageList(page, pages).map((item, index) =>
          item === '…' ? (
            <span key={`gap-${index}`} className={cn(cell, 'text-fg')}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPage(item)}
              className={cn(
                cell,
                item === page
                  ? 'bg-brand-orange text-white'
                  : 'bg-offwhite text-fg hover:bg-grey-30/50 dark:bg-grey-50',
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className={cn(cell, 'border border-hairline bg-offwhite text-fg-muted disabled:opacity-50 dark:bg-grey-50')}
        >
          Next
        </button>
      </nav>
    </div>
  )
}

/* ---------------------------------- Tables -------------------------------- */

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'center'
  className?: string
}

/** Admin data table (Figma "llogs" tables): grey header row, hairline rows, scrolls sideways on phones. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty = 'Nothing here yet.',
  headerTint = true,
  onRowClick,
}: {
  columns: Column<T>[]
  rows: T[] | undefined
  rowKey: (row: T) => string
  loading?: boolean
  empty?: string
  headerTint?: boolean
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-body-s">
        <thead>
          <tr className={cn('border-b border-hairline', headerTint && 'bg-offwhite dark:bg-grey-50')}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'p-2.5 font-normal whitespace-nowrap text-fg-muted',
                  column.align === 'center' ? 'text-center' : 'text-left',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(loading && 'opacity-60')}>
          {rows?.length ? (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'h-[39px] border-b border-hairline last:border-b-0',
                  onRowClick && 'cursor-pointer hover:bg-fg/[0.02]',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-2.5 py-1 text-fg',
                      column.align === 'center' ? 'text-center' : 'text-left',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-8 text-center text-fg-muted">
                {loading ? 'Loading…' : empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Compact search inside a table header (Figma "Search users"). */
export function TableSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="flex h-8 w-full max-w-[263px] items-center gap-2 rounded-control border border-hairline bg-offwhite px-2 dark:bg-grey-50">
      <MagnifyingGlass aria-hidden className="size-3 shrink-0 text-fg" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body-m text-fg outline-none placeholder:text-fg-muted"
      />
    </label>
  )
}
