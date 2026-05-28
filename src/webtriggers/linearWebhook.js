const crypto = require('crypto');
const { storage } = require('@forge/api');
const { kvsDelete } = require('../lib/cache');

let _sql = null;
function getSql() {
  if (_sql === null) {
    try {
      const mod = require('@forge/sql');
      const candidate = mod?.sql ?? mod?.default ?? mod;
      _sql = typeof candidate === 'function' ? candidate : false;
    } catch {
      _sql = false;
    }
  }
  return _sql || null;
}

function pickHeader(headers, key) {
  if (!headers) return null;
  const v = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
  if (v == null) return null;
  return Array.isArray(v) ? v[0] : v;
}

function verifyHmac(rawBody, signature) {
  if (!signature || !process.env.LINEAR_WEBHOOK_SECRET) return false;
  try {
    const expected = crypto
      .createHmac('sha256', process.env.LINEAR_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

async function resolveSiteFromOrganization(organizationId) {
  if (!organizationId) return null;
  try {
    const mapping = await storage.get(`org_mapping:${organizationId}`);
    return mapping?.siteId || null;
  } catch {
    return null;
  }
}

async function invalidateFilterCachesForSite(siteId) {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`UPDATE filter_cache SET refreshed_at = 0 WHERE site_id = ${siteId}`;
  } catch {
    // Non-fatal
  }
}

exports.handler = async ({ body, headers }) => {
  try {
    const signature = pickHeader(headers, 'linear-signature');
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body || {});

    if (!verifyHmac(rawBody, signature)) {
      console.warn('Linear webhook: invalid signature');
      return { statusCode: 401, body: 'Invalid signature' };
    }

    let event;
    try {
      event = typeof body === 'string' ? JSON.parse(body) : body;
    } catch {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
    event = event || {};

    const { action, type, data, organizationId } = event;

    if (type !== 'Issue') {
      return { statusCode: 200, body: 'ignored non-issue event' };
    }

    const siteId = await resolveSiteFromOrganization(organizationId);
    if (!siteId) {
      console.warn('Linear webhook: unknown organization', organizationId);
      return { statusCode: 200, body: 'unknown organization' };
    }

    // Log event (SQL optional)
    const sql = getSql();
    if (sql) {
      const eventId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`;
      try {
        await sql`INSERT INTO webhook_events (id, site_id, event_type, issue_id, payload, received_at)
          VALUES (${eventId}, ${siteId}, ${action || 'unknown'}, ${data?.id || null}, ${rawBody}, ${Date.now()})`;
      } catch {
        // Non-fatal
      }
    }

    // Invalidate the unfurl cache for this issue
    if (data?.identifier) {
      await kvsDelete(`issue:${siteId}:${data.identifier}`);
    }

    // Invalidate filter caches for the whole site (safe coarse invalidation)
    if (data?.team?.id || action === 'create' || action === 'remove') {
      await invalidateFilterCachesForSite(siteId);
    }

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Linear webhook handler error:', err?.message || 'unknown');
    return { statusCode: 500, body: 'Internal error' };
  }
};
