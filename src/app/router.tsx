import { createBrowserRouter, Navigate } from 'react-router-dom'
import { adminRoutes } from '@/admin/routes'
import { AppShell } from '@/components/layout/AppShell'
import { GuestOnly, OnboardingOnly, RequireAuth } from './guards'
import { paths } from './paths'

// Screens are code-split per route so each page only loads what it needs.
export const router = createBrowserRouter([
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
    ],
  },
  {
    element: <OnboardingOnly />,
    children: [
      {
        path: paths.onboardingProfile,
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/PersonalInfoPage')).PersonalInfoPage,
        }),
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
          ...[paths.chats, paths.chat()].map((path) => ({
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
                  Component: (await import('@/features/settings/pages/VisibilitySettingsPage')).VisibilitySettingsPage,
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
