const Resolver = require('@forge/resolver').default;
const {
  startOAuthFlow,
  disconnectWorkspace,
  isConnected,
  getOAuthCallbackUrl,
} = require('../../lib/oauth');
const { getWorkspaceInfo } = require('../../lib/linear/queries');
const { getSiteId } = require('../../lib/context');
const { sanitizeUserError } = require('../../lib/security');

const resolver = new Resolver();

resolver.define('getConnectionStatus', async ({ context }) => {
  try {
    const siteId = getSiteId(context);
    const connected = await isConnected(siteId);
    if (!connected) {
      return { connected: false, workspace: null };
    }

    try {
      const workspace = await getWorkspaceInfo(siteId);
      return { connected: true, workspace };
    } catch (err) {
      // Tokens exist but workspace fetch failed (token revoked, network error, etc.)
      return {
        connected: true,
        workspace: null,
        warning: `Connected, but failed to load workspace details: ${sanitizeUserError(err)}`,
      };
    }
  } catch (err) {
    console.error('getConnectionStatus failed:', err?.message || 'unknown');
    return { connected: false, workspace: null, error: sanitizeUserError(err) };
  }
});

resolver.define('startOAuth', async ({ context }) => {
  try {
    const siteId = getSiteId(context);
    const redirectUri = await getOAuthCallbackUrl();
    if (!redirectUri) {
      return {
        error:
          'OAuth callback URL unavailable. Ensure the app is installed and the oauth-callback web trigger is deployed.',
      };
    }
    const authorizeUrl = await startOAuthFlow(siteId, redirectUri);
    return { authorizeUrl, redirectUri };
  } catch (err) {
    console.error('startOAuth failed:', err?.message || 'unknown');
    return { error: sanitizeUserError(err) };
  }
});

resolver.define('disconnect', async ({ context }) => {
  try {
    const siteId = getSiteId(context);
    await disconnectWorkspace(siteId);
    return { success: true };
  } catch (err) {
    console.error('disconnect failed:', err?.message || 'unknown');
    return { success: false, error: sanitizeUserError(err) };
  }
});

exports.handler = resolver.getDefinitions();
