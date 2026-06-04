# Security Policy

This document describes how Linea (Linear All-in-One for Confluence)
handles security vulnerabilities, incidents, and customer communication.
It is the source of truth referenced in our Atlassian Marketplace security
questionnaire (Partner Q19, Forge Q15-Q18).

## Reporting a vulnerability

If you believe you have found a security vulnerability in Linea, please
report it privately. Do **not** open a public GitHub issue.

- **Email**: office@reactify-solutions.com
- **Subject line**: `[Linea Security] <short description>`
- **Encryption (optional)**: PGP key available on request

Please include:

- A description of the issue and its potential impact
- Steps to reproduce (proof of concept is appreciated but not required)
- The Linea version, Atlassian site (if you are testing on a specific
  instance), and any relevant log excerpts (with secrets redacted)

We acknowledge reports within **2 business days** and aim to provide a
remediation timeline within **5 business days**.

## Severity and remediation SLAs

We follow the
[Atlassian Marketplace security bug-fix policy](https://developer.atlassian.com/platform/marketplace/security-bugfix-policy/).
Severity is determined using CVSS v3.1.

| Severity     | CVSS    | Target fix time |
| ------------ | ------- | --------------- |
| Critical     | 9.0-10  | 2 weeks         |
| High         | 7.0-8.9 | 4 weeks         |
| Medium       | 4.0-6.9 | 6 weeks         |
| Low          | 0.1-3.9 | Next release    |

## Incident response plan

This plan applies to any confirmed or suspected security incident affecting
Linea, including but not limited to: vulnerability exploitation, secret
disclosure, unauthorized data access, dependency compromise, or compromise
of Linea developer accounts.

### Roles

- **Incident Commander (IC)**: directs the response, owns customer and
  Atlassian communication. Default: Reactify Solutions security contact.
- **Technical Lead**: investigates, contains, and remediates.
- **Communications Lead**: drafts notifications to customers and
  Atlassian using the published templates.

For a solo / small-team setup, the same person may hold multiple roles;
the plan still applies.

### Phases

1. **Detection and triage** (target: within 1 hour of awareness)
   - Capture the initial report, alert source, or evidence.
   - Assign an IC and open an incident channel / document.
   - Classify severity using CVSS v3.1.

2. **Containment** (target: within 4 hours for High/Critical)
   - For credential or token exposure: rotate the affected Forge
     environment variables (`LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`,
     `LINEAR_WEBHOOK_SECRET`) and invalidate any compromised Linear OAuth
     tokens via `storage.delete` / Linear's revocation endpoint.
   - For code-level exploitation: deploy a hotfix to Forge, or if a fix
     cannot be shipped immediately, request that Atlassian disable the
     affected app version through the Marketplace support channel.
   - For account compromise: rotate MFA on affected GitHub / Atlassian /
     Linear accounts; review and revoke active sessions.

3. **Eradication and recovery**
   - Land the fix on `master` through the standard PR review process.
   - Run the full test suite and `npm audit`; verify Dependabot and
     CodeQL are clean.
   - Publish a new app version via `forge deploy` and `forge install
     --upgrade` for affected installations.

4. **Customer and Atlassian notification**
   - Notify affected customers using the
     [Atlassian app vulnerability notification template](https://developer.atlassian.com/platform/marketplace/app-vulnerability-notification-template/)
     and the
     [security incident communication template](https://developer.atlassian.com/platform/marketplace/app-security-incident-communication-template/).
   - File a security incident with Atlassian per the
     [security incident management guidelines](https://developer.atlassian.com/platform/marketplace/app-security-incident-management-guidelines/).
   - Customer notifications are sent within **72 hours** of confirmation
     for High/Critical issues affecting customer data.

5. **Post-incident review** (within 2 weeks of resolution)
   - Write a brief post-mortem covering: timeline, root cause,
     containment actions, customer impact, follow-up tasks.
   - Track remediation tasks to completion.

### Annual exercise

The incident response plan is reviewed and walked through (tabletop
exercise) at least once per year. The most recent review date is
recorded in `CHANGELOG.md`.

## Vulnerability management

- **SAST**: GitHub CodeQL runs on every push to `master`, on every pull
  request, and weekly on a schedule. Configuration:
  `.github/workflows/codeql.yml`.
- **SCA**: GitHub Dependabot opens pull requests weekly for vulnerable
  or out-of-date npm dependencies. Configuration:
  `.github/dependabot.yml`. We also run `npm audit` locally before each
  release.
- **Manual review**: Each pull request is reviewed before merge. Releases
  require a green CI run including CodeQL and the Jest test suite.

## Secrets handling

- Linear OAuth client credentials and the webhook signing secret are
  supplied via Forge environment variables (`LINEAR_CLIENT_ID`,
  `LINEAR_CLIENT_SECRET`, `LINEAR_WEBHOOK_SECRET`) and never committed
  to source.
- Per-installation Linear OAuth tokens and OAuth state values are
  persisted exclusively via `storage.setSecret`.
- Logs never contain credentials, tokens, or PII. Error paths log only
  short messages, never raw payloads or stack frames that could include
  upstream secrets.

## Customer responsibilities

To keep Linea secure on your end:

- Connect Linear only from an account you trust and rotate the Linear
  OAuth connection if any of your Atlassian site administrators leave.
- Disconnect Linea from the global page if you stop using it. Uninstall
  triggers automatic deletion of per-installation tokens and
  configuration from Forge Storage.

## Contact

- **Security contact**: office@reactify-solutions.com
- **Atlassian Marketplace listing**: Linea - Linear All-in-One for Confluence
- **Source repository**: https://github.com/nikolamirilo/linea
