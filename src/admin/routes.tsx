import { Navigate, type RouteObject } from 'react-router-dom'
import { adminPaths } from './paths'

const session = () => import('./session/AdminRoot')
const auth = () => import('./pages/AdminAuthPages')
const sections = () => import('./pages/SectionPages')
const events = () => import('./pages/EventsPages')
const highlights = () => import('./pages/HighlightsPages')

/**
 * Admin console, mounted at /admin by the app router. Everything here — even the
 * session provider and guards — is lazy, so members never download admin code.
 */
export const adminRoutes: RouteObject = {
  path: '/admin',
  lazy: async () => ({ Component: (await session()).AdminRoot }),
  children: [
    {
      lazy: async () => ({ Component: (await session()).AdminGuestOnly }),
      children: [
        { path: adminPaths.login, lazy: async () => ({ Component: (await auth()).AdminLoginPage }) },
        { path: adminPaths.resetPassword, lazy: async () => ({ Component: (await auth()).AdminResetPasswordPage }) },
        { path: adminPaths.verifyOtp, lazy: async () => ({ Component: (await auth()).AdminVerifyOtpPage }) },
        { path: adminPaths.newPassword, lazy: async () => ({ Component: (await auth()).AdminNewPasswordPage }) },
      ],
    },
    {
      lazy: async () => ({ Component: (await session()).RequireAdmin }),
      children: [
        {
          lazy: async () => ({ Component: (await import('./components/AdminShell')).AdminShell }),
          children: [
            { index: true, lazy: async () => ({ Component: (await import('./pages/OverviewPage')).OverviewPage }) },
            {
              path: adminPaths.users,
              lazy: async () => ({ Component: (await import('./pages/UsersPage')).UsersPage }),
            },
            { path: adminPaths.forums, lazy: async () => ({ Component: (await sections()).ForumsPage }) },
            { path: adminPaths.projects, lazy: async () => ({ Component: (await sections()).ProjectsPage }) },
            {
              path: adminPaths.moderation(),
              lazy: async () => ({ Component: (await import('./pages/ModerationPage')).ModerationPage }),
            },
            { path: adminPaths.events, lazy: async () => ({ Component: (await events()).EventsPage }) },
            { path: adminPaths.event(), lazy: async () => ({ Component: (await events()).EventDetailPage }) },
            { path: adminPaths.highlights, lazy: async () => ({ Component: (await highlights()).HighlightsPage }) },
            {
              path: adminPaths.highlight(),
              lazy: async () => ({ Component: (await highlights()).HighlightDetailPage }),
            },
            {
              path: adminPaths.notifications,
              lazy: async () => ({ Component: (await import('./pages/NotificationsPage')).NotificationsPage }),
            },
            { path: adminPaths.logs, lazy: async () => ({ Component: (await import('./pages/LogsPage')).LogsPage }) },
            {
              path: adminPaths.profile,
              lazy: async () => ({ Component: (await import('./pages/ProfilePage')).ProfilePage }),
            },
            { path: '*', element: <Navigate to={adminPaths.overview} replace /> },
          ],
        },
      ],
    },
  ],
}
