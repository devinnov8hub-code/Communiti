# CommUniti — Web

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
    projects/     projects list
    chats/        messages, project chats, conversation, collaboration requests
    explore/      suggested, highlights, featured innovations, events
    profile/      profile, edit profile, skills, work experience
    forums/       forums list, forum view, create forum
    settings/     account, language, theme, privacy, policy, visibility, help, delete account, sign out
    notifications/ notifications list + settings
  hooks/          shared hooks
  lib/            api client, storage, formatting, class-name helper
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

## Backend integration

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. While it is empty every feature uses
its in-browser mock (seeded with the Figma content; any 4-digit sign-in code works). Each
`*.service.ts` exports the API interface, the real HTTP implementation and picks one at startup,
so pointing at the backend needs no component changes.

Requests send `Authorization: Bearer <token>`; errors should return `{ message }`. Endpoints that
upload files accept `multipart/form-data`. Response shapes are the types in each feature's `types.ts`.

### Auth — `features/auth/api/auth.service.ts`

| Method | Path                  | Body                             | Returns           |
| ------ | --------------------- | -------------------------------- | ----------------- |
| POST   | `/auth/signup`        | `{ email }`                      | — (emails a code) |
| POST   | `/auth/login`         | `{ email }`                      | — (emails a code) |
| POST   | `/auth/verify`        | `{ email, code, flow }`          | `{ token, user }` |
| PATCH  | `/users/me/profile`   | `{ role, dateOfBirth, country }` | `User`            |
| PUT    | `/users/me/interests` | `{ topics: string[] }`           | `User`            |
| GET    | `/auth/google`        | — (browser redirect, OAuth)      | —                 |

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

### Projects — `features/projects/api/projects.service.ts`

| Method | Path                        | Returns     |
| ------ | --------------------------- | ----------- |
| GET    | `/projects?scope=all\|mine` | `Project[]` |

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

| Method      | Path                   | Body                                  | Returns              |
| ----------- | ---------------------- | ------------------------------------- | -------------------- |
| GET / PATCH | `/users/me/account`    | `AccountSettings` (without email)     | `AccountSettings`    |
| GET / PUT   | `/users/me/visibility` | `{ messages, collaborationRequests }` | `VisibilitySettings` |
| GET / PUT   | `/users/me/language`   | `{ language }`                        | `{ language }`       |
| POST        | `/support/reports`     | `{ message }`                         | —                    |
| DELETE      | `/users/me`            | `{ reasons: string[] }`               | —                    |

### Notifications — `features/notifications/api/notifications.service.ts`

| Method    | Path                         | Body                                | Returns                   |
| --------- | ---------------------------- | ----------------------------------- | ------------------------- |
| GET       | `/notifications`             |                                     | `AppNotification[]`       |
| POST      | `/notifications/:id/read`    |                                     | —                         |
| POST      | `/notifications/read-all`    |                                     | —                         |
| GET / PUT | `/notifications/preferences` | `{ muted: NotificationCategory[] }` | `NotificationPreferences` |

Server state is managed with TanStack Query (`features/*/hooks/queries.ts`); likes and read
states are optimistic, other mutations update or invalidate the cache.
