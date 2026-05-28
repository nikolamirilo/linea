# Linea — Production Readiness & Marketplace Publishing Checklist

**Legend:**
- 👤 **You (Nikola)** — anything that requires logging into Atlassian, Linear, or Marketplace, or making a business decision (pricing, legal text, screenshots)
- 🤖 **Claude** — all code, config, manifest, test, and doc changes inside this repo
- 🤝 **Both** — Claude prepares; you click the final button (deploy/install/submit)

---

## 1. Manifest & app identity

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 1.1 | Create a **separate production app** in the Forge Developer Console (don't reuse the dev `app.id`) | 👤 You | ☐ |
| 1.2 | Update `manifest.yml` with the new production `app.id` | 🤖 Claude | ☐ |
| 1.3 | Audit `permissions.scopes` and remove anything not actually called (each scope extends review time) | 🤖 Claude | ☐ |
| 1.4 | Confirm `licensing.enabled` matches the chosen pricing model | 🤝 Both | ☐ |
| 1.5 | Decide pricing: Free / Paid-via-Atlassian / Paid-elsewhere | 👤 You | ☐ |
| 1.6 | Verify `external.fetch.backend` only lists `api.linear.app` | 🤖 Claude | ☐ |

## 2. Security hardening (required for Atlassian security review)

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 2.1 | Remove the only `console.log` leak in `src/modules/linkUnfurl/resolver.js` and audit for any others | 🤖 Claude | ☐ |
| 2.2 | Verify all OAuth tokens stored via `storage.setSecret` (not `storage.set`) in `src/lib/oauth.js` | 🤖 Claude | ☐ |
| 2.3 | Confirm Linear webhook signature verification is enforced in `linearWebhookFn` | 🤖 Claude | ☐ |
| 2.4 | Confirm OAuth `state` + PKCE validation in `src/lib/oauth.js` | 🤖 Claude | ☐ |
| 2.5 | Add input validation (title length, priority enum, teamKey regex) to every resolver | 🤖 Claude | ☐ |
| 2.6 | Strip secrets/tokens from any error messages bubbled to the UI | 🤖 Claude | ☐ |
| 2.7 | Add rate limiting / debouncing on Linear API calls in `src/lib/linear` | 🤖 Claude | ☐ |
| 2.8 | Run `forge lint` and resolve all warnings | 🤖 Claude | ☐ |
| 2.9 | Create a **dedicated Linear OAuth app for production** (new Client ID/Secret, prod callback URL only) | 👤 You | ☐ |
| 2.10 | Set production env vars: `forge variables set --encrypt LINEAR_CLIENT_SECRET ... -e production` (×3) | 👤 You | ☐ |
| 2.11 | Generate a fresh 64-char `LINEAR_WEBHOOK_SECRET` for prod (do **not** reuse dev) | 👤 You | ☐ |

## 3. Quality & reliability

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 3.1 | All 81 tests passing on the release branch (`npm test`) | 🤖 Claude | ☐ |
| 3.2 | Add error boundaries to every UI Kit entry: `action.jsx`, `view.jsx`, `config.jsx`, `ui.jsx` | 🤖 Claude | ☐ |
| 3.3 | Add empty/loading/error states for: disconnected workspace, expired token, Linear 5xx | 🤖 Claude | ☐ |
| 3.4 | Test token refresh path against an expired token | 🤖 Claude | ☐ |
| 3.5 | Verify cache invalidation on workspace reconnect | 🤖 Claude | ☐ |
| 3.6 | Add app uninstall handler that clears per-site storage (GDPR) | 🤖 Claude | ☐ |
| 3.7 | Resolve or remove `TODO.md` (DeepSeek integration) before release | 🤝 Both | ☐ |

## 4. Atlassian Marketplace listing

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 4.1 | Register as a Marketplace vendor at https://marketplace.atlassian.com/manage/vendors | 👤 You | ☐ |
| 4.2 | Create a **private listing** linked to the production `app.id` | 👤 You | ☐ |
| 4.3 | App logo (square PNG, 512×512 min) — Claude can re-encode using `scripts/encode-logo.js` | 🤝 Both | ☐ |
| 4.4 | Take 4 highlight screenshots: text-to-issue, Filter macro, Link card, Rovo agent | 👤 You | ☐ |
| 4.5 | Write short description (<160 chars) | 🤖 Claude (draft) → 👤 You (approve) | ☐ |
| 4.6 | Write long description (Markdown, feature list, what data is processed) | 🤖 Claude (draft) → 👤 You (approve) | ☐ |
| 4.7 | Publish a **public privacy policy** URL describing Linear data handling | 👤 You | ☐ |
| 4.8 | Publish a **support / contact** URL | 👤 You | ☐ |
| 4.9 | Publish an **EULA** URL (Atlassian-standard EULA is fine) | 👤 You | ☐ |
| 4.10 | Set categories (*Integrations*, *Project management*) and tags | 👤 You | ☐ |

## 5. Documentation

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 5.1 | Write end-user install/usage guide (separate from dev-focused `GET_STARTED.md`) | 🤖 Claude | ☐ |
| 5.2 | Trim dev-only sections from `README.md` before linking it publicly | 🤖 Claude | ☐ |
| 5.3 | Add CHANGELOG.md for version tracking | 🤖 Claude | ☐ |

## 6. Pre-submit dry run on prod environment

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 6.1 | `forge deploy -e production` | 👤 You | ☐ |
| 6.2 | `forge install -e production --product confluence --site <test-site>` | 👤 You | ☐ |
| 6.3 | Wire prod webtrigger URLs into the prod Linear OAuth app | 👤 You | ☐ |
| 6.4 | Run the "Quick Sanity Check" from `GET_STARTED.md:118` against prod | 👤 You | ☐ |
| 6.5 | Uninstall → reinstall → verify clean state | 👤 You | ☐ |
| 6.6 | Test on a site with **Rovo disabled** to verify fallback path | 👤 You | ☐ |

## 7. Submission

| # | Task | Assignee | Status |
|---|------|----------|--------|
| 7.1 | Submit listing for **Atlassian security review** (mandatory — expect 2–6 weeks) | 👤 You | ☐ |
| 7.2 | Respond to any reviewer findings (Claude fixes; you re-submit) | 🤝 Both | ☐ |
| 7.3 | Flip listing from Private → Public after approval | 👤 You | ☐ |
| 7.4 | Announce / share install URL | 👤 You | ☐ |

---

## Suggested order of attack

1. **Section 2** (Security) — biggest blocker for review, all code work
2. **Section 1** (Manifest) — needs your prod app.id from Forge console (1.1)
3. **Section 3** (Quality) — code work
4. **Section 5** (Docs) — code work
5. **Section 4** (Marketplace listing) — your assets + my drafts in parallel
6. **Section 6** (Dry run) — once code is frozen
7. **Section 7** (Submit) — last
