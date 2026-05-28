const { storage } = require('@forge/api');

// --- KVS cache (small, high-frequency items) ---

async function kvsGet(key) {
  try {
    return await storage.get(key);
  } catch {
    return null;
  }
}

async function kvsSet(key, value, ttlSeconds) {
  const record = {
    data: value,
    storedAt: Date.now(),
    ttl: ttlSeconds ? ttlSeconds * 1000 : null,
  };
  await storage.set(key, record);
}

async function kvsGetWithTTL(key) {
  const record = await kvsGet(key);
  if (!record) return null;
  if (record.ttl && Date.now() - record.storedAt > record.ttl) {
    try {
      await storage.delete(key);
    } catch {}
    return null;
  }
  return record.data;
}

async function kvsDelete(key) {
  try {
    await storage.delete(key);
  } catch {}
}

module.exports = {
  kvsGet,
  kvsSet,
  kvsGetWithTTL,
  kvsDelete,
};
