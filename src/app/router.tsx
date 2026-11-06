import { createBrowserRouter, Navigate } from 'react-router-dom'
import { adminRoutes } from '@/admin/routes'
import { AppShell } from '@/components/layout/AppShell'
import { isAdminHost } from './host'
import { GuestOnly, OnboardingOnly, RequireAuth } from './guards'
import { paths } from './paths'

// Screens are code-split per route so each page only loads what it needs.
const memberRouter = () =>
  createBrowserRouter([
    {
      path: paths.authCallback,
      lazy: async () => ({ Component: (await import('@/features/auth/pages/AuthCallbackPage')).AuthCallbackPage }),
    },
    {
      element: <GuestOnly />,
      children: [
        {
          path: paths.signUp,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/SignUpPage')).SignUpPage }),
        },
        {
          path: paths.login,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/LoginPage')).LoginPage }),
        },
        {
          path: paths.verify,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/VerifyCodePage')).VerifyCodePage }),
        },
        {
          path: paths.forgotPassword,
          lazy: async () => ({
            Component: (await import('@/features/auth/pages/ResetPasswordPages')).ForgotPasswordPage,
          }),
        },
        {
          path: paths.newPassword,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/ResetPasswordPages')).NewPasswordPage }),
        },
      ],
    },
    {
      element: <OnboardingOnly />,
      children: [
        {
          path: paths.onboardingRole,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/SelectRolePage')).SelectRolePage }),
        },
        {
          path: paths.onboardingRoleForm(),
          lazy: async () => ({ Component: (await import('@/features/auth/pages/RoleFormPage')).RoleFormPage }),
        },
        {
          path: paths.onboardingInterests,
          lazy: async () => ({
            Component: (await import('@/features/auth/pages/FeedCustomizationPage')).FeedCustomizationPage,
          }),
        },
      ],
    },
    {
      element: <RequireAuth />,
      children: [
        {
          path: paths.changeRole,
          lazy: async () => ({ Component: (await import('@/features/auth/pages/SelectRolePage')).ChangeRolePage }),
        },
        {
          path: paths.changeRoleForm(),
          lazy: async () => ({ Component: (await import('@/features/auth/pages/RoleFormPage')).ChangeRoleFormPage }),
        },
        {
          element: <AppShell />,
          children: [
            {
              path: paths.home,
              lazy: async () => ({ Component: (await import('@/features/feed/pages/HomePage')).HomePage }),
            },
            {
              path: paths.post(),
              lazy: async () => ({ Component: (await import('@/features/feed/pages/PostPage')).PostPage }),
            },
            {
              path: paths.search,
              lazy: async () => ({ Component: (await import('@/features/feed/pages/SearchPage')).SearchPage }),
            },
            {
              path: paths.projects,
              lazy: async () => ({
                Component: (await import('@/features/projects/pages/ProjectsPage')).ProjectsPage,
              }),
            },
            ...[paths.chats, paths.chat(), paths.chatRequest()].map((path) => ({
              path,
              lazy: async () => ({ Component: (await import('@/features/chats/pages/ChatsPage')).ChatsPage }),
            })),
            {
              path: paths.explore,
              lazy: async () => ({ Component: (await import('@/features/explore/pages/ExplorePage')).ExplorePage }),
            },
            {
              path: paths.innovation(),
              lazy: async () => ({
                Component: (await import('@/features/explore/pages/InnovationPage')).InnovationPage,
              }),
            },
            {
              path: paths.highlight(),
              lazy: async () => ({ Component: (await import('@/features/explore/pages/HighlightPage')).HighlightPage }),
            },
            {
              path: paths.events,
              lazy: async () => ({ Component: (await import('@/features/explore/pages/EventsPage')).EventsPage }),
            },
            {
              path: paths.event(),
              lazy: async () => ({ Component: (await import('@/features/explore/pages/EventPage')).EventPage }),
            },
            {
              path: paths.profile,
              lazy: async () => ({ Component: (await import('@/features/profile/pages/ProfilePage')).ProfilePage }),
            },
            {
              path: paths.person(),
              lazy: async () => ({ Component: (await import('@/features/profile/pages/PersonPage')).PersonPage }),
            },
            {
              path: paths.forums,
              lazy: async () => ({ Component: (await import('@/features/forums/pages/ForumsPage')).ForumsPage }),
            },
            {
              path: paths.forum(),
              lazy: async () => ({ Component: (await import('@/features/forums/pages/ForumPage')).ForumPage }),
            },
            {
              path: paths.settings,
              lazy: async () => ({
                Component: (await import('@/features/settings/components/SettingsLayout')).SettingsLayout,
              }),
              children: [
                {
                  index: true,
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/SettingsIndex')).SettingsIndex,
                  }),
                },
                {
                  path: 'account',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/AccountSettingsPage')).AccountSettingsPage,
                  }),
                },
                {
                  path: 'language',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/LanguageSettingsPage')).LanguageSettingsPage,
                  }),
                },
                {
                  path: 'theme',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/ThemeSettingsPage')).ThemeSettingsPage,
                  }),
                },
                {
                  path: 'privacy',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/PrivacySettingsPage')).PrivacySettingsPage,
                  }),
                },
                {
                  path: 'privacy-policy',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/PrivacyPolicyPage')).PrivacyPolicyPage,
                  }),
                },
                {
                  path: 'visibility',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/VisibilitySettingsPage'))
                      .VisibilitySettingsPage,
                  }),
                },
                {
                  path: 'help',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/HelpSettingsPage')).HelpSettingsPage,
                  }),
                },
                {
                  path: 'privacy/delete-account',
                  lazy: async () => ({
                    Component: (await import('@/features/settings/pages/DeleteAccountPage')).DeleteAccountPage,
                  }),
                },
              ],
            },
            {
              path: paths.notifications,
              lazy: async () => ({
                Component: (await import('@/features/notifications/pages/NotificationsPage')).NotificationsPage,
              }),
            },
            ...[paths.createProject, paths.editProject()].map((path) => ({
              path,
              lazy: async () => ({
                Component: (await import('@/features/projects/pages/ProjectFormPage')).ProjectFormPage,
              }),
            })),
            ...[paths.project(), paths.projectTab(), paths.prototype()].map((path) => ({
              path,
              lazy: async () => ({
                Component: (await import('@/features/workspace/pages/WorkspacePage')).WorkspacePage,
              }),
            })),
          ],
        },
      ],
    },
    adminRoutes,
    { path: '*', element: <Navigate to={paths.home} replace /> },
  ])

/** admin.mycommuniti.org serves only the admin console, at the root of the domain. */
const adminRouter = () => createBrowserRouter([adminRoutes, { path: '*', element: <Navigate to="/" replace /> }])

export const router = isAdminHost ? adminRouter() : memberRouter()
