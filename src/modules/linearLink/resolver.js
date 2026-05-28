const Resolver = require('@forge/resolver').default;
const { fetchIssueForUrl } = require('../linkUnfurl/resolver');
const { getSiteId } = require('../../lib/context');
const { sanitizeUserError, validateUrl, ValidationError } = require('../../lib/security');

const resolver = new Resolver();

resolver.define('getLinearIssue', async ({ payload, context }) => {
  try {
    const siteId = getSiteId(context);
    const url = validateUrl(payload?.url, { required: true });
    const data = await fetchIssueForUrl(url, siteId);
    if (!data) return { error: 'Not a Linear issue URL' };
    if (data.notFound) return { notFound: true, identifier: data.identifier };
    return { issue: data };
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    if (!/not connected/i.test(err.message || '')) {
      console.error('getLinearIssue failed:', err?.message || 'unknown');
    }
    return { error: sanitizeUserError(err) };
  }
});

exports.handler = resolver.getDefinitions();
