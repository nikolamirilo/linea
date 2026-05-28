// Backward-compatibility facade: re-exports from split modules.
// New code should import from lib/cache/kvsCache or lib/cache/sqlCache directly.

const {
  kvsGet,
  kvsSet,
  kvsGetWithTTL,
  kvsDelete,
} = require('./cache/kvsCache');

const {
  sqlGet,
  sqlSet,
  sqlDelete,
  sqlGetStaleFilters,
  initSqlSchema,
} = require('./cache/sqlCache');

module.exports = {
  kvsGet,
  kvsSet,
  kvsGetWithTTL,
  kvsDelete,
  sqlGet,
  sqlSet,
  sqlDelete,
  sqlGetStaleFilters,
  initSqlSchema,
};
