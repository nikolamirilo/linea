const { storage } = require('@forge/api');
const { kvsGet, kvsSet, kvsGetWithTTL, kvsDelete } = require('../../src/lib/cache');

describe('KVS cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('kvsGet', () => {
    test('returns stored value', async () => {
      storage.get.mockResolvedValue({ data: 'test', storedAt: Date.now(), ttl: null });
      const result = await kvsGet('key');
      expect(result).toEqual({ data: 'test', storedAt: expect.any(Number), ttl: null });
      expect(storage.get).toHaveBeenCalledWith('key');
    });

    test('returns null on error', async () => {
      storage.get.mockRejectedValue(new Error('fail'));
      const result = await kvsGet('key');
      expect(result).toBeNull();
    });
  });

  describe('kvsSet', () => {
    test('stores value with TTL', async () => {
      storage.set.mockResolvedValue();
      await kvsSet('key', 'value', 300);
      expect(storage.set).toHaveBeenCalledWith('key', {
        data: 'value',
        storedAt: expect.any(Number),
        ttl: 300000,
      });
    });

    test('stores value without TTL', async () => {
      storage.set.mockResolvedValue();
      await kvsSet('key', 'value');
      expect(storage.set).toHaveBeenCalledWith('key', {
        data: 'value',
        storedAt: expect.any(Number),
        ttl: null,
      });
    });
  });

  describe('kvsGetWithTTL', () => {
    test('returns data when within TTL', async () => {
      storage.get.mockResolvedValue({
        data: 'fresh',
        storedAt: Date.now() - 1000,
        ttl: 60000,
      });
      const result = await kvsGetWithTTL('key');
      expect(result).toBe('fresh');
    });

    test('returns null and deletes when expired', async () => {
      storage.get.mockResolvedValue({
        data: 'stale',
        storedAt: Date.now() - 120000,
        ttl: 60000,
      });
      storage.delete.mockResolvedValue();
      const result = await kvsGetWithTTL('key');
      expect(result).toBeNull();
      expect(storage.delete).toHaveBeenCalledWith('key');
    });

    test('returns null when no record', async () => {
      storage.get.mockResolvedValue(null);
      const result = await kvsGetWithTTL('key');
      expect(result).toBeNull();
    });
  });

  describe('kvsDelete', () => {
    test('deletes key', async () => {
      storage.delete.mockResolvedValue();
      await kvsDelete('key');
      expect(storage.delete).toHaveBeenCalledWith('key');
    });
  });
});
