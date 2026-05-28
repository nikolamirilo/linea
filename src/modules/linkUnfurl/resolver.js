const Resolver = require('@forge/resolver').default;
const { getIssueByIdentifier } = require('../../lib/linear/queries');
const { kvsGetWithTTL, kvsSet } = require('../../lib/cache/kvsCache');
const { getSiteId } = require('../../lib/context');
const { sanitizeUserError, validateUrl, ValidationError } = require('../../lib/security');

const LINEAR_URL_PATTERN = /linear\.app\/(?:[^/]+\/)?issue\/([A-Z][A-Z0-9]*-\d+)/i;
const LINEAR_BRAND_ICON = 'https://linear.app/favicon.ico';

// NOTE: graph:smartLink is registered in manifest.yml for linear.app issue URLs,
// but in practice Atlassian's built-in Linear smart link resolver (part of the
// Object Resolver Service) claims these URLs first and this handler is never
// invoked. Third-party Forge apps cannot override built-in ORS providers — the
// Linear Link macro (confluence:macro) is the supported path for rich Linea
// cards on Confluence pages. The module is kept registered in case Atlassian
// opens up precedence in the future.
async function fetchIssueForUrl(url, siteId) {
  const match = (url || '').match(LINEAR_URL_PATTERN);
  if (!match) return null;

  const identifier = match[1];
  const cacheKey = `issue:${siteId}:${identifier}`;

  const cached = await kvsGetWithTTL(cacheKey);
  if (cached) return cached;

  const issue = await getIssueByIdentifier(siteId, identifier);
  if (!issue) return { notFound: true, identifier };

  const data = {
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description || '',
    state: {
      name: issue.state?.name || 'Unknown',
      type: issue.state?.type || 'unknown',
      color: issue.state?.color || '#888',
    },
    assignee: issue.assignee
      ? { name: issue.assignee.name, avatarUrl: issue.assignee.avatarUrl }
      : null,
    priority: issue.priority ?? 0,
    labels: (issue.labels?.nodes || []).map((l) => ({
      name: l.name,
      color: l.color,
    })),
    team: issue.team ? { name: issue.team.name } : null,
    project: issue.project ? { name: issue.project.name } : null,
    updatedAt: issue.updatedAt,
    url: issue.url,
  };

  await kvsSet(cacheKey, data, 300);
  return data;
}

const resolver = new Resolver();

resolver.define('resolveLink', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const url = validateUrl(payload?.url, { required: false });
    if (!url) return null;
    return await fetchIssueForUrl(url, siteId);
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (!/not connected/i.test(err.message || '')) {
      console.error('Link unfurl failed:', err?.message || 'unknown');
    }
    return { error: sanitizeUserError(err) };
  }
});

function buildSmartLinkEntity(url, data) {
  if (!data || data.notFound) {
    return {
      identifier: { url },
      meta: { access: 'not_found', visibility: 'not_found' },
    };
  }
  if (data.error) {
    return {
      identifier: { url },
      meta: { access: 'unauthorized', visibility: 'not_found' },
    };
  }

  const displayName = `${data.identifier} · ${data.title}`;
  const statusName = data.state?.name || 'Unknown';

  return {
    identifier: { url },
    meta: { access: 'granted', visibility: 'restricted' },
    entity: {
      schemaVersion: '2.0',
      id: data.identifier,
      displayName,
      description: data.description || data.title,
      url: data.url || url,
      'atlassian:remote-link': { type: 'task' },
      thumbnail: { externalUrl: LINEAR_BRAND_ICON },
      icon: { externalUrl: LINEAR_BRAND_ICON },
      createdAt: data.updatedAt,
      lastUpdatedAt: data.updatedAt,
      status: {
        name: statusName,
        color: data.state?.color || '#888',
        type: data.state?.type || 'unknown',
      },
      assignee: data.assignee
        ? {
            displayName: data.assignee.name,
            avatarUrl: data.assignee.avatarUrl,
          }
        : null,
      priority: data.priority,
      labels: data.labels,
      team: data.team?.name,
      project: data.project?.name,
    },
  };
}

async function smartLinkHandler(request) {
  try {
    const urls = request?.payload?.urls || [];
    const siteId = getSiteId(request?.context);

    const entities = await Promise.all(
      urls.map(async (url) => {
        try {
          const data = await fetchIssueForUrl(url, siteId);
          return buildSmartLinkEntity(url, data);
        } catch (err) {
          if (!/not connected/i.test(err.message || '')) {
            console.error('[smartLink] resolve failed:', err.message);
          }
          return {
            identifier: { url },
            meta: { access: 'forbidden', visibility: 'not_found' },
          };
        }
      })
    );

    return { entities };
  } catch (err) {
    console.error('[smartLink] handler failed:', err.message);
    return { entities: [] };
  }
}

exports.handler = resolver.getDefinitions();
exports.smartLinkHandler = smartLinkHandler;
exports.fetchIssueForUrl = fetchIssueForUrl;
exports.buildSmartLinkEntity = buildSmartLinkEntity;
