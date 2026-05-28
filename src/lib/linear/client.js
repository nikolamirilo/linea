const { storage, fetch } = require('@forge/api');

const LINEAR_API_URL = 'https://api.linear.app/graphql';

// --- Rate limiting & retry ---
//
// Linear's documented limit is 1,500 requests/hour per workspace. We add two
// layers of protection:
//   1. In-process throttle: at most 10 concurrent requests per process to avoid
//      bursts from a single warm Lambda invocation.
//   2. Retry-on-429 with exponential backoff (3 attempts, 0.5s/1s/2s).
// This is also a defense against accidentally DoSing Linear from a tight loop.

const MAX_CONCURRENT = 10;
const MAX_RETRIES = 3;
let inFlight = 0;
const queue = [];

function acquireSlot() {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot() {
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  } else {
    inFlight = Math.max(0, inFlight - 1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Token management ---

async function getAccessToken(siteId) {
  const tokens = await storage.getSecret(`linear_tokens:${siteId}`);
  if (!tokens) {
    throw new Error(
      'Linear workspace not connected. Please configure in admin settings.'
    );
  }
  if (tokens.expiresAt && Date.now() > tokens.expiresAt - 5 * 60 * 1000) {
    return refreshAccessToken(siteId, tokens);
  }
  return tokens.accessToken;
}

async function refreshAccessToken(siteId, tokens) {
  const res = await fetch('https://api.linear.app/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: process.env.LINEAR_CLIENT_ID,
      client_secret: process.env.LINEAR_CLIENT_SECRET,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Linear token: ${res.status}`);
  }

  const data = await res.json();
  await storage.setSecret(`linear_tokens:${siteId}`, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    scope: data.scope,
  });

  return data.access_token;
}

// --- GraphQL client ---

async function linearQuery(siteId, query, variables = {}) {
  const token = await getAccessToken(siteId);

  await acquireSlot();
  try {
    let lastErr = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      // Timeout after 15s to avoid hanging Forge invocations on a stalled Linear API.
      const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), 15000)
        : null;

      try {
        const res = await fetch(LINEAR_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query, variables }),
          signal: controller ? controller.signal : undefined,
        });

        // Retry 429 (rate limited) and 5xx (transient upstream).
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          if (attempt < MAX_RETRIES - 1) {
            const retryAfter = Number(res.headers.get?.('retry-after')) || 0;
            const backoff = retryAfter > 0
              ? Math.min(retryAfter * 1000, 5000)
              : 500 * 2 ** attempt;
            await sleep(backoff);
            continue;
          }
          throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
        }

        if (!res.ok) {
          throw new Error(`Linear API error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json();
        if (json.errors) {
          throw new Error(
            `Linear GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`
          );
        }
        return json.data;
      } catch (err) {
        lastErr = err;
        // Only retry abort/network errors; surface other errors immediately.
        const isTransient = err?.name === 'AbortError' || /network|fetch/i.test(err?.message || '');
        if (!isTransient || attempt >= MAX_RETRIES - 1) throw err;
        await sleep(500 * 2 ** attempt);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
    throw lastErr || new Error('Linear request failed after retries');
  } finally {
    releaseSlot();
  }
}

module.exports = {
  getAccessToken,
  linearQuery,
};
