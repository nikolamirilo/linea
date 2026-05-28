/**
 * Scheduled trigger: runs every 5 minutes.
 *
 * Invalidates filter cache rows older than 10 minutes so the next macro view
 * re-queries Linear. Requires `@forge/sql` to be provisioned (the app does not
 * currently declare the SQL permission, so this will no-op silently).
 */

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

exports.handler = async () => {
  const sql = getSql();
  if (!sql) {
    // SQL not available - nothing to do. Do not log to avoid noise in Forge logs.
    return;
  }

  try {
    const cutoff = Date.now() - 10 * 60 * 1000;
    await sql`UPDATE filter_cache SET refreshed_at = 0 WHERE refreshed_at > 0 AND refreshed_at < ${cutoff}`;
  } catch (err) {
    console.error('Scheduled cache invalidation failed:', err.message);
  }
};
