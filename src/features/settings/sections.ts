import { Eye, File, GlobeHemisphereWest, Lock, Question, SunDim, User, type Icon } from '@phosphor-icons/react'

export const SETTINGS_SECTIONS: { slug: string; label: string; icon: Icon }[] = [
  { slug: 'account', label: 'Account Preferences', icon: User },
  { slug: 'language', label: 'Language', icon: GlobeHemisphereWest },
  { slug: 'theme', label: 'App Theme', icon: SunDim },
  { slug: 'privacy', label: 'Privacy', icon: Lock },
  { slug: 'privacy-policy', label: 'Privacy policy', icon: File },
  { slug: 'visibility', label: 'Visibility', icon: Eye },
  { slug: 'help', label: 'Help & Support', icon: Question },
]
