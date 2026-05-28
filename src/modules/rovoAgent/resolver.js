const { createIssue, listTeams } = require('../../lib/linear/queries');
const { kvsGetWithTTL, kvsSet } = require('../../lib/cache/kvsCache');
const { getSiteId } = require('../../lib/context');
const { sanitizeUserError, ValidationError } = require('../../lib/security');

const PRIORITY_WORD_TO_INT = {
  urgent: 1,
  high: 2,
  normal: 3,
  medium: 3,
  low: 4,
  none: 0,
  no_priority: 0,
  'no priority': 0,
};

function mapPriority(priority) {
  if (priority === undefined || priority === null || priority === '') return 0;
  if (typeof priority === 'number' && Number.isInteger(priority)) {
    return priority >= 0 && priority <= 4 ? priority : 0;
  }
  const key = String(priority).trim().toLowerCase();
  return PRIORITY_WORD_TO_INT[key] ?? 0;
}

async function resolveTeamId(siteId, teamKey) {
  let teams = await kvsGetWithTTL(`teams:${siteId}`);
  if (!teams) {
    teams = await listTeams(siteId);
    await kvsSet(`teams:${siteId}`, teams, 1800);
  }

  if (!Array.isArray(teams) || teams.length === 0) {
    throw new Error(
      'No Linear teams are accessible. Please verify the Linear workspace is connected.'
    );
  }

  if (teamKey) {
    const normalized = String(teamKey).trim().toLowerCase();
    const match = teams.find(
      (t) =>
        t.key?.toLowerCase() === normalized ||
        t.name?.toLowerCase() === normalized
    );
    if (match) return { teamId: match.id, matchedTeam: match, teams };
  }

  return { teamId: teams[0].id, matchedTeam: teams[0], teams };
}

// Rovo action handler — invoked by the Linear Task Specialist agent when it
// decides (with user approval) to create a Linear issue. Payload shape is
// governed by the `rovo:action` module inputs in manifest.yml.
async function rovoCreateIssueHandler(payload, context) {
  try {
    const siteId = getSiteId(context);
    const { title, description, priority, teamKey } = payload || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return { error: 'Title is required.' };
    }
    if (title.length > 255) {
      return { error: 'Title exceeds the 255-character limit.' };
    }
    if (description != null) {
      if (typeof description !== 'string') {
        return { error: 'Description must be a string.' };
      }
      if (description.length > 50000) {
        return { error: 'Description exceeds the 50,000-character limit.' };
      }
    }
    if (teamKey != null && (typeof teamKey !== 'string' || teamKey.length > 50)) {
      return { error: 'teamKey must be a string up to 50 characters.' };
    }

    const { teamId, matchedTeam } = await resolveTeamId(siteId, teamKey);

    const issue = await createIssue(siteId, {
      title: String(title).trim(),
      description: description ? String(description) : '',
      teamId,
      priority: mapPriority(priority),
    });

    return {
      success: true,
      issue: {
        identifier: issue.identifier,
        title: issue.title,
        url: issue.url,
        team: matchedTeam?.name,
      },
      message: `Created ${issue.identifier} in ${matchedTeam?.name || 'Linear'}: ${issue.url}`,
    };
  } catch (err) {
    const message = err?.message || String(err);
    if (!/not connected/i.test(message)) {
      console.error('[rovo:createLinearIssue] failed:', message);
    }
    return { error: sanitizeUserError(err) };
  }
}

exports.handler = rovoCreateIssueHandler;
exports.mapPriority = mapPriority;
exports.resolveTeamId = resolveTeamId;
