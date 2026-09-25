import {
  Bell,
  ChatsCircle,
  Compass,
  GearSix,
  GlobeHemisphereWest,
  House,
  ProjectorScreenChart,
  UserCircleDashed,
  type Icon,
} from '@phosphor-icons/react'
import { paths } from '@/app/paths'

export interface NavItem {
  label: string
  to: string
  icon: Icon
  badgeKey?: 'notifications'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: paths.home, icon: House },
  { label: 'Projects', to: paths.projects, icon: ProjectorScreenChart },
  { label: 'Chats', to: paths.chats, icon: ChatsCircle },
  { label: 'Forums', to: paths.forums, icon: GlobeHemisphereWest },
  { label: 'Explore', to: paths.explore, icon: Compass },
  { label: 'Profile', to: paths.profile, icon: UserCircleDashed },
  { label: 'Notifications', to: paths.notifications, icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', to: paths.settings, icon: GearSix },
]
