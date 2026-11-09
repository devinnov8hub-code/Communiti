# CommUniti By Innov8— Web

React 19 + TypeScript + Tailwind CSS v4 (Vite), built from the **Innov8** Figma file (WEB page).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
npm run format   # Prettier (+ Tailwind class sorting)
```

## Structure

```
src/
  admin/          admin console at /admin — separate from the member app (see below)
  app/            router (code-split routes), route guards, path constants
  assets/         images/SVGs exported from Figma (optimised to WebP)
  components/
    brand/        logo lockups
    layout/       app shell: sidebar (full / icon rail / drawer), page columns, back header
    ui/           design-system primitives: Button, TextField, SelectField, DateField, Checkbox,
                  Pill, Tag, Tabs, Avatar, AvatarStack, SearchField, Modal, ConfirmDialog, Menu,
                  IconButton, EmptyState, Toast…
  features/       one folder per area, each with api/ (service + mock), hooks/ (TanStack Query),
                  components/, pages/, types.ts
    auth/         sign-up, verification (+ resend), onboarding, login
    feed/         home feed, post view, comments, search, report/menus, right rail
    projects/     projects list, create / edit project
    workspace/    project workspace: overview & join flow, research, prototypes & versions,
                  expert evaluations, ledger, contract, tasks, members, project settings
    chats/        messages, project chats, conversation, collaboration requests
    explore/      suggested, highlights, featured innovations, events
    profile/      profile, edit profile, skills, work experience
    forums/       forums list, forum view, create forum
    settings/     account, language, theme, privacy, policy, visibility, help, delete account, sign out
    notifications/ notifications list + settings
  hooks/          shared hooks
  lib/            api/ (backend client, services, types), storage, formatting, class-name helper
  providers/      theme (light / dark / system)
  styles/         globals.css — all design tokens
```

## Responsive layout

- **≥1280px** — full sidebar (296px) · content (708px) · right rail, as in Figma.
- **1024–1279px** — full sidebar · content (no right rail).
- **768–1023px** — collapsed icon rail; the ☰ toggle opens the full sidebar as a drawer.
- **<768px** — top bar with ☰ toggle (drawer) and notifications.

## Design tokens

All colours, type sizes and spacing come from the Figma variables and live in
`src/styles/globals.css`. Components use semantic tokens (`bg-background`, `bg-surface`,
`text-fg`, `text-fg-muted`, `border-hairline`, …) that switch automatically between the light
and dark designs. Don't hard-code hex values in components.

The theme follows the OS by default; Settings → App Theme lets users pick Light / Dark / Device.

## Backend API — `src/lib/api/`

Everything that talks to the real backend ([docs](https://api.mycommuniti.org/api/docs)) lives here.
The services and types are generated from the backend's OpenAPI spec (`openapi/openapi.json`,
165 endpoints):

```ts
import { postsApi, type Post } from '@/lib/api'
const { data, nextCursor } = await postsApi.getFeed({ tab: 'for-you' })
```

- `client.ts` — the axios instance: bearer token, one automatic refresh on 401 (the refresh token is
  an httpOnly cookie), and errors turned into `ApiError`.
- `services/<area>.service.ts` — one function per endpoint, exported as `authApi`, `postsApi`,
  `projectsApi`, `workspaceApi`, `chatApi`, `adminApi`…
- `types/<area>.types.ts` — plain interfaces for every request body, query and response;
  `models.types.ts` has the backend models (`Post`, `Project`, `UserSummary`…).
- `errors.ts` — `ApiError` (with the backend's `code` / `fields` / `requestId`) and `getErrorMessage`.
- `upload.ts` — `uploadFile(file, purpose)`: presign → PUT to storage → confirm.
- `legacy.ts` — temporary: the fetch helper and sample-data switch used by features that are not
  connected yet. Removed once they are.

`services/` and `types/` are **generated — do not edit.** `npm run api:sync` re-downloads the spec and
regenerates; `npm run api:generate` regenerates only. Function names come from
`scripts/generate-api.mjs` (see `NAME_OVERRIDES`).

The backend only allows browser calls from the production site, so in development the client calls
`/api/...` on the dev server and Vite proxies it (`vite.config.ts`).

**Most screens are not connected yet.** Auth, Account Preferences and the admin console use `@/lib/api`. Every other feature
still has its own `api/` folder (a placeholder service plus sample data) and screen-shaped `types.ts`
from before the backend existed. As a feature is connected, those are deleted and it uses `@/lib/api`
services and types directly.

### Auth

Sign-up, verification, login, password reset, onboarding and Google sign-in always use the real
backend, so signing in needs a real account, even while the other features show sample data.
`features/auth/user.ts` maps the backend's user to the app's `User` (`toUser`, `toSession`);
`AuthProvider` loads the full record from `GET /me`, ends the session on logout or when the token can't
be refreshed. Onboarding follows the backend's flow: Select Role, the role's form (`PUT /me/role`), then
topics (`PUT /me/interests`). Settings → Account Preferences reuses those role screens at `/change-role`
and signs the member out afterwards.

Verification is automatic (backend `FRONTEND_INTEGRATION.md` §6): `PUT /me/role` checks the answers in
1–6 seconds and returns `verified`, or `422 VERIFICATION_FAILED` with one message per `details.<field>`,
which the forms show under the inputs. `VerifyTick` stays grey until the server says `verified`. A
`pending` answer (the OpenAPI spec still describes admin review) moves on without a tick.

## Backend integration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. While it is empty every feature that isn't
connected yet uses its in-browser mock (seeded with the Figma content). Each `*.service.ts` exports the API interface, the real HTTP implementation and picks one at startup,
so pointing at the backend needs no component changes.

Requests send `Authorization: Bearer <token>`; errors should return `{ message }`. Endpoints that
upload files accept `multipart/form-data`. Response shapes are the types in each feature's `types.ts`.

### Feed & posts — `features/feed/api/feed.service.ts`

| Method       | Path                           | Body / query                                       | Returns                 |
| ------------ | ------------------------------ | -------------------------------------------------- | ----------------------- |
| GET          | `/feed?tab=for-you\|following` |                                                    | `Post[]`                |
| GET          | `/users/:id/posts`             | (`me` for the current user)                        | `Post[]`                |
| GET / DELETE | `/posts/:id`                   |                                                    | `Post` / —              |
| POST         | `/posts`                       | `content, audience, attachments[]`                 | `Post`                  |
| PUT / DELETE | `/posts/:id/like`              |                                                    | `Post`                  |
| POST         | `/posts/:id/hide`              | ("Not interested")                                 | —                       |
| POST         | `/posts/:id/reports`           | `{ reasons: string[] }`                            | —                       |
| GET / POST   | `/posts/:id/comments`          | `?sort=latest\|popular` / `content, attachments[]` | `Comment[]` / `Comment` |
| DELETE       | `/comments/:id`                |                                                    | —                       |
| PUT / DELETE | `/comments/:id/like`           |                                                    | —                       |
| POST         | `/comments/:id/reports`        |                                                    | —                       |
| PUT / DELETE | `/users/:id/follow`            |                                                    | —                       |
| PUT / DELETE | `/users/:id/block`             |                                                    | —                       |
| GET          | `/users/me/blocked`            |                                                    | `Author[]`              |
| GET          | `/trending`                    |                                                    | `TrendingGroup[]`       |
| GET          | `/topics`                      |                                                    | `SearchTopic[]`         |
| GET          | `/search/posts?q=&topic=`      |                                                    | `Post[]`                |

### Projects — connected (`projectsApi`, `workspaceApi`, `uploadFile`)

| Method      | Path                        | Used for                                                             |
| ----------- | --------------------------- | -------------------------------------------------------------------- |
| GET         | `/projects?tab=all\|joined` | Projects / My Projects tabs, a page at a time (loads more on scroll) |
| GET         | `/users/:id/projects`       | Profile → Projects tab                                               |
| GET / PATCH | `/projects/:id`             | Edit project (owner or admin only)                                   |
| POST        | `/projects`                 | Create project; a non-`open` stage is set with a follow-up PATCH     |
| POST        | `/projects/:id/contracts`   | The form's "Upload Contract" file (uploaded with purpose `contract`) |

The form's media is uploaded with purpose `project`: images become `coverUrl`, videos `videoUrl`. The
backend has no fields for the Figma "Project impact" and "Roles Needed" inputs, so the form doesn't show them.

### Project workspace — partly connected

Connected (`projectsApi`, `workspaceApi`, `reportsApi`; `features/workspace/mappers.ts` shapes them for the screens):

| Method     | Path                                                     | Used for                                                                |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| GET        | `/projects/:id`                                          | Header and Overview; `myRole` / `joinRequestStatus` → access            |
| POST       | `/projects/:id/join-requests`                            | "Join Project" after Accept Terms                                       |
| DELETE     | `/projects/:id/members/:userId`                          | Leave (yourself; hidden for the owner) and remove a member              |
| GET        | `/projects/:id/members`                                  | Project members sheet                                                   |
| GET        | `/projects/:id/join-requests`                            | Requests tab (owner and admins)                                         |
| POST       | `/projects/:id/join-requests/:requestId/accept\|decline` | Accept / Decline                                                        |
| GET / PUT  | `/projects/:id/notification-settings`                    | Notifications sheet                                                     |
| GET        | `/projects/:id/contracts`                                | Contract tab's documents                                                |
| POST       | `/reports` (`targetType: project`)                       | Report this project                                                     |
| GET / POST | `/projects/:id/research`                                 | Research tab, a page at a time / "New Document" (`kind: written`)       |
| DELETE     | `/projects/:id/research/:docId`                          | Delete (author or admin)                                                |
| POST       | `/projects/:id/workspace-comments`                       | Comment on a document or version (`research_doc` / `prototype_version`) |
| GET / POST | `/projects/:id/prototypes`                               | Prototype tab / "New Prototype" (thumbnail → `coverUrl`)                |
| DELETE     | `/projects/:id/prototypes/:prototypeId`                  | Delete prototype (project admins only, so hidden for others)            |
| GET        | `/projects/:id/prototypes/:prototypeId`                  | Versions screen and the Expert tab's version picker                     |
| POST       | `/projects/:id/prototypes/:prototypeId/versions`         | "Upload version" (file uploaded with purpose `prototype`)               |

The collaboration terms in Accept Terms and the Contract tab are the same for every project
(`features/workspace/terms.ts`). Not in the backend, so not shown: the design's "Impact" section and the
"Accept Requests" switch. The notification options are the backend's (chat, tasks, research, prototypes,
evaluations, members) rather than the design's four.

Research documents are stored as TipTap/ProseMirror JSON. The web editor is plain text, so
`features/workspace/richText.ts` saves one paragraph per line and reads any document back as text.
Uploaded documents (`kind: uploaded`) show an "Open file" link.

Prototypes: the thumbnail is uploaded with the public `project` purpose because `coverUrl` must be a
public link. The backend has no list of a prototype's artisans, so the card shows its creator and
the version count. A version's file is private (signed link, valid for an hour); images are
previewed, other files show a file icon that opens the file. The backend only accepts images,
video, PDF and Office/text files, so the picker no longer offers CAD formats (`.dwg`, `.stl`, `.step`…).

Not connected yet (`features/workspace/api/`, sample data):

| Method         | Path                          | Body                                              | Returns                         |
| -------------- | ----------------------------- | ------------------------------------------------- | ------------------------------- |
| GET / POST     | `/projects/:id/evaluations`   | — / `{ target, scores, comment }`                 | `EvaluationSummary`             |
| GET            | `/projects/:id/ledger`        |                                                   | `LedgerEntry[]`                 |
| GET / POST     | `/projects/:id/tasks`         | — / `{ title, description, assigneeId, dueDate }` | `ProjectTask[]` / `ProjectTask` |
| PATCH / DELETE | `/projects/:id/tasks/:taskId` | `{ completed }` / —                               | `ProjectTask` / —               |

Only members see workspace tabs other than Overview; owners and admins also get Edit Project Details and
join-request management. While a join request is pending the workspace re-fetches every 5 seconds.

### Chats — `features/chats/api/chats.service.ts`

| Method       | Path                                  | Body                             | Returns                         |
| ------------ | ------------------------------------- | -------------------------------- | ------------------------------- |
| GET          | `/conversations?kind=direct\|project` |                                  | `Conversation[]`                |
| GET / DELETE | `/conversations/:id`                  |                                  | `Conversation` / —              |
| GET / POST   | `/conversations/:id/messages`         | `text, attachments[]`            | `ChatMessage[]` / `ChatMessage` |
| DELETE       | `/conversations/:id/messages`         | (clear history)                  | —                               |
| POST         | `/conversations/:id/read`             |                                  | —                               |
| POST         | `/conversations/:id/reports`          |                                  | —                               |
| POST         | `/conversations/:id/leave`            | (project chats)                  | —                               |
| GET          | `/collaboration-requests`             |                                  | `CollaborationRequest[]`        |
| PATCH        | `/collaboration-requests/:id`         | `{ status: accepted\|declined }` | —                               |

### Explore & events — `features/explore/api/explore.service.ts`

| Method       | Path                       | Returns          |
| ------------ | -------------------------- | ---------------- |
| GET          | `/innovations?topics=a,b`  | `Innovation[]`   |
| GET          | `/innovations/:id`         | `Innovation`     |
| GET          | `/highlights`              | `Highlight[]`    |
| GET          | `/highlights/:id`          | `Highlight`      |
| GET          | `/events`                  | `ExploreEvent[]` |
| GET          | `/events/:id`              | `ExploreEvent`   |
| PUT / DELETE | `/events/:id/registration` | `ExploreEvent`   |

### Profile — `features/profile/api/profile.service.ts`

| Method      | Path                        | Body                                                           | Returns         |
| ----------- | --------------------------- | -------------------------------------------------------------- | --------------- |
| GET / PATCH | `/users/me`                 | `name, role, profession, avatar?` / `{ openToCollaborations }` | `Profile`       |
| PUT         | `/users/me/skills`          | `{ skills: string[] }`                                         | `Profile`       |
| POST        | `/users/me/experiences`     | `Experience` (without id)                                      | `Profile`       |
| DELETE      | `/users/me/experiences/:id` |                                                                | `Profile`       |
| GET         | `/skills`                   |                                                                | `SkillOption[]` |

### Forums — `features/forums/api/forums.service.ts`

| Method       | Path                                                           | Body                             | Returns   |
| ------------ | -------------------------------------------------------------- | -------------------------------- | --------- |
| GET          | `/forums?scope=for-you\|joined\|mine`                          |                                  | `Forum[]` |
| GET / PATCH  | `/forums/:id`                                                  | — / `{ muted }`                  | `Forum`   |
| POST         | `/forums`                                                      | `name, about, topics[], header?` | `Forum`   |
| PUT / DELETE | `/forums/:id/membership`                                       |                                  | `Forum`   |
| GET          | `/forums/:id/posts?sort=latest\|popular\|my-posts\|my-replies` |                                  | `Post[]`  |

### Settings — `features/settings/api/settings.service.ts`

| Method    | Path                   | Body                                  | Returns              |
| --------- | ---------------------- | ------------------------------------- | -------------------- |
| GET / PUT | `/users/me/visibility` | `{ messages, collaborationRequests }` | `VisibilitySettings` |
| GET / PUT | `/users/me/language`   | `{ language }`                        | `{ language }`       |
| POST      | `/support/reports`     | `{ message }`                         | —                    |
| DELETE    | `/users/me`            | `{ reasons: string[] }`               | —                    |

### Notifications — connected (`notificationsApi`, `meApi`)

| Method      | Path                          | Used for                                                         |
| ----------- | ----------------------------- | ---------------------------------------------------------------- |
| GET         | `/notifications?cursor=`      | The list, a page at a time (loads more on scroll)                |
| GET         | `/notifications/unread-count` | Nav badge                                                        |
| POST        | `/notifications/read`         | `{ ids: [id] }` on tap, `{ all: true }` for "Mark all as read"   |
| GET / PATCH | `/me/settings`                | "Mute notifications from" → `notificationPrefs[type].inApp/push` |

`features/notifications/mappers.ts` groups the backend `type`s into the Messages / Collaborations /
Posts / Forums tabs and builds each row's link from `targetType` + `targetId`.

Server state is managed with TanStack Query (`features/*/hooks/queries.ts`); likes and read
states are optimistic, other mutations update or invalidate the cache.

## Admin console — `src/admin/`

The admin console (Figma ADMIN page) lives entirely in `src/admin/` and is mounted at `/admin` by
`admin/routes.tsx`. It has its own login (email + password, with an OTP password reset), its own
session and token (`communiti-admin-session`, separate from members), its own sidebar layout and
its own `paths.ts`. Every admin route — including the session provider — is lazy-loaded, so members
never download admin code. Admin code may use the shared UI kit (`components/ui`), tokens and `lib/`;
**member code must never import from `src/admin/`.**

Mock mode: sign in with any email and a password of 6+ characters; any 5-digit reset code works.

Admin endpoints are prefixed with `/admin` and authenticated with the admin token
(`admin/api/admin.service.ts`):

| Method       | Path                                                             | Body / query                                                                                        | Returns                                  |
| ------------ | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| POST         | `/admin/auth/login`                                              | `{ email, password }`                                                                               | `{ token, admin }`                       |
| POST         | `/admin/auth/password-reset`                                     | `{ email }`                                                                                         | — (emails a 5-digit code)                |
| POST         | `/admin/auth/password-reset/verify`                              | `{ email, code }`                                                                                   | `{ resetToken }`                         |
| POST         | `/admin/auth/password-reset/complete`                            | `{ resetToken, password }`                                                                          | —                                        |
| PATCH / PUT  | `/admin/me` · `/admin/me/password`                               | profile fields + `avatar?` (multipart) · `{ oldPassword, newPassword }`                             | `AdminUser` · —                          |
| GET          | `/admin/dashboard?range=` · `/admin/dashboard/:section?range=`   | `range`: 7d, 30d, 90d, 12m; section: users, forums, projects                                        | `OverviewDashboard` · `SectionDashboard` |
| GET          | `/admin/reports?section=&status=&page=&q=`                       | status: all, pending, reviewed, dismissed                                                           | `Page<Report>`                           |
| POST         | `/admin/reports/:id/actions`                                     | `{ action }` (dismiss, remove-content, warn, suspend-user, block-user, suspend-group, delete-group) | `Report`                                 |
| GET          | `/admin/users` · `/admin/forums` · `/admin/projects` `?page=&q=` |                                                                                                     | `Page<…Row>`                             |
| PATCH        | `/admin/{users,forums,projects}/:id/status`                      | `{ action }` (activate, restrict, warn, suspend)                                                    | —                                        |
| GET / POST   | `/admin/events`                                                  | — / event fields + `cover?` (multipart)                                                             | `AdminEvent[]` / `AdminEvent`            |
| GET / DELETE | `/admin/events/:id`                                              |                                                                                                     | `AdminEvent` / —                         |
| GET / POST   | `/admin/highlights`                                              | — / `title?, eventId?, images[]` (multipart)                                                        | `HighlightGroup[]` / `HighlightGroup`    |
| GET / DELETE | `/admin/highlights/:id`                                          |                                                                                                     | `HighlightGroup` / —                     |
| POST         | `/admin/notifications/broadcast`                                 | `{ audience, targetId?, title, ids?, body }`                                                        | —                                        |
| GET / POST   | `/admin/inbox` · `/admin/inbox/read-all`                         |                                                                                                     | `AdminInboxItem[]` / —                   |
| GET          | `/admin/logs?page=&q=`                                           |                                                                                                     | `Page<AdminLog>`                         |

`Page<T>` is `{ items, total, page, pageSize }`.
