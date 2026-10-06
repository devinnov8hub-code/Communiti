// Generates src/lib/api/types and src/lib/api/services (TypeScript types and axios
// service functions) from the backend's OpenAPI spec.
//
//   npm run api:generate          regenerate from openapi/openapi.json
//   npm run api:sync              download the latest spec first, then regenerate
//
// Never edit the generated files by hand — change this script or the name overrides below.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC_PATH = join(ROOT, 'openapi', 'openapi.json')
const API_DIR = join(ROOT, 'src', 'lib', 'api')
const SPEC_URL = 'https://api.mycommuniti.org/api/docs/openapi.json'
const PREFIX = '/api/v1'

if (process.argv.includes('--pull')) {
  const response = await fetch(SPEC_URL)
  if (!response.ok) throw new Error(`Could not download ${SPEC_URL}: ${response.status}`)
  mkdirSync(dirname(SPEC_PATH), { recursive: true })
  writeFileSync(SPEC_PATH, JSON.stringify(await response.json(), null, 2) + '\n')
  console.log(`Downloaded ${SPEC_URL}`)
}

const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8'))
const METHODS = ['get', 'post', 'put', 'patch', 'delete']

/* -------------------------------------------------------------------------- */
/* Naming                                                                     */
/* -------------------------------------------------------------------------- */

/** One file per tag: tag → { file name, path segment to drop from function names, prefix for its type names }. */
const TAGS = {
  Health: { file: 'health', strip: [] },
  Auth: { file: 'auth', strip: ['auth'] },
  Me: { file: 'me', strip: ['me'] },
  Topics: { file: 'topics', strip: [] },
  Users: { file: 'users', strip: [] },
  Uploads: { file: 'uploads', strip: [] },
  'Feed & Posts': { file: 'posts', strip: [] },
  Search: { file: 'search', strip: [] },
  Forums: { file: 'forums', strip: [] },
  Projects: { file: 'projects', strip: [] },
  Workspace: { file: 'workspace', strip: ['projects'] },
  Chat: { file: 'chat', strip: [] },
  Explore: { file: 'explore', strip: [] },
  Notifications: { file: 'notifications', strip: [] },
  Reports: { file: 'reports', strip: [] },
  Admin: { file: 'admin', strip: ['admin'], typePrefix: 'Admin' },
}

/** Function names the heuristic gets wrong or could say better. Key: "METHOD /path/after/api/v1". */
const NAME_OVERRIDES = {
  'GET /health': 'getHealth',
  'POST /auth/verify-email/resend': 'resendVerificationEmail',
  'POST /auth/admin/login': 'adminLogin',
  'POST /auth/google/token': 'loginWithGoogleToken',
  'POST /auth/password/forgot': 'forgotPassword',
  'POST /auth/password/verify-code': 'verifyPasswordResetCode',
  'POST /auth/password/reset': 'resetPassword',
  'POST /auth/password/change': 'changePassword',
  'DELETE /auth/sessions/{sessionId}': 'revokeSession',
  'GET /me/username-available': 'checkUsernameAvailable',
  'PATCH /me/onboarding': 'completeOnboarding',
  'GET /users/suggested': 'listSuggestedUsers',
  'GET /users/by-username/{username}': 'getUserByUsername',
  'GET /users/lookup': 'lookupUsers',
  'DELETE /users/{id}/follow': 'unfollowUser',
  'POST /uploads/presign': 'presignUpload',
  'GET /feed': 'getFeed',
  'POST /posts': 'createPost',
  'DELETE /posts/{id}/like': 'unlikePost',
  'DELETE /comments/{id}/like': 'unlikeComment',
  'GET /comments/{id}/replies': 'listCommentReplies',
  'GET /search': 'search',
  'GET /search/recent': 'listRecentSearches',
  'DELETE /search/recent': 'clearRecentSearches',
  'GET /trending/topics': 'listTrendingTopics',
  'GET /trending/forums': 'listTrendingForums',
  'DELETE /forums/{id}/join': 'leaveForum',
  'POST /forums/{id}/members': 'setForumMember',
  'DELETE /forums/{id}/members/{userId}': 'removeForumMember',
  'DELETE /projects/{id}/members/{userId}': 'removeProjectMember',
  'POST /conversations/{id}/messages': 'sendMessage',
  'POST /admin/broadcasts': 'sendBroadcast',
  'POST /projects/{id}/transfer-ownership': 'transferProjectOwnership',
  'POST /projects/{id}/join-requests': 'requestToJoinProject',
  'DELETE /projects/{id}/join-requests/mine': 'cancelMyJoinRequest',
  'POST /projects/{id}/join-requests/{requestId}/accept': 'acceptJoinRequest',
  'POST /projects/{id}/join-requests/{requestId}/decline': 'declineJoinRequest',
  'GET /projects/{id}/notification-settings': 'getNotificationSettings',
  'PUT /projects/{id}/notification-settings': 'setNotificationSettings',
  'POST /projects/{id}/prototypes/{prototypeId}/versions': 'createPrototypeVersion',
  'GET /conversations/unread-count': 'getUnreadMessageCount',
  'POST /conversations/direct': 'openDirectConversation',
  'DELETE /conversations/{id}/messages': 'clearConversationHistory',
  'POST /conversations/{id}/read': 'markConversationRead',
  'POST /conversations/{id}/mute': 'setConversationMuted',
  'PUT /events/{id}/rsvp': 'rsvpToEvent',
  'DELETE /events/{id}/rsvp': 'removeEventRsvp',
  'GET /featured': 'listFeaturedInnovations',
  'GET /featured/{id}': 'getFeaturedInnovation',
  'GET /notifications/unread-count': 'getUnreadNotificationCount',
  'POST /notifications/read': 'markNotificationsRead',
  'POST /push-tokens': 'registerPushToken',
  'DELETE /push-tokens': 'removePushToken',
  'POST /reports': 'createReport',
  'GET /admin/stats/overview': 'getOverviewStats',
  'GET /admin/stats/user-activity': 'getUserActivityStats',
  'POST /admin/users/{id}/status': 'setUserStatus',
  'PATCH /admin/users/{id}/role': 'setUserRole',
  'POST /admin/reports/{id}/action': 'resolveReport',
  'POST /admin/content/{type}/{id}/remove': 'removeContent',
  'POST /admin/content/{type}/{id}/restore': 'restoreContent',
  'GET /admin/content/posts': 'listPosts',
  'GET /admin/featured': 'listFeaturedInnovations',
  'POST /admin/featured': 'createFeaturedInnovation',
  'PATCH /admin/featured/{id}': 'updateFeaturedInnovation',
  'DELETE /admin/featured/{id}': 'deleteFeaturedInnovation',
}

/** Browser-redirect endpoints: generate a URL builder instead of a fetch call. */
const REDIRECTS = { 'GET /auth/google': 'googleSignInUrl' }
/** Not called by the client at all. */
const SKIP = new Set(['GET /auth/google/callback'])
/** Admin console endpoints use the admin access token. */
const ADMIN_SCOPE = (key, tag) => tag === 'Admin'
/** Sign-in endpoints must not trigger a token refresh on 401. */
const NO_REFRESH = (path) => path.startsWith('/auth/')

const KEEP_PLURAL = new Set(['research', 'status', 'stats', 'featured', 'settings', 'news'])
const singular = (word) =>
  KEEP_PLURAL.has(word)
    ? word
    : word.endsWith('ies')
      ? word.slice(0, -3) + 'y'
      : word.endsWith('sses')
        ? word.slice(0, -2)
        : word.endsWith('s') && !word.endsWith('ss')
          ? word.slice(0, -1)
          : word
const pascal = (text) =>
  text
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')
const camel = (text) => {
  const value = pascal(text)
  return value[0].toLowerCase() + value.slice(1)
}

function operationName(method, path, tag, operation, siblings) {
  const key = `${method.toUpperCase()} ${path}`
  if (NAME_OVERRIDES[key]) return NAME_OVERRIDES[key]

  const { strip } = TAGS[tag]
  const segments = path.split('/').filter(Boolean)
  // Resource words; a segment followed by a {param} is one item, so singular.
  const words = []
  segments.forEach((segment, index) => {
    if (segment.startsWith('{')) return
    if (index === 0 && strip.includes(segment)) return
    const isItem = segments[index + 1]?.startsWith('{')
    words.push(isItem ? singular(segment) : segment)
  })
  const last = segments[segments.length - 1]
  const endsWithParam = last?.startsWith('{')
  const noun = (list) => pascal(list.join('-')) || pascal(singular(TAGS[tag].file))

  if (method === 'get') {
    const isList = !endsWithParam && isListResponse(operation)
    return (isList ? 'list' : 'get') + noun(words)
  }
  if (method === 'patch') return 'update' + noun(endsWithParam ? words : singularLast(words))
  if (method === 'put') return 'set' + noun(words)
  if (method === 'delete') return 'delete' + noun(endsWithParam ? words : singularLast(words))
  // POST: a collection (has a GET sibling) creates; anything else is an action on its parent.
  if (!endsWithParam && siblings.includes('get')) return 'create' + noun(singularLast(words))
  const action = words.pop() ?? 'create'
  return camel(action) + (words.length ? noun(words) : '')
}
const singularLast = (words) => (words.length ? [...words.slice(0, -1), singular(words[words.length - 1])] : words)

/* -------------------------------------------------------------------------- */
/* JSON Schema → TypeScript                                                   */
/* -------------------------------------------------------------------------- */

const components = spec.components?.schemas ?? {}
// The backend emits "FooInput" twins of every model; they describe the same data.
const modelNames = Object.keys(components).filter((name) => !(name.endsWith('Input') && components[name.slice(0, -5)]))
const refName = (ref) => {
  const name = ref.split('/').pop()
  return name.endsWith('Input') && components[name.slice(0, -5)] ? name.slice(0, -5) : name
}

const isIdent = (key) => /^[A-Za-z_$][\w$]*$/.test(key)
const literal = (value) => JSON.stringify(value).replace(/"/g, "'")
const isObjectType = (schema) => schema?.type === 'object' && Object.keys(schema.properties ?? {}).length > 0

/** Collects the models a schema references (for imports and ordering). */
function collectRefs(schema, found = new Set()) {
  if (Array.isArray(schema)) schema.forEach((item) => collectRefs(item, found))
  else if (schema && typeof schema === 'object') {
    if (typeof schema.$ref === 'string') found.add(refName(schema.$ref))
    Object.values(schema).forEach((value) => collectRefs(value, found))
  }
  return found
}

/** Notes worth keeping next to a field: the backend's description plus its validation limits. */
function fieldNotes(schema) {
  const limits = []
  if (schema.format && schema.format !== 'uuid') limits.push(schema.format)
  if (schema.minLength !== undefined && schema.maxLength !== undefined) {
    limits.push(`${schema.minLength}–${schema.maxLength} characters`)
  } else if (schema.maxLength !== undefined) limits.push(`max ${schema.maxLength} characters`)
  else if (schema.minLength !== undefined) limits.push(`min ${schema.minLength} characters`)
  if (schema.minimum !== undefined && schema.maximum !== undefined) limits.push(`${schema.minimum}–${schema.maximum}`)
  else if (schema.minimum !== undefined) limits.push(`min ${schema.minimum}`)
  if (schema.maxItems !== undefined) limits.push(`max ${schema.maxItems} items`)
  if (schema.default !== undefined) limits.push(`default ${literal(schema.default)}`)
  const text = [schema.description, limits.length && `(${limits.join(', ')})`].filter(Boolean).join(' ')
  return text.replace(/\*\//g, '*\\/')
}

function toTs(schema, indent = '') {
  if (!schema || Object.keys(schema).length === 0) return 'unknown'
  if (schema.$ref) return refName(schema.$ref)

  for (const keyword of ['anyOf', 'oneOf']) {
    if (schema[keyword]) return [...new Set(schema[keyword].map((option) => toTs(option, indent)))].join(' | ')
  }
  if (Array.isArray(schema.type)) {
    return [...new Set(schema.type.map((type) => toTs({ ...schema, type }, indent)))].join(' | ')
  }
  if (schema.const !== undefined) return literal(schema.const)
  if (schema.enum) return schema.enum.map(literal).join(' | ')

  switch (schema.type) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'array': {
      const item = toTs(schema.items ?? {}, indent)
      return /[ |]/.test(item) && !item.startsWith('{') ? `(${item})[]` : `${item}[]`
    }
    case 'object':
    default: {
      const properties = schema.properties ?? {}
      const keys = Object.keys(properties)
      if (keys.length === 0) {
        const extra = schema.additionalProperties
        return `Record<string, ${extra && typeof extra === 'object' ? toTs(extra, indent) : 'unknown'}>`
      }
      const required = new Set(schema.required ?? [])
      const inner = indent + '  '
      const lines = keys.map((key) => {
        const notes = fieldNotes(properties[key])
        const doc = notes ? `${inner}/** ${notes} */\n` : ''
        return `${doc}${inner}${isIdent(key) ? key : literal(key)}${required.has(key) ? '' : '?'}: ${toTs(properties[key], inner)}`
      })
      return `{\n${lines.join('\n')}\n${indent}}`
    }
  }
}

/** `export interface Name { … }` for objects, `export type Name = …` for everything else. */
function declareType(name, schema) {
  const description = schema.description ? `/** ${schema.description.replace(/\*\//g, '*\\/')} */\n` : ''
  return isObjectType(schema)
    ? `${description}export interface ${name} ${toTs(schema)}`
    : `${description}export type ${name} = ${toTs(schema)}`
}

/* -------------------------------------------------------------------------- */
/* Models                                                                     */
/* -------------------------------------------------------------------------- */

function sortModels(names) {
  const sorted = []
  const state = new Map()
  const visit = (name, trail) => {
    if (state.get(name) === 'done') return
    if (state.get(name) === 'visiting') throw new Error(`Circular model reference: ${[...trail, name].join(' → ')}`)
    state.set(name, 'visiting')
    for (const dependency of collectRefs(components[name])) if (dependency !== name) visit(dependency, [...trail, name])
    state.set(name, 'done')
    sorted.push(name)
  }
  names.forEach((name) => visit(name, []))
  return sorted
}

const HEADER = `// GENERATED by scripts/generate-api.mjs from the backend OpenAPI spec — do not edit.\n// Re-run \`npm run api:sync\` after the backend changes.\n`

/* -------------------------------------------------------------------------- */
/* Operations                                                                 */
/* -------------------------------------------------------------------------- */

const successResponse = (operation) => {
  const code = Object.keys(operation.responses ?? {}).find((status) => status.startsWith('2'))
  return operation.responses?.[code]?.content?.['application/json']?.schema
}
function isListResponse(operation) {
  const schema = successResponse(operation)
  return schema?.type === 'array' || schema?.properties?.data?.type === 'array'
}

/** Per API area: its request/response types and its axios service functions. */
const areas = new Map(
  Object.values(TAGS).map((tag) => [
    tag.file,
    {
      types: [],
      services: [],
      names: new Set(),
      typeModels: new Set(),
      serviceModels: new Set(),
      usedTypes: new Set(),
    },
  ]),
)
const summaryRows = []
// Type names are exported flat from src/lib/api, so they must be unique across areas.
const globalNames = new Map()

for (const [fullPath, pathItem] of Object.entries(spec.paths)) {
  const path = fullPath.startsWith(PREFIX) ? fullPath.slice(PREFIX.length) : fullPath
  const siblings = METHODS.filter((method) => pathItem[method])
  for (const method of siblings) {
    const operation = pathItem[method]
    const key = `${method.toUpperCase()} ${path}`
    if (SKIP.has(key)) continue
    const tag = operation.tags?.[0]
    if (!TAGS[tag]) throw new Error(`Unknown tag "${tag}" on ${key} — add it to TAGS`)
    const area = areas.get(TAGS[tag].file)

    const name = REDIRECTS[key] ?? operationName(method, path, tag, operation, siblings)
    if (area.names.has(name)) throw new Error(`Duplicate function name "${name}" (${key}) — add a NAME_OVERRIDES entry`)
    area.names.add(name)
    // e.g. adminApi.listForums → AdminListForumsQuery, so it can't clash with forumsApi.listForums.
    const Type = (TAGS[tag].typePrefix ?? '') + pascal(name)

    const declare = (suffix, schema) => {
      const typeName = `${Type}${suffix}`
      if (globalNames.has(typeName)) {
        throw new Error(`Type "${typeName}" is generated twice (${globalNames.get(typeName)} and ${key}) — rename one`)
      }
      globalNames.set(typeName, key)
      collectRefs(schema, area.typeModels)
      area.types.push(declareType(typeName, schema))
      area.usedTypes.add(typeName)
      return typeName
    }

    const parameters = [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]
    const pathParams = parameters.filter((parameter) => parameter.in === 'path')
    const queryParams = parameters.filter((parameter) => parameter.in === 'query')
    const bodySchema = operation.requestBody?.content?.['application/json']?.schema
    const bodyRequired = operation.requestBody?.required !== false
    const responseSchema = successResponse(operation)

    const args = pathParams.map((parameter) => `${camel(parameter.name)}: string`)
    const config = []
    const url = '`' + fullPath.replace(/\{(\w+)\}/g, (_, param) => '${encodeURIComponent(' + camel(param) + ')}') + '`'

    if (queryParams.length) {
      const querySchema = {
        type: 'object',
        properties: Object.fromEntries(
          queryParams.map((parameter) => [
            parameter.name,
            { ...parameter.schema, description: parameter.description ?? parameter.schema?.description },
          ]),
        ),
        required: queryParams.filter((parameter) => parameter.required).map((parameter) => parameter.name),
      }
      args.push(`params${querySchema.required.length === 0 ? '?' : ''}: ${declare('Query', querySchema)}`)
      config.push('params')
    }

    const hasBody = Boolean(bodySchema) && !REDIRECTS[key]
    if (hasBody) args.push(`data${bodyRequired ? '' : '?'}: ${declare('Body', bodySchema)}`)

    let returns = 'void'
    if (responseSchema) {
      if (responseSchema.$ref) {
        returns = refName(responseSchema.$ref)
        area.serviceModels.add(returns)
      } else returns = declare('Response', responseSchema)
    }

    if (ADMIN_SCOPE(key, tag)) config.push(`scope: 'admin'`)
    if (!operation.security?.length) config.push('skipAuth: true')
    if (NO_REFRESH(path)) config.push('skipRefresh: true')

    const doc = [
      operation.summary,
      operation.description && operation.description.replace(/\*\//g, '*\\/').split('\n').join('\n * '),
      `\`${method.toUpperCase()} ${fullPath}\``,
    ]
      .filter(Boolean)
      .join('\n *\n * ')

    if (REDIRECTS[key]) {
      area.services.push(
        `/**\n * ${doc}\n *\n * Send the browser here (\`window.location.assign(...)\`); it redirects to Google.\n */\nexport const ${name} = (${args.join(', ')}) => api.getUri({ url: ${url}${queryParams.length ? ', params' : ''} })`,
      )
    } else {
      const options = config.length ? `{ ${config.join(', ')} }` : ''
      // axios: get/delete take (url, config); post/put/patch take (url, data, config).
      const withBody = ['post', 'put', 'patch'].includes(method)
      const callArgs = withBody
        ? [url, hasBody ? 'data' : options ? 'undefined' : '', options]
        : [url, hasBody ? `{ ${[...config, 'data'].join(', ')} }` : options]
      area.services.push(
        `/**\n * ${doc}\n */\nexport const ${name} = (${args.join(', ')}) =>\n  api.${method}<${returns}>(${callArgs.filter(Boolean).join(', ')}).then(unwrap)`,
      )
    }
    summaryRows.push({ tag: TAGS[tag].file, name, key })
  }
}

/* -------------------------------------------------------------------------- */
/* Write                                                                      */
/* -------------------------------------------------------------------------- */

const DIRS = { types: join(API_DIR, 'types'), services: join(API_DIR, 'services') }
for (const dir of Object.values(DIRS)) {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
}
const importList = (names) => [...names].sort((a, b) => a.localeCompare(b)).join(', ')

// Models: every named object the backend returns (Post, Project, UserSummary…).
writeFileSync(
  join(DIRS.types, 'models.types.ts'),
  `${HEADER}\n${sortModels(modelNames)
    .map((name) => declareType(name, components[name]))
    .join('\n\n')}\n`,
)

const written = []
for (const [fileName, area] of areas) {
  if (!area.services.length) continue
  written.push(fileName)

  if (area.types.length) {
    const modelImport = area.typeModels.size
      ? `import type { ${importList(area.typeModels)} } from './models.types'\n\n`
      : '\n'
    writeFileSync(join(DIRS.types, `${fileName}.types.ts`), `${HEADER}${modelImport}${area.types.join('\n\n')}\n`)
  }

  const body = area.services.join('\n\n')
  const imports = [
    `import { ${body.includes('.then(unwrap)') ? 'api, unwrap' : 'api'} } from '../client'`,
    area.usedTypes.size && `import type { ${importList(area.usedTypes)} } from '../types/${fileName}.types'`,
    area.serviceModels.size && `import type { ${importList(area.serviceModels)} } from '../types/models.types'`,
  ].filter(Boolean)
  writeFileSync(join(DIRS.services, `${fileName}.service.ts`), `${HEADER}${imports.join('\n')}\n\n${body}\n`)
}

const withTypes = written.filter((fileName) => areas.get(fileName).types.length)
writeFileSync(
  join(DIRS.types, 'index.ts'),
  `${HEADER}export type * from './models.types'\n${withTypes.map((file) => `export type * from './${file}.types'`).join('\n')}\n`,
)
writeFileSync(
  join(DIRS.services, 'index.ts'),
  `${HEADER}${written.map((file) => `export * as ${camel(file)}Api from './${file}.service'`).join('\n')}\n`,
)

console.log(
  `Generated ${summaryRows.length} endpoints and ${modelNames.length} models into src/lib/api/{services,types}/`,
)
if (process.argv.includes('--list'))
  for (const row of summaryRows) console.log(`${row.tag}Api.${row.name}`.padEnd(48), row.key)
