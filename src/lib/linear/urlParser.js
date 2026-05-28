const { queryIssues, listTeams, linearQuery } = require('./queries');
const { kvsGetWithTTL, kvsSet } = require('../cache/kvsCache');

/**
 * Parse a Linear URL into a GraphQL-friendly filter.
 *
 * Supports:
 *   - https://linear.app/{org}/team/{teamKey}                 → all team issues
 *   - https://linear.app/{org}/team/{teamKey}/active          → started + unstarted
 *   - https://linear.app/{org}/team/{teamKey}/backlog         → backlog
 *   - https://linear.app/{org}/team/{teamKey}/completed       → completed
 *   - https://linear.app/{org}/team/{teamKey}/cancelled       → canceled
 *   - https://linear.app/{org}/team/{teamKey}/all             → all
 *   - https://linear.app/{org}/team/{teamKey}/board           → active board view
 *   - https://linear.app/{org}/view/{viewId}                  → saved custom view (resolved via API)
 *   - https://linear.app/{org}/my-issues                      → assigned to current user
 */
function parseLinearUrl(url) {
  if (!url || typeof url !== 'string') {
    return { error: 'Invalid URL' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'Not a valid URL' };
  }
  if (!/linear\.app$/.test(parsed.hostname)) {
    return { error: 'URL must be from linear.app' };
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  // parts[0] = org, parts[1] = "team"|"view"|"my-issues", ...

  if (parts[1] === 'team' && parts[2]) {
    const teamKey = parts[2];
    const category = parts[3] || 'all';
    let stateTypes;
    switch (category.toLowerCase()) {
      case 'active':
      case 'board':
        stateTypes = ['started', 'unstarted'];
        break;
      case 'backlog':
        stateTypes = ['backlog'];
        break;
      case 'completed':
      case 'done':
        stateTypes = ['completed'];
        break;
      case 'cancelled':
      case 'canceled':
        stateTypes = ['canceled'];
        break;
      case 'triage':
        stateTypes = ['triage'];
        break;
      case 'all':
      default:
        stateTypes = null;
    }
    return { type: 'team', teamKey, stateTypes };
  }

  if (parts[1] === 'view' && parts[2]) {
    return { type: 'view', viewId: parts[2] };
  }

  if (parts[1] === 'my-issues') {
    return { type: 'my-issues' };
  }

  return {
    error:
      'Unsupported Linear URL format. Try a team URL like https://linear.app/org/team/ENG/active',
  };
}

async function queryIssuesByFilter(siteId, filter) {
  if (filter.type === 'team') {
    // Look up teamId from teamKey
    let teams = await kvsGetWithTTL(`teams:${siteId}`);
    if (!teams) {
      teams = await listTeams(siteId);
      await kvsSet(`teams:${siteId}`, teams, 1800);
    }
    const team = teams.find(
      (t) => t.key?.toLowerCase() === filter.teamKey.toLowerCase()
    );
    if (!team) {
      throw new Error(`No Linear team found with key "${filter.teamKey}"`);
    }
    return queryIssues(siteId, {
      teamId: team.id,
      stateTypes: filter.stateTypes || [],
      limit: 50,
    });
  }

  if (filter.type === 'view') {
    // Resolve saved view into a filter, then apply
    const data = await linearQuery(
      siteId,
      `query CustomView($id: String!) {
        customView(id: $id) {
          id name filters
        }
      }`,
      { id: filter.viewId }
    );
    // Linear's customView.filters is a JSON blob that's proprietary; fall back
    // to listing all issues and applying the saved view's team filter if present.
    const filters = data?.customView?.filters || {};
    const teamFilter =
      filters?.and?.find?.((f) => f?.team?.id?.eq)?.team?.id?.eq || null;
    const stateTypesFilter =
      filters?.and?.find?.((f) => f?.state?.type?.in)?.state?.type?.in || null;
    return queryIssues(siteId, {
      teamId: teamFilter,
      stateTypes: stateTypesFilter || [],
      limit: 50,
    });
  }

  if (filter.type === 'my-issues') {
    const viewer = await linearQuery(siteId, `query Me { viewer { id } }`);
    const viewerId = viewer?.viewer?.id;
    const data = await linearQuery(
      siteId,
      `query MyIssues($id: ID!, $limit: Int!) {
        issues(first: $limit, filter: { assignee: { id: { eq: $id } } }, orderBy: updatedAt) {
          nodes {
            id identifier title description priority url updatedAt dueDate
            state { name type color }
            assignee { id name avatarUrl }
            labels(first: 10) { nodes { id name color } }
            team { id name }
          }
        }
      }`,
      { id: viewerId, limit: 50 }
    );
    return data?.issues?.nodes || [];
  }

  return [];
}

module.exports = { parseLinearUrl, queryIssuesByFilter };
