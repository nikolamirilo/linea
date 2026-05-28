const Resolver = require('@forge/resolver').default;
const { queryIssues, listTeams, listLabels } = require('../../lib/linear/queries');
const { parseLinearUrl, queryIssuesByFilter } = require('../../lib/linear/urlParser');
const { kvsGetWithTTL, kvsSet } = require('../../lib/cache/kvsCache');
const { storage } = require('@forge/api');
const { getSiteId, buildMacroKey } = require('../../lib/context');
const { sanitizeUserError, validateUrl, ValidationError } = require('../../lib/security');

const resolver = new Resolver();

// ---- Resolver endpoints ----

resolver.define('getFilterOptions', async ({ context }) => {
  try {
    const siteId = getSiteId(context);
    let teams = await kvsGetWithTTL(`teams:${siteId}`);
    if (!teams) {
      teams = await listTeams(siteId);
      await kvsSet(`teams:${siteId}`, teams, 1800);
    }
    let labels = await kvsGetWithTTL(`labels:${siteId}`);
    if (!labels) {
      labels = await listLabels(siteId);
      await kvsSet(`labels:${siteId}`, labels, 1800);
    }
    return { teams: teams || [], labels: labels || [] };
  } catch (err) {
    if (!/not connected/i.test(err.message || '')) {
      console.error('getFilterOptions failed:', err?.message || 'unknown');
    }
    return { teams: [], labels: [], error: sanitizeUserError(err) };
  }
});

resolver.define('saveMacroConfig', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const { pageId, macroId, config } = payload || {};

    // Reject configs that are absurdly large (defense against KVS abuse).
    if (config && JSON.stringify(config).length > 10000) {
      return { error: 'Macro config exceeds 10KB limit.' };
    }
    // Reject non-object configs.
    if (config != null && typeof config !== 'object') {
      return { error: 'Macro config must be an object.' };
    }

    // buildMacroKey applies safeKeySegment to pageId/macroId — invalid IDs are
    // replaced with safe fallbacks so a hostile UI cannot poison the keyspace.
    const key = buildMacroKey(siteId, pageId, macroId, context);
    await storage.set(key, config);
    return { success: true, key };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error('saveMacroConfig failed:', err?.message || 'unknown');
    return { error: sanitizeUserError(err) };
  }
});

resolver.define('loadMacroConfig', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const { pageId, macroId } = payload || {};
    const key = buildMacroKey(siteId, pageId, macroId, context);
    const config = await storage.get(key);
    return { config: config || null };
  } catch (err) {
    console.error('loadMacroConfig failed:', err?.message || 'unknown');
    return { config: null, error: sanitizeUserError(err) };
  }
});

resolver.define('resolveFilterUrl', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const url = validateUrl(payload?.url, { required: true });
    const filter = parseLinearUrl(url);
    if (filter.error) {
      return { issues: [], error: filter.error };
    }
    const issues = await queryIssuesByFilter(siteId, filter);
    // Normalize shape: labels from GraphQL nodes → plain array
    const normalized = (issues || []).map((i) => ({
      ...i,
      labels: i.labels?.nodes || i.labels || [],
    }));
    return { issues: normalized };
  } catch (err) {
    if (err instanceof ValidationError) return { issues: [], error: err.message };
    if (!/not connected/i.test(err.message || '')) {
      console.error('resolveFilterUrl failed:', err?.message || 'unknown');
    }
    return { issues: [], error: sanitizeUserError(err) };
  }
});

resolver.define('getFilterResults', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const config = payload?.config || context?.extension?.config || {};
    if (config.url) {
      const filter = parseLinearUrl(config.url);
      if (filter.error) {
        return { issues: [], error: filter.error };
      }
      const issues = await queryIssuesByFilter(siteId, filter);
      return {
        issues: issues.map((i) => ({
          ...i,
          labels: i.labels?.nodes || i.labels || [],
        })),
      };
    }
    // Legacy path: teamId-based config (from older saved macros)
    if (config.teamId) {
      const issues = await queryIssues(siteId, {
        teamId: config.teamId,
        stateTypes: config.stateTypes || ['started'],
        limit: 50,
      });
      return {
        issues: issues.map((i) => ({
          ...i,
          labels: i.labels?.nodes || i.labels || [],
        })),
      };
    }
    return { issues: [], error: 'Macro not configured - click Settings' };
  } catch (err) {
    if (!/not connected/i.test(err.message || '')) {
      console.error('getFilterResults failed:', err?.message || 'unknown');
    }
    return { issues: [], error: sanitizeUserError(err) };
  }
});

exports.handler = resolver.getDefinitions();
