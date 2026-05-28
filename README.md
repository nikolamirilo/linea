# Linea - Linear All-in-One for Confluence

Linea brings your Linear workspace into Confluence: turn highlighted text into
a well-formed Linear issue, embed live filtered issue lists on pages, and
render rich Linear issue cards from any URL - all without leaving Confluence.

Built on [Atlassian Forge](https://developer.atlassian.com/platform/forge/).

---

## Features

- **AI text-to-issue** - Highlight a paragraph on a page, right-click, and
  Linea drafts a Linear issue with title, description, priority, team, and
  type. One click to create.
- **Linear Filter macro** - `/Linear Filter` embeds a live, auto-refreshing
  table of Linear issues filtered by team, project, label, or saved view.
- **Linear Link macro** - `/Linear Link` renders a single Linear issue URL as
  an inline chip, full card, or plain link.
- **Rovo Task Specialist agent** - Conversational refinement of issues before
  creation (Confluence Standard / Premium / Enterprise).

---

## Pricing

| Team size | Price |
|---|---|
| 1–10 users | Free |
| 11+ users | $2.00 / user / month |

30-day free trial regardless of team size. Annual discount applied automatically by Atlassian.

---

## Install & use

End users and Confluence admins: see [`USER_GUIDE.md`](USER_GUIDE.md) for
install, connection, and usage instructions.

---

## Privacy & data handling

- Linear OAuth tokens are stored in Atlassian Forge encrypted secret storage
- Cached Linear metadata (teams, labels, recent issues) lives in Forge KVS
- Macro configurations and AI usage counters are scoped per Confluence site
- The only third-party host Linea contacts is `api.linear.app`
- Confluence content is **only** sent to Linear when the user explicitly
  highlights text and clicks **Create Linear issue**
- Uninstalling Linea clears all per-site data automatically via the Forge
  uninstall lifecycle event (GDPR right-to-erasure)

---

## Support

- **Email:** support@reactify-solutions.com
- **Privacy policy:** https://reactify-solutions.com/linea/privacy
- **Status:** https://reactify-solutions.com/linea/status

---

## For developers

- [`USER_GUIDE.md`](USER_GUIDE.md) - End-user install and usage
- [`DEVELOPMENT.md`](DEVELOPMENT.md) - Architecture, folder structure, dev setup
- [`PROD_TASKS.md`](PROD_TASKS.md) - Release & Marketplace publishing checklist
- [`CHANGELOG.md`](CHANGELOG.md) - Version history

---

## License

Proprietary - © 2026 Reactify Solutions. All rights reserved.
