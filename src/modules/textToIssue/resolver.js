const Resolver = require('@forge/resolver').default;
const {
  createIssue,
  listTeams,
  listLabels,
  listProjectsForTeam,
} = require('../../lib/linear/queries');
const {
  draftIssueFromText,
  renderDescriptionForType,
  checkAiDraftQuota,
  incrementAiDraftCount,
} = require('../../lib/rovo');
const {
  ValidationError,
  sanitizeUserError,
  validateTeamId,
  validatePriority,
  validateIssueType,
} = require('../../lib/security');

const MAX_SELECTION_LENGTH = 8000;
const { checkAiDraftLimit } = require('../../lib/licensing');
const { kvsGetWithTTL, kvsSet } = require('../../lib/cache/kvsCache');
const { getSiteId } = require('../../lib/context');

const resolver = new Resolver();

function inferTeam(suggestedName, teams) {
  if (!suggestedName || !teams || teams.length === 0) return null;
  const lower = String(suggestedName).toLowerCase();
  const exact = teams.find(
    (t) => t.name?.toLowerCase() === lower || t.key?.toLowerCase() === lower
  );
  if (exact) return exact.id;
  const partial = teams.find(
    (t) =>
      t.name?.toLowerCase().includes(lower) ||
      (t.name && lower.includes(t.name.toLowerCase()))
  );
  if (partial) return partial.id;
  return teams[0]?.id || null;
}

resolver.define('draftIssue', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const selectedText = payload?.selectedText || '';
    const pageContext = payload?.pageContext || {};

    if (!selectedText.trim()) {
      return { error: 'Please select some text on the page before opening this dialog.' };
    }
    if (selectedText.length > MAX_SELECTION_LENGTH) {
      return {
        error: `Your selection is ${selectedText.length.toLocaleString()} characters, which exceeds the ${MAX_SELECTION_LENGTH.toLocaleString()}-character limit. Please select a shorter passage (about ${Math.round(MAX_SELECTION_LENGTH / 1000)}k characters or less) and try again.`,
      };
    }

    const currentCount = await checkAiDraftQuota(siteId);
    try {
      await checkAiDraftLimit(context, currentCount);
    } catch (err) {
      return { error: err.message };
    }

    let teams = await kvsGetWithTTL(`teams:${siteId}`);
    if (!teams) {
      try {
        teams = await listTeams(siteId);
        await kvsSet(`teams:${siteId}`, teams, 1800);
      } catch (err) {
        return {
          error: `Cannot list Linear teams: ${err.message}. Ensure your Linear workspace is connected.`,
        };
      }
    }

    let labels = await kvsGetWithTTL(`labels:${siteId}`);
    if (!labels) {
      try {
        labels = await listLabels(siteId);
        await kvsSet(`labels:${siteId}`, labels, 1800);
      } catch (err) {
        console.error('listLabels failed:', err?.message || err);
        labels = [];
      }
    }

    const draft = await draftIssueFromText({
      text: selectedText,
      pageTitle: pageContext.title || '',
      pageLabels: pageContext.labels || [],
      spaceKey: pageContext.spaceKey || '',
    });

    await incrementAiDraftCount(siteId);

    return {
      title: draft.title,
      description: draft.description,
      suggestedPriority: draft.priority,
      suggestedLabels: draft.labels,
      suggestedTeamId: inferTeam(draft.suggestedTeam, teams),
      issueType: draft.issueType,
      teams: teams || [],
      labels: labels || [],
    };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { error: err.message };
    }
    if (!/not connected/i.test(err.message || '')) {
      console.error('draftIssue failed:', err?.message || 'unknown');
    }
    return { error: sanitizeUserError(err) };
  }
});

resolver.define('createIssue', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const {
      title,
      description,
      teamId,
      priority,
      labelIds,
      assigneeId,
      projectId,
    } = payload || {};

    if (!title || !String(title).trim()) {
      return { error: 'Title is required.' };
    }
    if (typeof title !== 'string' || title.length > 255) {
      return {
        error: `Title is ${title.length || 0} characters, which exceeds the 255-character limit. Please shorten it.`,
      };
    }
    if (description != null) {
      if (typeof description !== 'string') {
        return { error: 'Description must be a string.' };
      }
      if (description.length > 50000) {
        return {
          error: `Description is ${description.length.toLocaleString()} characters, which exceeds the 50,000-character limit. Please shorten it.`,
        };
      }
    }

    let safeTeamId, safePriority;
    try {
      safeTeamId = validateTeamId(teamId);
      safePriority = validatePriority(priority);
    } catch (err) {
      return { error: err.message };
    }

    // labelIds / assigneeId / projectId are passed straight through to Linear's
    // GraphQL API which rejects malformed IDs. We only enforce that they are
    // arrays/strings of reasonable size to avoid abuse.
    if (labelIds != null && !Array.isArray(labelIds)) {
      return { error: 'labelIds must be an array.' };
    }
    if (Array.isArray(labelIds) && labelIds.length > 50) {
      return { error: 'Too many labels (max 50).' };
    }
    if (assigneeId != null && (typeof assigneeId !== 'string' || assigneeId.length > 100)) {
      return { error: 'Invalid assigneeId.' };
    }
    if (projectId != null && (typeof projectId !== 'string' || projectId.length > 100)) {
      return { error: 'Invalid projectId.' };
    }

    const issue = await createIssue(siteId, {
      title: String(title).trim(),
      description: description || '',
      teamId: safeTeamId,
      priority: safePriority,
      labelIds,
      assigneeId,
      projectId,
    });

    return { issue };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (!/not connected/i.test(err.message || '')) {
      console.error('createIssue failed:', err?.message || 'unknown');
    }
    return { error: sanitizeUserError(err) };
  }
});

resolver.define('renderDescription', async ({ payload }) => {
  try {
    const selectedText = typeof payload?.selectedText === 'string' ? payload.selectedText : '';
    const pageContext = payload?.pageContext || {};

    if (!selectedText.trim()) {
      return { error: 'No text to render.' };
    }
    if (selectedText.length > MAX_SELECTION_LENGTH) {
      return {
        error: `Your selection is ${selectedText.length.toLocaleString()} characters, which exceeds the ${MAX_SELECTION_LENGTH.toLocaleString()}-character limit.`,
      };
    }

    let issueType;
    try {
      issueType = validateIssueType(payload?.issueType);
    } catch (err) {
      return { error: err.message };
    }

    const description = renderDescriptionForType({
      text: selectedText,
      issueType,
      pageTitle: typeof pageContext.title === 'string' ? pageContext.title : '',
      spaceKey: typeof pageContext.spaceKey === 'string' ? pageContext.spaceKey : '',
    });
    return { description };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('renderDescription failed:', err?.message || 'unknown');
    return { error: sanitizeUserError(err) };
  }
});

resolver.define('listProjects', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    if (!payload?.teamId) return { projects: [] };

    let teamId;
    try {
      teamId = validateTeamId(payload.teamId);
    } catch (err) {
      return { projects: [], error: err.message };
    }

    const cacheKey = `projects:${siteId}:${teamId}`;
    let projects = await kvsGetWithTTL(cacheKey);
    if (!projects) {
      projects = await listProjectsForTeam(siteId, teamId);
      await kvsSet(cacheKey, projects, 1800);
    }
    return { projects: projects || [] };
  } catch (err) {
    if (err instanceof ValidationError) return { projects: [], error: err.message };
    console.error('listProjects failed:', err?.message || 'unknown');
    return { projects: [], error: sanitizeUserError(err) };
  }
});

exports.handler = resolver.getDefinitions();
