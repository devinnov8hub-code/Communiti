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
  features/       one folder per area, each with hooks/ (TanStack Query over @/lib/api), mappers,
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
- `src/lib/realtime.ts` (beside it) — Supabase Realtime for live chat messages and notifications.

`services/` and `types/` are **generated — do not edit.** `npm run api:sync` re-downloads the spec and
regenerates; `npm run api:generate` regenerates only. Function names come from
`scripts/generate-api.mjs` (see `NAME_OVERRIDES`).

The backend only allows browser calls from the production site, so in development the client calls
`/api/...` on the dev server and Vite proxies it (`vite.config.ts`).

**Every screen uses the real backend** through `@/lib/api`; there is no sample data. Features call the
services from their `hooks/queries.ts`, and where the backend's shape differs from what a screen needs, a
`mappers.ts` in the feature converts it.

### Auth

Sign-up, verification, login, password reset, onboarding and Google sign-in use the real backend,
so signing in needs a real account.
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

Copy `.env.example` to `.env`. `VITE_API_BASE_URL` can usually stay empty (see the comments there);
`VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` turn on realtime. Every `VITE_` value is built into the
JavaScript sent to browsers, so never put a secret in one, and set them in the hosting build settings too.

Each section below lists what a feature uses. Things the Figma design shows but the backend doesn't
support are left out of the screens and noted, so they can be added when the backend has them.

### Feed & posts — connected (`postsApi`, `reportsApi`, `searchApi`, `topicsApi`, `usersApi`, `exploreApi`, `uploadFile`)

Home feed (For you / Following), a member's posts, post view and comments (with likes), create and delete
posts with attachments, report and "Not interested", follow / block from post menus, search, and the right
rail's trending topics and forums and upcoming events.

Search (`/search?type=`) has Posts, People, Events and Highlights tabs; each tab fetches only when opened.
People results open the person's profile, which is where you follow, message or ask to collaborate.

### Collaboration — `collaborationApi`, `features/profile/hooks/people.ts`

From someone's profile, "Collaborate" sends a request with an optional note, and optionally invites
them into a project you own or run (the picker lists only those; accepting adds them as a
contributor). The button is disabled for people who switched "Open to Collaborations" off, and the
backend refuses those requests too (`403 NOT_OPEN_TO_COLLABORATE`). Requests arrive in Chats →
Collaboration requests; accepting opens a direct chat.

**Suggested people** (Explore → Suggested): `GET /users/suggested` ranks members you don't follow by how
similar their profile is to yours: shared interest topics, people you follow who follow them, the same
role, forums in common and the same country. Each card says why ("2 shared interests · Also a
Researcher") and opens the profile. New members start "Open to Collaborations" (backend default).

### Realtime — `src/lib/realtime.ts`

Supabase Realtime (backend `FRONTEND_INTEGRATION.md` §9). The browser joins private channels with the
member's own access token: `conversation:<id>` (new / edited / deleted messages, read) and `user:<id>`
(new notifications). Each channel opens once however many screens listen, and closes when none do; the
Supabase library loads on first use. Without the env keys the app polls instead (5–15 s; once a minute
as a safety net when realtime is on).

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

### Project workspace — connected

`projectsApi`, `workspaceApi` and `reportsApi`; `features/workspace/mappers.ts` shapes them for the screens:

| Method     | Path                                                     | Used for                                                                                 |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET        | `/projects/:id`                                          | Header and Overview; `myRole` / `joinRequestStatus` → access                             |
| POST       | `/projects/:id/join-requests`                            | "Join Project" after Accept Terms                                                        |
| DELETE     | `/projects/:id/members/:userId`                          | Leave (yourself; hidden for the owner) and remove a member                               |
| GET        | `/projects/:id/members`                                  | Project members sheet                                                                    |
| GET        | `/projects/:id/join-requests`                            | Requests tab (owner and admins)                                                          |
| POST       | `/projects/:id/join-requests/:requestId/accept\|decline` | Accept / Decline                                                                         |
| GET / PUT  | `/projects/:id/notification-settings`                    | Notifications sheet                                                                      |
| GET        | `/projects/:id/contracts`                                | Contract tab's documents                                                                 |
| POST       | `/reports` (`targetType: project`)                       | Report this project                                                                      |
| GET / POST | `/projects/:id/research`                                 | Research tab, a page at a time / "New Document" (`kind: written`)                        |
| DELETE     | `/projects/:id/research/:docId`                          | Delete (author or admin)                                                                 |
| POST       | `/projects/:id/workspace-comments`                       | Comment on a document or version (`research_doc` / `prototype_version`)                  |
| GET / POST | `/projects/:id/prototypes`                               | Prototype tab / "New Prototype" (thumbnail → `coverUrl`)                                 |
| DELETE     | `/projects/:id/prototypes/:prototypeId`                  | Delete prototype (project admins only, so hidden for others)                             |
| GET        | `/projects/:id/prototypes/:prototypeId`                  | Versions screen and the Expert tab's version picker                                      |
| POST       | `/projects/:id/prototypes/:prototypeId/versions`         | "Upload version" (file uploaded with purpose `prototype`)                                |
| GET        | `/projects/:id/evaluations`                              | Expert tab (score out of 100 = the three 1–5 averages)                                   |
| POST       | `/projects/:id/evaluations`                              | "Add Evaluation" (researchers and professionals; the backend also requires verification) |
| DELETE     | `/projects/:id/evaluations/:evaluationId`                | Delete your own evaluation                                                               |
| GET        | `/projects/:id/ledger`                                   | Ledger tab, a page at a time                                                             |
| GET / POST | `/projects/:id/tasks`                                    | Tasks tab / "New Task" (contributors and admins)                                         |
| PATCH      | `/projects/:id/tasks/:taskId`                            | Tick a task (`status: done\|todo`)                                                       |
| DELETE     | `/projects/:id/tasks/:taskId`                            | Delete (the task's creator or an admin)                                                  |

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
previewed, other files show a file icon that opens the file. Versions accept CAD / 3D files (`.stl`,
`.step`, `.iges`, `.obj`, `.3mf`, `.glb`, `.dwg`, `.dxf`, SolidWorks, Fusion 360, Inventor, SketchUp, FreeCAD)
as well as images, video, PDF and Office/text files. The backend recognises CAD files by their extension
(browsers don't report a type for them), so `uploadFile` always sends the file name.

Expert: evaluations only carry the reviewed document or version id, so the tab also loads the research and
prototype lists to name them (version names are fetched only when a version was reviewed). The design's
"Flag evaluation" has no backend, so the menu offers "Delete evaluation" on your own reviews instead.

Ledger: the `type`s aren't a documented list, so entries are coloured by keyword (message, research,
evaluation, prototype; anything else is a team update) and show the backend's `summary`. Tasks have one
assignee and an optional due date in the backend; tasks without one sort last.

Only members see workspace tabs other than Overview; owners and admins also get Edit Project Details and
join-request management. While a join request is pending the workspace re-fetches every 5 seconds.

### Chats — connected (`chatApi`, `collaborationApi`, `uploadFile`, realtime)

Direct and project chats, messages with attachments and voice notes, edit / delete, mute, clear or delete
history, read receipts, and collaboration requests (accept / decline). Open chats and the lists update
live through realtime.

### Explore & events — connected (`exploreApi`)

`features/explore/mappers.ts` shapes the backend's models for the screens:

| Method       | Path                               | Used for                                                                 |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------ |
| GET          | `/featured?topicIds=a,b`           | Featured Innovations strip and tab; "Sort topics" sends topic ids        |
| GET          | `/featured/:id`                    | Featured View (gallery = cover + images; Share uses `shareUrl`)          |
| GET          | `/highlights`                      | Highlights mosaic, a page at a time (the Highlights tab loads more)      |
| GET          | `/highlights/:id`                  | Album view: every photo and the caption                                  |
| GET          | `/highlights?exclude=:id&eventId=` | "More like this" (prefers albums from the same event)                    |
| GET          | `/events?when=upcoming\|concluded` | Events page sections                                                     |
| GET          | `/events/:id`                      | Event view                                                               |
| PUT / DELETE | `/events/:id/rsvp`                 | Register (`status: going`) / cancel; also opens `registrationUrl` if set |

A highlight is an album in the backend; the mosaic shows each album's first photo and skips albums
with none. Missing covers, organiser details or logos are simply left out. The Suggested tab keeps the
design (featured strip + highlights); the backend's `/explore/suggested` (projects, forums, people,
events) isn't used because the design has no place for it.

### Profile — connected (`meApi`, `uploadFile`)

| Method | Path  | Used for                                                                        |
| ------ | ----- | ------------------------------------------------------------------------------- |
| GET    | `/me` | Your profile: name, role, headline (shown as profession), bio, location, counts |
| PATCH  | `/me` | Edit Profile (`fullName`, `headline`, `avatarUrl`) and "Open to Collaborations" |

The photo is uploaded with the public `avatar` purpose and saved as `avatarUrl`. The About tab's project
count comes from the Projects tab's list. Edit Profile shows the role read-only with a "Change role" link:
a role change goes through the verified role form (Settings → Account Preferences), not a plain save.

Not in the backend, so hidden: **Skills**, **Work Experience** (and their sheets) and the website link.
The removed components are in git history (`AddSkillsModal.tsx`, `AddExperienceModal.tsx`) for when the
backend adds them.

### Forums — connected (`forumsApi`, `uploadFile`)

Forums list (For you / Joined / Mine), forum view and its posts, create / edit / delete a forum with a
header image, join / leave, mute, and the members sheet (change a member's role or remove them).

### Settings — connected (`meApi`, `usersApi`)

| Method      | Path                | Used for                                                                     |
| ----------- | ------------------- | ---------------------------------------------------------------------------- |
| GET         | `/me`               | Account                                                                      |
| GET / PATCH | `/me/settings`      | Visibility (`messagePermission`), Language (shared with notification prefs)  |
| GET         | `/me/blocked-users` | Blocked accounts; `DELETE /users/:id/block` unblocks                         |
| DELETE      | `/me`               | Delete Account: `confirm: DELETE`, the password, and the reasons as feedback |

- **Visibility:** "Who can message me" offers the backend's choices: No one, People I follow, Anyone.
  "Allow collaboration requests from" isn't in the backend, so it's hidden.
- **Language** is saved to the member's settings; the app itself is English-only for now.
- **Help & Support:** there's no support endpoint, so "Send report" opens the member's email app with the
  report filled in. `SUPPORT_EMAIL` and `WHATSAPP_URL` in `HelpSettingsPage.tsx` are still placeholders.
- **Delete Account:** the backend schedules deletion in 30 days and signs out everywhere; signing in
  before then cancels it. Accounts with a password must enter it (Google-only accounts don't).

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

**Who can sign in where.** Admins and super admins use only the admin console: the backend refuses their
sign-in on the member app and hides them from members everywhere (profiles, search, suggestions,
followers, chats, collaboration requests, notification senders). Moderators are normal, visible members
who can also sign into the console. Forum moderators and project owners/admins are unrelated in-app
roles. Roles, what each can do, and how to promote someone or change the admin's email: backend
README, section 7 "Platform roles".

The admin console (Figma ADMIN page) lives entirely in `src/admin/` and is mounted at `/admin` by
`admin/routes.tsx`. It has its own login (email + password, with an OTP password reset), its own
session and token (`communiti-admin-session`, separate from members), its own sidebar layout and
its own `paths.ts`. Every admin route — including the session provider — is lazy-loaded, so members
never download admin code. Admin code may use the shared UI kit (`components/ui`), tokens and `lib/`;
**member code must never import from `src/admin/`.**

Admin screens use the generated `adminApi` (and `uploadFile` with `scope: 'admin'`) from their
`admin/hooks/queries.ts`, signed in with the admin token.
