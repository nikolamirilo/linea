# Linea - User Guide

Linea brings Linear into Confluence: turn a paragraph into a Linear issue,
embed live Linear filters in pages, and render rich Linear issue cards from a
single URL - without leaving Confluence.

This guide is for **end users and Confluence admins** installing Linea on their
workspace. If you're a developer working on Linea itself, see `README.md`.

---

## What you get

| Feature | What it does | Where it lives |
|---|---|---|
| **AI text-to-issue** | Highlight a paragraph on a Confluence page → right-click → Linea drafts a Linear issue with title, description, priority, and team | Right-click context menu on selected text |
| **Linear Filter macro** | Embed a live, auto-refreshing list of Linear issues filtered by team, project, label, or saved view | `/Linear Filter` in the Confluence editor |
| **Linear Link macro** | Paste a Linear issue URL and pick how it renders - inline chip, full card, or plain link | `/Linear Link` in the Confluence editor |
| **Rovo Task Specialist agent** *(Confluence Standard / Premium / Enterprise only)* | Conversational refinement of issues before creation; also creates Linear issues from chat | Rovo sidebar |

---

## Install

1. Open the Atlassian Marketplace listing for **Linea**
2. Click **Try it free** (or **Buy now**)
3. Pick the Confluence site to install onto
4. Approve the permissions Linea requests:
   - Read content on pages, spaces, and macros (so it can see what you highlight and where you embed macros)
   - Write to pages (so it can save macro configurations)
   - App storage (so it can cache Linear data and store your Linear connection)
   - External fetch to `api.linear.app`
5. Wait ~30 seconds for the install to complete
6. Continue to **Connect your Linear workspace** below

> Linea uses a **per-user, per-month** pricing model: free for teams of 10 or
> fewer, $2 / user / month above that. Free trial is 30 days regardless of team
> size.

---

## Connect your Linear workspace

You need to do this once per Confluence site. Any user with admin permission
can do it; once connected, every user on that Confluence site can use Linea.

1. In Confluence, click **Apps** in the top navigation bar
2. Click **Linear Configuration** (Linea's settings page)
3. Click **Connect Linear Workspace**
4. A Linear sign-in popup opens - sign in if needed, then click **Authorize**
5. The popup closes and you'll see **Successfully connected** with your
   workspace name displayed
6. Click **Refresh Status** if needed to confirm the green check

That's it - Linea is now ready to use across the entire Confluence site.

### Disconnecting

On the same **Linear Configuration** page, click **Disconnect**. This:
- Revokes Linea's access to your Linear workspace
- Clears all cached Linear data from Confluence
- Stops any webhooks Linea registered with Linear
- Leaves any issues created via Linea untouched in Linear itself

---

## Using AI text-to-issue

1. Open any Confluence page
2. **Highlight the text** that describes the work - a requirement, a bug
   report, a meeting decision, a chat snippet, anything
3. Right-click the selection and choose **Create Linear issue**
4. A modal opens with a draft:
   - **Title** in imperative mood (e.g. "Fix login redirect on mobile")
   - **Description** rendered as Markdown with context section
   - Suggested **priority** and **team**
   - Suggested **issue type** (bug, feature, improvement, question, ask, spike, task)
5. Edit any field, then click **Create issue**
6. The issue is created in Linear and the modal shows a link to it

> **Tip:** if your selection is too short or ambiguous, the draft will be too
> generic. Highlight a couple of sentences for the best result.

### Refine with Rovo (Confluence Standard / Premium / Enterprise)

If your Confluence edition includes Rovo, the dialog also has a **Refine with
Rovo AI** button. Click it to open the Linea Task Specialist in the Rovo
sidebar, where you can have a conversational refinement before creating the
issue.

---

## Using the Linear Filter macro

Embed a live, auto-refreshing list of Linear issues on a Confluence page.

1. In the editor, type `/` and search for **Linear Filter**
2. Insert it; the configuration panel opens
3. Pick a preset (**Active issues**, **Backlog**, **All issues**, **My issues**)
   or paste any Linear team / view URL like:
   - `https://linear.app/your-org/team/ENG/active`
   - `https://linear.app/your-org/view/abc123`
4. Click **Save**; the macro renders the live list
5. Use the column toggle (top-right of the macro) to choose which fields show:
   ID, status, title, assignee, priority, labels, project, due date, updated

The list auto-refreshes when issues change in Linear (via webhook).

---

## Using the Linear Link macro

Render a single Linear issue as an inline chip, a card, or a plain URL.

1. In the editor, type `/` and search for **Linear Link**
2. Insert it; the configuration panel opens
3. Paste a Linear issue URL (e.g. `https://linear.app/your-org/issue/ENG-123/...`)
4. Pick the display style:
   - **URL** - plain hyperlink
   - **Inline** - small chip showing identifier, title, and status
   - **Card** - full card with priority, assignee, labels, project, due date
5. Click **Save**

> **Why use the macro instead of pasting the URL?** Atlassian's built-in smart
> link resolver claims raw `linear.app` URLs first, before any third-party app
> can render them. The Linea Link macro is the supported path for rich
> Linea-branded cards on Confluence pages.

---

## Pricing

| Team size | Price |
|---|---|
| 1–10 users | **Free** |
| 11+ users | **$2.00 / user / month** |

- 30-day free trial regardless of team size
- ~10% discount for annual billing (set automatically by Atlassian)
- All features included on every paid plan - no Pro/Premium tiers
- Billing is handled by Atlassian alongside your other Marketplace apps

---

## FAQ

**Do users need their own Linear accounts?**
No. Linea uses a single OAuth connection per Confluence site. The Confluence
admin who connects sets the Linear identity - every Confluence user on that
site sees and creates issues as that identity.

**Can I connect more than one Linear workspace?**
Not yet. One Linea install = one Linear workspace per Confluence site. If you
need multiple workspaces, install Linea on different Confluence sites.

**Is my Confluence content sent to Linear?**
Only the text you explicitly highlight before clicking **Create Linear issue**.
Page contents are never auto-uploaded.

**Does Linea send my data to any AI provider?**
The AI drafting runs **inside Atlassian's Rovo platform** when available, and
falls back to a deterministic template-based draft otherwise. No third-party AI
service receives your content.

**Where is my data stored?**
- **Linear OAuth tokens** - encrypted at rest in Atlassian Forge secret storage
- **Cached Linear metadata** (teams, labels, recent issues) - Atlassian Forge KVS
- **Macro configurations** (which filter / URL each macro shows) - Atlassian Forge KVS
- **Webhook events** - short-lived in Atlassian Forge SQL, scoped per site
- All data is hosted by Atlassian; nothing is sent to third-party servers
  beyond `api.linear.app`

**What happens if I uninstall Linea?**
Linea registers a Forge uninstall handler that automatically clears all
per-site data: OAuth tokens, cached Linear metadata, macro configs, AI usage
counters. Issues created via Linea remain in Linear.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Macros show "Linear not connected" | Go to **Apps → Linear Configuration** and click **Connect Linear Workspace** |
| Right-click "Create Linear issue" missing | Hard-refresh the page; the action takes a moment to register after install |
| Card shows "Linear connection expired" | Disconnect and reconnect on the **Linear Configuration** page |
| Filter macro shows empty list | Check that the URL points to a team/view that has issues; the connected Linear identity must have access to it |
| Pasting a Linear URL shows a generic card, not a Linea card | Use the **Linear Link macro** instead. Atlassian's built-in resolver claims raw URLs before Linea sees them - this is expected |
| AI draft says "Free tier limit reached" | You've used 50 AI drafts this month on the free plan. Upgrade to a paid plan for unlimited drafts |

---

## Support

- **Email:** support@reactify-solutions.com
- **Privacy policy:** https://reactify-solutions.com/linea/privacy
- **Status / known issues:** https://reactify-solutions.com/linea/status

We aim to respond to support requests within one business day.
