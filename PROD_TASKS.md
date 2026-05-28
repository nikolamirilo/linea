# Linea - Production Release Task List

**Assignee legend:** 👤 You (Nikola) · 🤖 Claude · 🤝 Both

| Order | Task | Section | Assignee | Blocks | Status |
|---:|---|---|---|---|---|
| 1 | ~~Create separate production app in Forge Developer Console~~ - **already done**; existing `linea` app has dev/staging/production environments pre-provisioned and shares one `app.id` | Manifest | 👤 You | - | ✅ |
| 2 | ~~Update `manifest.yml` with the production `app.id`~~ - **not needed**; same `app.id` works for all environments, only the `-e production` flag differs | Manifest | 🤖 Claude | - | ✅ |
| 3 | Audit `permissions.scopes` and remove anything not actually called - removed `read:confluence-space.summary`, `read:confluence-user`, `write:confluence-content` (3 unused) | Manifest | 🤖 Claude | - | ✅ |
| 4 | Verify `external.fetch.backend` only lists `api.linear.app` - confirmed, only `api.linear.app` is fetched (GraphQL + OAuth token endpoints) | Manifest | 🤖 Claude | - | ✅ |
| 5 | Decide pricing model - **DECIDED:** Paid via Atlassian, flat $2.00/user/month, single SKU full access, free for ≤10 users | Manifest | 👤 You | - | ✅ |
| 6 | Confirm `licensing.enabled: true` in manifest - already set correctly for paid-via-Atlassian | Manifest | 🤖 Claude | - | ✅ |
| 7 | Remove `console.log` leak in `src/modules/linkUnfurl/resolver.js` and audit for others | Security | 🤖 Claude | - | ✅ |
| 8 | Verify all OAuth tokens stored via `storage.setSecret` in `src/lib/oauth.js` | Security | 🤖 Claude | - | ✅ |
| 9 | Confirm webhook signature verification enforced in `linearWebhookFn` | Security | 🤖 Claude | - | ✅ |
| 10 | Confirm OAuth `state` + PKCE validation in `src/lib/oauth.js` | Security | 🤖 Claude | - | ✅ |
| 11 | Add input validation (title length, priority enum, teamKey regex) to every resolver | Security | 🤖 Claude | - | ✅ |
| 12 | Strip secrets/tokens from any error messages bubbled to the UI | Security | 🤖 Claude | - | ✅ |
| 13 | Add rate limiting / debouncing on Linear API calls in `src/lib/linear` | Security | 🤖 Claude | - | ✅ |
| 14 | Run `forge lint` and resolve all warnings | Security | 🤖 Claude | - | ✅ |
| 14a | Simplify `licensing.js` to single-SKU model | Quality | 🤖 Claude | - | ✅ |
| 15 | Add error boundaries to every UI Kit entry: `action.jsx`, `view.jsx`, `config.jsx`, `ui.jsx` | Quality | 🤖 Claude | - | ✅ |
| 16 | Add empty/loading/error states for: disconnected workspace, expired token, Linear 5xx | Quality | 🤖 Claude | - | ✅ |
| 17 | Test token refresh path against an expired token | Quality | 🤖 Claude | - | ✅ |
| 18 | Verify cache invalidation on workspace reconnect | Quality | 🤖 Claude | - | ✅ |
| 19 | Add app uninstall handler that clears per-site storage (GDPR) | Quality | 🤖 Claude | - | ✅ |
| 20 | Remove `TODO.md` | Quality | 🤝 Both | - | ✅ |
| 21 | Confirm all tests passing on the release branch (`npm test`) - **83/83 passing** | Quality | 🤖 Claude | #34 | ✅ |
| 22 | Write end-user install/usage guide → `USER_GUIDE.md` | Docs | 🤖 Claude | - | ✅ |
| 23 | Trim dev-only sections from `README.md` (moved to `DEVELOPMENT.md`) | Docs | 🤖 Claude | - | ✅ |
| 24 | Add `CHANGELOG.md` for version tracking | Docs | 🤖 Claude | - | ✅ |
| 25 | Register as a Marketplace vendor at https://marketplace.atlassian.com/manage/vendors | Marketplace | 👤 You | #26 | ✅ |
| 26 | Create a **private** Marketplace listing linked to the production `app.id` | Marketplace | 👤 You | #38 | ✅ |
| 27 | Provide app logo (square PNG, 512×512 min); re-encode via `scripts/encode-logo.js` | Marketplace | 🤝 Both | - | ☐ |
| 28 | Take 4 highlight screenshots: text-to-issue, Filter macro, Link card, Rovo agent | Marketplace | 👤 You | - | ☐ |
| 29 | Draft short description (<160 chars); you approve | Marketplace | 🤖 Claude → 👤 You | - | ☐ |
| 30 | Draft long description (Markdown, feature list, data handling); you approve | Marketplace | 🤖 Claude → 👤 You | - | ☐ |
| 31 | Publish a **public privacy policy** URL describing Linear data handling | Marketplace | 👤 You | #38 | ☐ |
| 32 | Publish a **support / contact** URL | Marketplace | 👤 You | #38 | ☐ |
| 33 | Publish an **EULA** URL (Atlassian-standard EULA is fine) | Marketplace | 👤 You | #38 | ☐ |
| 34 | Create production Linear OAuth app (`Linea PROD`, new Client ID/Secret, prod callback URL only) | Atlassian | 👤 You | #36 | ✅ |
| 35 | Generate a fresh 64-char `LINEAR_WEBHOOK_SECRET` for prod (do not reuse dev) | Atlassian | 👤 You | #36 | ✅ |
| 36 | Set encrypted prod env vars (`LINEAR_CLIENT_ID`, `_SECRET`, `_WEBHOOK_SECRET`) via `forge variables set --encrypt ... -e production` | Atlassian | 👤 You | #37 | ✅ |
| 37 | `forge deploy -e production` | Dry run | 👤 You | #38 | ✅ |
| 38 | `forge install -e production --product confluence --site <test-site>` | Dry run | 👤 You | #39 | ✅ |
| 39 | Wire prod webtrigger URLs into the prod Linear OAuth app callback + webhook fields | Dry run | 👤 You | #40 | ✅ |
| 40 | Run "Quick Sanity Check" from `GET_STARTED.md:118` against prod | Dry run | 👤 You | #43 | ☐ |
| 41 | Uninstall → reinstall → verify clean state | Dry run | 👤 You | - | ☐ |
| 42 | Test on a site with Rovo disabled to verify fallback path | Dry run | 👤 You | - | ☐ |
| 43 | Submit listing for **Atlassian security review** (mandatory; 2–6 week SLA) | Submission | 👤 You | #44 | ☐ |
| 44 | Respond to reviewer findings: Claude fixes, you re-submit | Submission | 🤝 Both | #45 | ☐ |
| 45 | Flip listing from Private → Public after approval | Submission | 👤 You | #46 | ☐ |
| 46 | Announce / share install URL | Submission | 👤 You | - | ☐ |

---

## Critical path

**Unblocked work I can start now (in parallel):** #3, #4, #7–#19, #21, #22–#24

**Your earliest action items, in order:**
1. Task #25 → #26 - vendor + listing (Marketplace; vendor `Reactify Solutions` already shown in your screenshot, so #25 is partly done - just create the listing). When entering pricing, set $2.00/user/mo on every paid tier; mark 1–10 users as Free.
3. Tasks #34, #35 → #36 - Linear OAuth + secrets (use `forge variables set ... -e production`)
4. Tasks #37 → #38 → #39 - deploy/install/wire webtriggers (`-e production` everywhere)
5. Tasks #40–#42 - sanity testing
6. Task #43 - submit for review

> **Note on app version:** dev is on `2.19.0`, production environment is showing `1.1.0`. Decide before #37 whether to ship `1.1.0` or bump `package.json` to a clean release version.

**Hard gate:** Task #43 (security review) is non-negotiable for any Forge app using OAuth + external fetch. Plan for 2–6 weeks between submission and approval.
