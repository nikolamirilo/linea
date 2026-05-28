# Linea — Developer Guide

Architecture, folder structure, design principles, and contributor setup for
the Linea Forge app. End users should refer to `USER_GUIDE.md` instead.

---

## High-Level Architecture

Linea is built on the [Atlassian Forge](https://developer.atlassian.com/platform/forge/) platform and follows its module-based architecture. The app runs entirely on Forge's serverless runtime — there is no separate backend server.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Confluence                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Content      │  │ Global Page  │  │ Macro                  │ │
│  │ Action       │  │ (Config)     │  │ (Linear Filter)        │ │
│  │              │  │              │  │                        │ │
│  │ action.jsx   │  │ ui.jsx       │  │ view.jsx / config.jsx  │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘ │
│         │                 │                   │                 │
│         ▼                 ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Shared Components, Hooks & Utils               │ │
│  │                    (src/shared/)                             │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │ invoke()                           │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Forge Resolvers                           │ │
│  │         (resolver.js in each module folder)                 │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Library Layer (src/lib/)                  │ │
│  │   linear/  ·  cache/  ·  oauth  ·  rovo  ·  security        │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│                   Linear GraphQL API                            │
│                 (api.linear.app/graphql)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Data flow

1. **UI Layer** — React components rendered with `@forge/react` in Forge's UI Kit. Each module has a slim orchestrator component that composes shared components and hooks.
2. **Bridge Layer** — UI components call backend resolvers via `invoke()` from `@forge/bridge`. This is the boundary between frontend and backend in Forge.
3. **Resolver Layer** — `@forge/resolver` endpoints handle business logic: loading/saving config, querying Linear, drafting issues, etc.
4. **Library Layer** — Shared utilities for Linear API communication (GraphQL client, token management), caching (KVS + SQL), OAuth, AI drafting, input validation, and licensing.
5. **External API** — All Linear data comes from the [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api).

### Authentication

Linear workspace access is managed via OAuth 2.0 with PKCE. Tokens are stored in Forge's encrypted secret storage (`storage.setSecret`). Token refresh is handled automatically when tokens are close to expiry.

### Per-site cache invalidation

The `disconnectWorkspace(siteId)` helper in `src/lib/oauth.js` clears all
known per-site state (tokens, cached teams/labels/projects/issues, AI usage
counters, macro configs) so that reconnecting to a different Linear workspace
never surfaces stale data. The same helper is invoked by the Forge
`avi:forge:uninstalled:app` lifecycle handler in `src/lifecycle/uninstall.js`
to satisfy GDPR right-to-erasure on uninstall.

---

## Folder Structure

```
linea/
├── __mocks__/                    # Jest manual mocks for Forge APIs
│   └── @forge/
│       ├── api.js                # Mocks for storage, fetch, webTrigger
│       ├── resolver.js           # Mock Resolver class
│       └── sql.js                # Mock for @forge/sql
│
├── __tests__/                    # Test suites
│   ├── lib/                      # Unit tests for library modules
│   │   ├── cache.test.js
│   │   ├── linear.test.js
│   │   ├── oauth.test.js
│   │   └── security.test.js
│   └── modules/                  # Integration tests for resolver endpoints
│       ├── filterMacro.test.js
│       ├── linkUnfurl.test.js
│       └── rovoAgent.test.js
│
├── scripts/                      # Build/utility scripts
│   └── encode-logo.js            # Encodes Linear logo to base64 data URI
│
├── src/                          # Application source code
│   ├── index.js                  # Entry point — re-exports all handlers for manifest.yml
│   │
│   ├── lib/                      # Shared backend libraries
│   │   ├── cache/                # Cache layer (split by ISP)
│   │   │   ├── kvsCache.js       #   KVS cache — small, high-frequency items (teams, labels, issues)
│   │   │   └── sqlCache.js       #   SQL cache — larger payloads (filter results)
│   │   ├── cache.js              #   Backward-compatible facade re-exporting both
│   │   │
│   │   ├── linear/               # Linear API layer (split by SRP)
│   │   │   ├── client.js         #   GraphQL transport + token management + rate limiting
│   │   │   ├── queries.js        #   All GraphQL query/mutation builders
│   │   │   └── urlParser.js      #   Linear URL parser + filter-based query orchestration
│   │   ├── linear.js             #   Backward-compatible facade re-exporting all
│   │   │
│   │   ├── context.js            # Shared getSiteId() + buildMacroKey() + safeKeySegment()
│   │   ├── licensing.js          # Single-SKU license checks (free vs paid)
│   │   ├── oauth.js              # OAuth 2.0 + PKCE flow (authorize, callback, disconnect)
│   │   ├── rovo.js               # AI draft generation (heuristic-based) + usage quota
│   │   └── security.js           # Input validation, sanitization, error scrubbing
│   │
│   ├── lifecycle/                # Forge lifecycle event handlers
│   │   └── uninstall.js          #   Clears per-site data on app uninstall (GDPR)
│   │
│   ├── shared/                   # Shared frontend code (used across modules)
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── IssueCard.jsx
│   │   │   ├── LabeledField.jsx
│   │   │   ├── LinearIssueInline.jsx
│   │   │   ├── LinearLogo.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── MarkdownRenderer.jsx
│   │   │   └── NotConnectedState.jsx
│   │   │
│   │   ├── constants/            # Shared configuration constants
│   │   │   ├── columns.js
│   │   │   ├── presets.js
│   │   │   └── priorities.js
│   │   │
│   │   ├── hooks/                # Shared React hooks
│   │   │   ├── useForgeContext.js
│   │   │   ├── useIssues.js
│   │   │   └── useMacroConfig.js
│   │   │
│   │   └── utils/                # Pure utility functions
│   │       ├── columnWidths.js
│   │       └── formatters.js
│   │
│   ├── modules/                  # Feature modules (each maps to a manifest.yml entry)
│   │   ├── config/               # Global configuration page
│   │   ├── filterMacro/          # Linear Filter macro (live issue table)
│   │   ├── linkUnfurl/           # Smart link fallback resolver
│   │   ├── linearLink/           # Linear Link macro
│   │   ├── rovoAgent/            # Rovo Task Specialist action handler
│   │   └── textToIssue/          # AI text-to-issue context menu
│   │
│   ├── scheduledTrigger/         # Periodic background tasks
│   │   └── refreshCache.js       #   Invalidates stale SQL cache entries every 5 minutes
│   │
│   └── webtriggers/              # HTTP endpoints for external callbacks
│       ├── oauthCallback.js      #   Handles OAuth redirect from Linear
│       └── linearWebhook.js      #   Receives Linear webhook events
│
├── static/                       # Static assets
├── manifest.yml                  # Forge app manifest
├── package.json
├── jest.config.js
├── COMMANDS.md                   # Common forge CLI invocations
├── PROD_TASKS.md                 # Production release task list
├── README.md                     # Public-facing project intro
├── USER_GUIDE.md                 # End-user install/usage guide
├── CHANGELOG.md
└── DEVELOPMENT.md                # This file
```

---

## Module purposes

### `src/lib/` — Backend Library Layer

| Module | Purpose |
|--------|---------|
| `linear/client.js` | GraphQL transport — sends authenticated requests, refreshes tokens, retries 429/5xx with backoff, throttles concurrent requests |
| `linear/queries.js` | Query builders — all GraphQL query and mutation definitions |
| `linear/urlParser.js` | URL parsing — converts Linear app URLs into GraphQL filters |
| `cache/kvsCache.js` | TTL-based KVS cache for small, high-frequency data |
| `cache/sqlCache.js` | SQL cache for larger payloads (filter result sets) |
| `context.js` | Request context — `getSiteId`, `buildMacroKey`, `safeKeySegment` |
| `oauth.js` | OAuth 2.0 + PKCE flow + per-site disconnect/cleanup |
| `rovo.js` | AI drafting (heuristic-based) + monthly usage quota |
| `security.js` | Input validation, prompt-injection filtering, error sanitization, secret scrubbing |
| `licensing.js` | Single-SKU license check (free vs paid) |

### `src/modules/` — Feature Modules

| Module | Forge Type | User-Facing Feature |
|--------|-----------|-------------------|
| `config/` | `confluence:globalPage` | Admin page to connect/disconnect Linear workspace |
| `filterMacro/` | `macro` | Live, filterable table of Linear issues embedded on a page |
| `linearLink/` | `macro` | Single Linear issue rendered as URL/inline/card |
| `linkUnfurl/` | `graph:smartLink` | Best-effort fallback resolver for raw Linear URLs |
| `textToIssue/` | `confluence:contextMenu` | Right-click selected text → AI-drafted Linear issue |
| `rovoAgent/` | `rovo:agent` + `rovo:action` | Linea Task Specialist agent (Rovo-required) |

### `src/webtriggers/` — External Callbacks

| Trigger | Purpose |
|---------|---------|
| `oauthCallback.js` | Receives Linear OAuth redirect, exchanges code for tokens |
| `linearWebhook.js` | Receives Linear webhook events (HMAC-SHA256 verified), invalidates caches |

### `src/scheduledTrigger/` — Background Tasks

| Trigger | Purpose |
|---------|---------|
| `refreshCache.js` | Invalidates SQL cache entries older than 10 min, every 5 min |

### `src/lifecycle/` — Forge Lifecycle Hooks

| Handler | Trigger Event | Purpose |
|---------|---------------|---------|
| `uninstall.js` | `avi:forge:uninstalled:app` | Clears all per-site Linear data on uninstall (GDPR) |

---

## Design principles

The codebase follows **SOLID** principles:

- **Single Responsibility** — Each component, hook, and module has one reason to change.
- **Open/Closed** — Column definitions and presets are in shared constants, making them extensible without modifying rendering code.
- **Liskov Substitution** — All resolvers return a consistent error shape (`{ error: string }`).
- **Interface Segregation** — `linear.js` is split into `client.js` + `queries.js`; `cache.js` is split into `kvsCache.js` + `sqlCache.js`.
- **Dependency Inversion** — Forge context extraction is abstracted behind the `useForgeContext` hook; backend context helpers are centralized in `lib/context.js`.

---

## Local development

```bash
# Install dependencies
npm install

# Run tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Forge CLI lint
npm run lint

# Re-encode the Linear logo after replacing static/linear-logo.png
npm run encode-logo

# Deploy to a Forge environment
forge deploy -e development        # or staging / production

# Install onto a Confluence site
forge install -e development --product confluence --site <site>.atlassian.net
```

---

## Environment variables

Set these via `forge variables set --encrypt <KEY> <VALUE> -e <env>`:

| Variable | Description |
|----------|-------------|
| `LINEAR_CLIENT_ID` | OAuth client ID from your Linear app (per-environment) |
| `LINEAR_CLIENT_SECRET` | OAuth client secret from your Linear app (per-environment) |
| `LINEAR_WEBHOOK_SECRET` | Shared secret for verifying Linear webhook HMAC signatures |

Each Forge environment (development / staging / production) keeps its own
copy of these variables, isolated by Forge runtime. Tokens, KVS, and SQL data
are also isolated per environment.

---

## Releasing to production

See `PROD_TASKS.md` in the repo root for the full release checklist
(security hardening, manifest scope audit, Marketplace listing setup,
security review submission, etc.).
