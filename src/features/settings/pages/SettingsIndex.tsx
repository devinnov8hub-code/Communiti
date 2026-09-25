import { Navigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { useMediaQuery } from '@/hooks/useMediaQuery'

/** /settings: desktop jumps to the first section; small screens show the section list. */
export function SettingsIndex() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  return desktop ? <Navigate to={paths.settingsSection('account')} replace /> : null
}
