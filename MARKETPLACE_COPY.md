# Marketplace Listing Copy — Linea

Source-of-truth copy for the Atlassian Marketplace listing fields. Paste into
the corresponding fields in the listing form. Review and edit anything that
doesn't match Reactify Solutions' voice before submitting.

---

## App name (required, ≤60 chars)

```
Linea — Linear for Confluence
```

(28 chars; well under the 60 limit. The em dash is intentional and renders
correctly in Marketplace.)

Alternative if Marketplace strips the em dash:
```
Linea: Linear for Confluence
```

---

## Tagline / short description (≤160 chars) — Task #29

**Option A (recommended — leads with the AI hook):**
```
Turn highlighted Confluence text into Linear issues with AI. Embed live filtered Linear lists. Render rich Linear cards from any URL. One-click setup.
```
(155 chars)

**Option B (feature-forward, no AI claim):**
```
Bring Linear into Confluence: AI-drafted issues from highlighted text, live filtered issue lists, and rich issue cards from any Linear URL.
```
(141 chars)

**Option C (shortest, highest density):**
```
Linear in Confluence: AI text-to-issue, live issue filters, rich issue cards. One OAuth, all features, $2/user.
```
(112 chars)

**My pick: Option A.** The AI lead is the strongest differentiator on
Marketplace where similar-tier integrations crowd the search results. "One-
click setup" closes the trust gap for buyers comparing alternatives.

---

## Long description (Markdown) — Task #30

Paste this into the **Description** / **About this app** field. Marketplace
renders standard Markdown.

```markdown
**Linea brings your Linear workspace into Confluence.** Highlight a paragraph,
right-click, and Linea drafts a well-formed Linear issue — title, description,
priority, team, type — all in seconds. Embed live filtered Linear issue lists
on any page. Render any Linear URL as a rich card, an inline chip, or a plain
link. One Linear connection per Confluence site, full feature access, simple
per-user pricing.

## What you get

### AI text-to-issue
Highlight any text on a Confluence page — a requirement, a bug report, a
meeting decision — right-click, choose **Create Linear issue**, and Linea
opens a pre-filled draft. Edit anything and click **Create**. The issue
lands in Linear in one click. On Confluence Standard / Premium / Enterprise,
the **Refine with Rovo AI** button opens the Linea Task Specialist agent
for conversational refinement before creation.

### Linear Filter macro
Type `/Linear Filter` in any Confluence page and pick a preset (**Active
issues**, **Backlog**, **All issues**, **My issues**) or paste any Linear
team or saved-view URL. The macro renders a live, auto-refreshing table.
Toggle which columns show — ID, status, title, assignee, priority, labels,
project, due date — and the macro remembers per-page. Updates in Linear are
reflected within seconds via webhook.

### Linear Link macro
Type `/Linear Link` and paste any Linear issue URL. Pick the display style:
plain URL, inline chip with status, or full card with priority, assignee,
labels, project, and due date. Renders rich Linea-branded metadata where raw
URL pasting falls back to the generic Atlassian smart link.

### Rovo Task Specialist agent
Linea registers a Rovo agent that drafts Linear issues from Confluence page
context and creates them through the `create-linear-issue` Rovo action.
Available on Confluence editions that include Rovo. The agent asks at most
one clarifying question before producing a draft, respects priority signals
in the source text, and returns the created issue's URL on completion.

## Pricing

- **Free** for teams of 10 users or fewer
- **$2.00 / user / month** above 10 users — flat rate, every paid tier
- 30-day free trial regardless of team size
- Annual discount applied automatically by Atlassian
- All features included on every paid plan; no Pro/Premium tiers

## Setup in two minutes

1. Install Linea from the Marketplace
2. Open Confluence → **Apps → Linear Configuration**
3. Click **Connect Linear Workspace** and approve the Linear OAuth prompt
4. Done — every Confluence user on the site can now use every Linea feature

One Linear connection covers the whole Confluence site. No per-user setup,
no API keys to share.

## Privacy and data handling

Linea is built on **Atlassian Forge** and runs entirely on Atlassian's
serverless platform. Nothing is sent to any third-party server beyond the
Linear API itself.

- Linear OAuth tokens are stored in **Forge encrypted secret storage**
- Cached Linear metadata (teams, labels, recent issues) lives in **Forge KVS**, scoped per Confluence site
- Macro configurations and AI draft usage counters are **scoped per site** and never cross sites or vendors
- Confluence content is **only** sent to Linear when a user explicitly
  highlights text and clicks **Create Linear issue**
- AI drafting uses Atlassian's Rovo platform when available and a deterministic
  template-based fallback otherwise — **no third-party AI service** receives your content
- Uninstalling Linea automatically clears all per-site data via the Forge
  uninstall lifecycle event (GDPR right-to-erasure)
- All inbound Linear webhooks are HMAC-SHA256 verified with constant-time comparison
- OAuth uses PKCE with a 10-minute single-use state parameter

The only outbound destination Linea contacts is `api.linear.app`. See our
privacy policy for full details.

## Compatibility

| Atlassian product | Status |
|---|---|
| Confluence Cloud | ✅ Supported |
| Jira Cloud | ❌ Not supported (Confluence only) |
| Confluence / Jira Data Center | ❌ Not supported |

Rovo features (the **Refine with Rovo AI** button and the Linea Task
Specialist agent) require a Confluence edition that includes Rovo (Standard,
Premium, or Enterprise). All other Linea features work on every Confluence
Cloud edition.

## Support

- Email: support@reactify-solutions.com
- Response SLA: one business day
- Documentation: https://reactify-solutions.com/linea/docs
- Status page: https://reactify-solutions.com/linea/status

Built and maintained by **Reactify Solutions**.
```

---

## Categories (pick 2–3)

Atlassian Marketplace allows multiple categories. Pick:

1. **Integrations** — primary; this is what Linea fundamentally is
2. **Project management** — secondary; aligns with how customers search for it
3. **IT & helpdesk** *(optional)* — captures the bug-report-from-Confluence use case

Skip *Macros* unless the form specifically asks for it — Marketplace doesn't
treat Macros as a top-level category for Forge apps.

---

## Tags / keywords

Free-text keywords that help search. Suggested set:

```
linear, issue tracker, project management, ai, rovo, macros, smart links,
text to ticket, issue creation, oauth, integration, productivity
```

---

## "What's new in this version" (release notes)

Pulled directly from CHANGELOG.md. For the first listed version, paste:

```markdown
First Marketplace release of Linea. Brings Linear into Confluence:

- AI text-to-issue with one-click creation
- Linear Filter macro for live filtered issue lists
- Linear Link macro for rich issue cards from any URL
- Rovo Task Specialist agent (on Rovo-enabled Confluence editions)
- Single-SKU pricing — full feature access for every paying customer
- Forge-native: no third-party servers, encrypted token storage, automatic
  GDPR cleanup on uninstall
```

---

## Privacy policy URL placeholder — Task #31

The listing form requires a URL. Suggested final URL:

```
https://reactify-solutions.com/linea/privacy
```

Until that page is live, the form will reject submission. Two options:

- **Option 1 (cleanest):** publish the page first, then create the listing
- **Option 2 (faster):** point at a temporary URL on a static host (e.g.
  GitHub Pages, Vercel, Netlify) — Marketplace doesn't validate the page
  contents, only that the URL responds 200 at submission time

A minimum-viable privacy policy for a Forge app this size is ~600 words.
I can draft one if you want — say the word.

---

## Support URL placeholder — Task #32

```
https://reactify-solutions.com/linea/support
```

Or an external help-desk URL like `https://reactify-solutions.atlassian.net/servicedesk/customer/portal/...`

The simplest acceptable form is a **mailto:** link, but Atlassian prefers a real
support page. If you only have email, set:

```
mailto:support@reactify-solutions.com
```

---

## EULA URL — Task #33

The fastest path is using **Atlassian's standard Marketplace EULA**:

```
https://www.atlassian.com/legal/marketplace-terms-of-use
```

Many Marketplace listings use this directly. If you ever need vendor-specific
terms (e.g. SLAs, support guarantees), you replace it later — but for launch,
Atlassian's standard EULA is the no-brainer choice.
```
