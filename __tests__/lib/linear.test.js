const { storage, fetch } = require('@forge/api');
const {
  listTeams,
  createIssue,
  queryIssues,
} = require('../../src/lib/linear');

describe('Linear client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LINEAR_CLIENT_ID = 'test_id';
    process.env.LINEAR_CLIENT_SECRET = 'test_secret';
  });

  function mockTokenAndFetch(responseData) {
    storage.getSecret.mockResolvedValue({
      accessToken: 'test_token',
      expiresAt: Date.now() + 3600000,
    });

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: responseData }),
    });
  }

  test('listTeams calls GraphQL and returns teams', async () => {
    mockTokenAndFetch({
      teams: { nodes: [{ id: 't1', name: 'Engineering', key: 'ENG' }] },
    });

    const teams = await listTeams('site-1');

    expect(teams).toEqual([{ id: 't1', name: 'Engineering', key: 'ENG' }]);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.linear.app/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test_token',
        }),
      })
    );
  });

  test('createIssue sends mutation', async () => {
    mockTokenAndFetch({
      issueCreate: {
        success: true,
        issue: { id: 'i1', identifier: 'ENG-1', title: 'Test', url: 'https://linear.app/test' },
      },
    });

    const issue = await createIssue('site-1', {
      title: 'Test Issue',
      description: 'Description',
      teamId: 't1',
    });

    expect(issue).toEqual(
      expect.objectContaining({ identifier: 'ENG-1', title: 'Test' })
    );
  });

  test('createIssue throws on failure', async () => {
    mockTokenAndFetch({ issueCreate: { success: false } });

    await expect(
      createIssue('site-1', { title: 'Test', description: '', teamId: 't1' })
    ).rejects.toThrow('Failed to create Linear issue');
  });

  test('throws on missing token', async () => {
    storage.getSecret.mockResolvedValue(null);

    await expect(listTeams('site-1')).rejects.toThrow('not connected');
  });

  test('refreshes token when stored token is near expiry', async () => {
    // Token expires in 60s - within the 5-minute refresh window.
    storage.getSecret.mockResolvedValue({
      accessToken: 'old_token',
      refreshToken: 'rt_old',
      expiresAt: Date.now() + 60 * 1000,
    });
    storage.setSecret.mockResolvedValue();

    // First fetch = token refresh response. Second fetch = actual GraphQL call.
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new_token',
            refresh_token: 'rt_new',
            expires_in: 864000,
            scope: 'read write',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { teams: { nodes: [{ id: 't1', name: 'E', key: 'E' }] } },
          }),
      });

    await listTeams('site-1');

    // Refresh request should hit the token endpoint with grant_type=refresh_token.
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.linear.app/oauth/token',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('grant_type=refresh_token'),
      })
    );
    // New tokens should have been persisted.
    expect(storage.setSecret).toHaveBeenCalledWith(
      'linear_tokens:site-1',
      expect.objectContaining({
        accessToken: 'new_token',
        refreshToken: 'rt_new',
      })
    );
    // Subsequent GraphQL call should use the refreshed token.
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.linear.app/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer new_token',
        }),
      })
    );
  });

  test('throws when refresh fails (expired/revoked refresh token)', async () => {
    storage.getSecret.mockResolvedValue({
      accessToken: 'old_token',
      refreshToken: 'rt_old',
      expiresAt: Date.now() + 60 * 1000,
    });

    fetch.mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(listTeams('site-1')).rejects.toThrow('Failed to refresh');
  });

  test('queryIssues builds correct filter', async () => {
    mockTokenAndFetch({
      issues: {
        nodes: [
          {
            id: 'i1',
            identifier: 'ENG-1',
            title: 'Task',
            priority: 2,
            url: 'https://linear.app/test',
            updatedAt: '2026-01-01',
            state: { name: 'In Progress', type: 'started', color: '#f00' },
            assignee: { id: 'u1', name: 'Alice', avatarUrl: '' },
            labels: { nodes: [] },
            team: { id: 't1', name: 'Eng' },
            estimate: null,
          },
        ],
      },
    });

    const issues = await queryIssues('site-1', {
      teamId: 't1',
      stateTypes: ['started'],
      limit: 10,
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].identifier).toBe('ENG-1');

    // Verify the request body contains the filter
    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody.variables.filter).toEqual(
      expect.objectContaining({
        team: { id: { eq: 't1' } },
        state: { type: { in: ['started'] } },
      })
    );
  });
});
