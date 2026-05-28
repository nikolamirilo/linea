// --- SQL cache (larger payloads like filter results) ---
// Lazy-load @forge/sql so the module can load even without SQL permission.

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

async function sqlGet(table, key) {
  const sql = getSql();
  if (!sql) return null;
  try {
    const result =
      await sql`SELECT * FROM filter_cache WHERE config_hash = ${key} LIMIT 1`;
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

async function sqlSet(table, key, data) {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`INSERT INTO filter_cache (config_hash, site_id, payload, refreshed_at)
      VALUES (${key}, ${data.site_id}, ${data.payload}, ${data.refreshed_at})
      ON CONFLICT (config_hash)
      DO UPDATE SET payload = ${data.payload}, refreshed_at = ${data.refreshed_at}`;
  } catch {}
}

async function sqlDelete(table, key) {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`DELETE FROM filter_cache WHERE config_hash = ${key}`;
  } catch {}
}

async function sqlGetStaleFilters(maxAgeMs, limit) {
  const sql = getSql();
  if (!sql) return [];
  try {
    const cutoff = Date.now() - maxAgeMs;
    const result = await sql`SELECT config_hash, site_id, payload, refreshed_at
      FROM filter_cache
      WHERE refreshed_at < ${cutoff}
      ORDER BY refreshed_at ASC
      LIMIT ${limit}`;
    return result.rows;
  } catch {
    return [];
  }
}

async function initSqlSchema() {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`CREATE TABLE IF NOT EXISTS filter_cache (
      config_hash TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      refreshed_at BIGINT NOT NULL
    )`;
  } catch {}
}

module.exports = {
  sqlGet,
  sqlSet,
  sqlDelete,
  sqlGetStaleFilters,
  initSqlSchema,
};
