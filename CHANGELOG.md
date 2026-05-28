# Changelog

All notable changes to Linea are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- App uninstall lifecycle handler (`avi:forge:uninstalled:app`) that clears
  all per-site Linear data - OAuth tokens, cached teams/labels/projects/issues,
  macro configurations, AI usage counters - on uninstall. Implements GDPR
  right-to-erasure.
- Centralized error sanitizer (`sanitizeUserError`) and secret-leak detection
  (`looksLikeSecret`) in `src/lib/security.js`. Resolver error messages
  bubbled to the UI now strip token-like substrings, JWTs, and bearer
  headers; messages are also length-capped.
- URL, priority, and issue-type validators in `src/lib/security.js` wired into
  every resolver that accepts user input.
- React error boundary (`src/shared/components/ErrorBoundary.jsx`) wrapping
  every UI Kit entry point (`action.jsx`, `ui.jsx`, both macro `view.jsx`
  files, both macro `config.jsx` files).
- `NotConnectedState` component shown when the Linear workspace is not yet
  connected or when OAuth tokens have expired/been revoked. Provides an
  actionable pointer to the Linear Configuration page.
- Linear API client now retries 429 and 5xx responses with exponential
  backoff (3 attempts, honoring the `Retry-After` header when present), and
  throttles at most 10 concurrent requests per process.
- Token-refresh tests covering the near-expiry refresh path and the
  expired/revoked refresh-token failure mode.
- `src/lib/context.js` now includes `safeKeySegment` to validate caller-
  supplied storage-key fragments (page IDs, macro IDs) against an
  allow-listed character set.
- `USER_GUIDE.md` for end users and Confluence admins.
- `DEVELOPMENT.md` consolidating architecture, folder structure, and
  contributor setup (split out from README.md).
- `PROD_TASKS.md` tracking the production release / Marketplace publishing
  workflow.
- `CHANGELOG.md` (this file).

### Changed
- Simplified `src/lib/licensing.js` to a single-SKU model matching the launch
  pricing decision (free for ≤10 users, $2/user/month with full access for
  paying customers). Removed the previously-defined `team` / `business` /
  `enterprise` tier scaffolding.
- `disconnectWorkspace` now performs prefix-based cleanup of all known
  per-site cache namespaces (`issue:*`, `projects:*`, `usage:*`,
  `macro_config:*`) in addition to the scalar keys it already cleaned.
- `manifest.yml` permission scopes trimmed: removed unused
  `read:confluence-space.summary`, `read:confluence-user`, and
  `write:confluence-content`. Kept `read:confluence-content.all`,
  `read:page:confluence`, and `storage:app`.
- README.md is now a slim public-facing intro pointing to USER_GUIDE.md and
  DEVELOPMENT.md.

### Fixed
- Removed two `console.log` calls in `src/modules/linkUnfurl/resolver.js`
  that were logging full request payloads and resolved URL identifiers.
- `src/webtriggers/oauthCallback.js` no longer logs full error objects
  (which could carry the OAuth code or upstream tokens) and no longer
  bubbles raw error messages to the browser.
- All resolver `console.error` calls now log only `err?.message` instead of
  the full error object, preventing accidental token/secret leaks via Forge
  app logs.

### Security
- Added forge lint to the release checklist; build passes with zero warnings.
- All OAuth state and access/refresh tokens confirmed to use
  `storage.setSecret` (Forge encrypted secret storage). OAuth flow uses 32-
  byte random `state` and PKCE S256 code challenge, with constant-time
  signature comparison (`crypto.timingSafeEqual`) on inbound Linear webhooks.

## [1.1.0] - 2026-01-15

Initial Marketplace-track release. Feature set complete: text-to-issue,
Linear Filter macro, Linear Link macro, Rovo Task Specialist agent.

[Unreleased]: https://github.com/reactify-solutions/linea/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/reactify-solutions/linea/releases/tag/v1.1.0
