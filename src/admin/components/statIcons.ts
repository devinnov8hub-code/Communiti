import {
  CalendarBlank,
  CalendarCheck,
  CalendarDots,
  ChatsCircle,
  Check,
  Flag,
  Folder,
  FolderPlus,
  Lightning,
  Prohibit,
  UserCheck,
  UserPlus,
  Users,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react'

/** Stat card icons per page (ids like "total" mean different things on each page). */
export const EVENT_STAT_ICONS: Record<string, Icon> = {
  total: CalendarBlank,
  active: CalendarCheck,
  concluded: CalendarBlank,
  upcoming: CalendarDots,
}
export const FORUM_STAT_ICONS: Record<string, Icon> = {
  total: ChatsCircle,
  active: UsersThree,
  restricted: Prohibit,
  flagged: Flag,
}
export const PROJECT_STAT_ICONS: Record<string, Icon> = {
  total: Folder,
  active: Lightning,
  completed: Check,
  new: FolderPlus,
}
export const USER_STAT_ICONS: Record<string, Icon> = {
  total: Users,
  active: UserCheck,
  new: UserPlus,
  blocked: Prohibit,
}
