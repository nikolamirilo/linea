const { storage, fetch, webTrigger } = require('@forge/api');
const crypto = require('crypto');

const LINEAR_AUTH_URL = 'https://linear.app/oauth/authorize';
const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token';

/**
 * Look up the oauth-callback web trigger URL. This is the URL Linear will
 * redirect back to after the user grants consent.
 *
 * Forge exposes `webTrigger.getUrl(triggerKey)`. If unavailable (older runtime),
 * callers may pass a pre-computed URL.
 */
async function getOAuthCallbackUrl() {
  if (webTrigger && typeof webTrigger.getUrl === 'function') {
    try {
      return await webTrigger.getUrl('oauth-callback');
    } catch (err) {
      console.error('Failed to resolve oauth-callback web trigger URL:', err.message);
    }
  }
  return null;
}

async function getWebhookCallbackUrl() {
  if (webTrigger && typeof webTrigger.getUrl === 'function') {
    try {
      return await webTrigger.getUrl('linear-webhook');
    } catch {}
  }
  return null;
}

async function startOAuthFlow(siteId, redirectUri) {
  if (!process.env.LINEAR_CLIENT_ID) {
    throw new Error('LINEAR_CLIENT_ID environment variable is not set');
  }

  const resolvedRedirectUri = redirectUri || (await getOAuthCallbackUrl());
  if (!resolvedRedirectUri) {
    throw new Error('Unable to determine OAuth callback URL. Configure the oauth-callback web trigger.');
  }

  const state = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(64).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // Persist state for 10 min. Include the exact redirectUri so the callback can
  // use the same value when exchanging the code (Linear requires an exact match).
  await storage.setSecret(`oauth_state:${state}`, {
    siteId,
    codeVerifier,
    redirectUri: resolvedRedirectUri,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.LINEAR_CLIENT_ID,
    redirect_uri: resolvedRedirectUri,
    response_type: 'code',
    scope: 'read write issues:create admin',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent',
  });

  return `${LINEAR_AUTH_URL}?${params.toString()}`;
}

async function handleCallback(code, state) {
  const stored = await storage.getSecret(`oauth_state:${state}`);
  if (!stored) {
    throw new Error('Invalid OAuth state - not found (possibly reused or fabricated)');
  }
  if (stored.expiresAt < Date.now()) {
    try { await storage.deleteSecret(`oauth_state:${state}`); } catch {}
    throw new Error('OAuth state expired, please restart the connection flow');
  }

  const res = await fetch(LINEAR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.LINEAR_CLIENT_ID,
      client_secret: process.env.LINEAR_CLIENT_SECRET,
      redirect_uri: stored.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: stored.codeVerifier,
    }).toString(),
  });

  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch {}
    throw new Error(`Token exchange failed: ${res.status} ${errText}`);
  }

  const tokens = await res.json();

  await storage.setSecret(`linear_tokens:${stored.siteId}`, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in || 864000) * 1000,
    scope: tokens.scope,
  });

  try { await storage.deleteSecret(`oauth_state:${state}`); } catch {}
  return { siteId: stored.siteId };
}

/**
 * Disconnect a Linear workspace from a Confluence site.
 *
 * Clears all per-site cached data so that reconnecting to a different Linear
 * workspace does not surface stale issues, teams, projects, or label metadata.
 * Best-effort — individual delete failures are swallowed so a partial failure
 * does not leave the user unable to reconnect.
 */
async function disconnectWorkspace(siteId) {
  // Scalar per-site keys we know about.
  const scalarSecretKeys = [`linear_tokens:${siteId}`];
  const scalarKeys = [
    `workspace_config:${siteId}`,
    `teams:${siteId}`,
    `labels:${siteId}`,
  ];
  for (const k of scalarSecretKeys) {
    try { await storage.deleteSecret(k); } catch {}
  }
  for (const k of scalarKeys) {
    try { await storage.delete(k); } catch {}
  }

  // Prefixed caches we populate per teamId / per identifier / per usage-month.
  // Forge `storage.query()` is best-effort here — older runtimes or test mocks
  // may not implement it, so we degrade gracefully.
  await deleteByPrefix(`issue:${siteId}:`);
  await deleteByPrefix(`projects:${siteId}:`);
  await deleteByPrefix(`usage:${siteId}:`);
  await deleteByPrefix(`macro_config:${siteId}:`);
}

async function deleteByPrefix(prefix) {
  try {
    if (!storage.query || typeof storage.query !== 'function') return;
    const startsWith = require('@forge/api').startsWith;
    if (!startsWith) return;
    let cursor;
    // Page through results so very large workspaces don't OOM the lambda.
    /* eslint-disable no-await-in-loop */
    do {
      const q = storage.query().where('key', startsWith(prefix));
      const result = await (cursor ? q.cursor(cursor).getMany() : q.getMany());
      const items = result?.results || [];
      for (const item of items) {
        try { await storage.delete(item.key); } catch {}
      }
      cursor = result?.nextCursor;
    } while (cursor);
    /* eslint-enable no-await-in-loop */
  } catch {
    // Best-effort. If query() is unavailable, scalar keys above still cover
    // the most important per-site data (tokens + teams + labels).
  }
}

async function isConnected(siteId) {
  try {
    const tokens = await storage.getSecret(`linear_tokens:${siteId}`);
    return !!tokens;
  } catch {
    return false;
  }
}

module.exports = {
  startOAuthFlow,
  handleCallback,
  disconnectWorkspace,
  isConnected,
  getOAuthCallbackUrl,
  getWebhookCallbackUrl,
};
