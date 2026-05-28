const { storage, fetch } = require('@forge/api');

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn((size) => ({
    toString: jest.fn(() => 'a'.repeat(size)),
  })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mock_code_challenge'),
    })),
  })),
}));

const { startOAuthFlow, handleCallback, isConnected, disconnectWorkspace } = require('../../src/lib/oauth');

describe('OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LINEAR_CLIENT_ID = 'test_client_id';
    process.env.LINEAR_CLIENT_SECRET = 'test_client_secret';
  });

  describe('startOAuthFlow', () => {
    test('generates authorize URL and stores state', async () => {
      storage.setSecret.mockResolvedValue();

      const url = await startOAuthFlow('site-1', 'https://example.com/callback');

      expect(url).toContain('https://linear.app/oauth/authorize');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('code_challenge_method=S256');
      expect(storage.setSecret).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleCallback', () => {
    test('exchanges code for tokens using stored redirectUri', async () => {
      storage.getSecret.mockResolvedValue({
        siteId: 'site-1',
        codeVerifier: 'verifier',
        redirectUri: 'https://example.com/callback',
        expiresAt: Date.now() + 60000,
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'at_123',
            refresh_token: 'rt_456',
            expires_in: 864000,
            scope: 'read write',
          }),
      });

      storage.setSecret.mockResolvedValue();
      storage.deleteSecret.mockResolvedValue();

      const result = await handleCallback('code_abc', 'state_xyz');

      expect(result).toEqual({ siteId: 'site-1' });
      expect(storage.setSecret).toHaveBeenCalledWith(
        'linear_tokens:site-1',
        expect.objectContaining({
          accessToken: 'at_123',
          refreshToken: 'rt_456',
        })
      );
    });

    test('throws on invalid state', async () => {
      storage.getSecret.mockResolvedValue(null);

      await expect(handleCallback('code', 'bad_state')).rejects.toThrow(
        'Invalid OAuth state'
      );
    });

    test('throws on expired state', async () => {
      storage.getSecret.mockResolvedValue({
        siteId: 'site-1',
        codeVerifier: 'verifier',
        redirectUri: 'url',
        expiresAt: Date.now() - 60000,
      });
      storage.deleteSecret.mockResolvedValue();

      await expect(handleCallback('code', 'state')).rejects.toThrow('expired');
    });
  });

  describe('isConnected', () => {
    test('returns true when tokens exist', async () => {
      storage.getSecret.mockResolvedValue({ accessToken: 'abc' });
      expect(await isConnected('site-1')).toBe(true);
    });

    test('returns false when no tokens', async () => {
      storage.getSecret.mockResolvedValue(null);
      expect(await isConnected('site-1')).toBe(false);
    });
  });

  describe('disconnectWorkspace', () => {
    test('deletes tokens and config', async () => {
      storage.deleteSecret.mockResolvedValue();
      storage.delete.mockResolvedValue();

      await disconnectWorkspace('site-1');

      expect(storage.deleteSecret).toHaveBeenCalledWith('linear_tokens:site-1');
      expect(storage.delete).toHaveBeenCalledWith('workspace_config:site-1');
    });
  });
});
