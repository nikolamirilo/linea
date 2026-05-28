const { storage } = require('@forge/api');

jest.mock('../../src/lib/linear/queries', () => ({
  getIssueByIdentifier: jest.fn(),
}));
jest.mock('../../src/lib/cache/kvsCache', () => ({
  kvsGetWithTTL: jest.fn(),
  kvsSet: jest.fn(),
}));

const { getIssueByIdentifier } = require('../../src/lib/linear/queries');
const { kvsGetWithTTL, kvsSet } = require('../../src/lib/cache/kvsCache');

// Load resolver
const resolverDefs = require('../../src/modules/linkUnfurl/resolver').handler;

describe('Link Unfurl resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context = { cloudId: 'site-1', siteId: 'site-1' };

  test('returns cached data when available', async () => {
    const cachedData = {
      identifier: 'ENG-1',
      title: 'Fix bug',
      state: { name: 'In Progress', type: 'started', color: '#f00' },
      assignee: { name: 'Alice', avatarUrl: '' },
      priority: 2,
      labels: [],
      updatedAt: '2026-01-01',
      url: 'https://linear.app/test/issue/ENG-1',
    };
    kvsGetWithTTL.mockResolvedValue(cachedData);

    const result = await resolverDefs.resolveLink({
      payload: { url: 'https://linear.app/acme/issue/ENG-1/fix-bug' },
      context,
    });

    expect(result).toEqual(cachedData);
    expect(getIssueByIdentifier).not.toHaveBeenCalled();
  });

  test('fetches from Linear on cache miss', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    kvsSet.mockResolvedValue();
    getIssueByIdentifier.mockResolvedValue({
      identifier: 'ENG-1',
      title: 'Fix bug',
      state: { name: 'In Progress', type: 'started', color: '#f00' },
      assignee: { name: 'Alice', avatarUrl: '' },
      priority: 2,
      labels: { nodes: [{ name: 'bug', color: '#ff0000' }] },
      updatedAt: '2026-01-01',
      url: 'https://linear.app/test/issue/ENG-1',
    });

    const result = await resolverDefs.resolveLink({
      payload: { url: 'https://linear.app/acme/issue/ENG-1/fix-bug' },
      context,
    });

    expect(result.identifier).toBe('ENG-1');
    expect(result.labels).toEqual([{ name: 'bug', color: '#ff0000' }]);
    expect(kvsSet).toHaveBeenCalledWith(
      'issue:site-1:ENG-1',
      expect.any(Object),
      300
    );
  });

  test('returns notFound for unknown issues', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    getIssueByIdentifier.mockResolvedValue(null);

    const result = await resolverDefs.resolveLink({
      payload: { url: 'https://linear.app/acme/issue/ENG-999/nonexistent' },
      context,
    });

    expect(result.notFound).toBe(true);
  });

  test('returns null for non-Linear URLs', async () => {
    const result = await resolverDefs.resolveLink({
      payload: { url: 'https://example.com/not-linear' },
      context,
    });

    expect(result).toBeNull();
  });

  test('handles fetch errors gracefully', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    getIssueByIdentifier.mockRejectedValue(new Error('API down'));

    const result = await resolverDefs.resolveLink({
      payload: { url: 'https://linear.app/acme/issue/ENG-1/test' },
      context,
    });

    // Standardized error shape: { error: string }
    expect(result.error).toBe('API down');
  });
});

describe('Smart link handler (graph:smartLink)', () => {
  const { smartLinkHandler } = require('../../src/modules/linkUnfurl/resolver');
  const context = { cloudId: 'site-1', siteId: 'site-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns granted entity with full metadata for a Linear URL', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    getIssueByIdentifier.mockResolvedValue({
      identifier: 'ENG-42',
      title: 'Improve onboarding',
      description: 'Rework the first-run flow',
      state: { name: 'In Progress', type: 'started', color: '#f0a' },
      assignee: { name: 'Alice', avatarUrl: 'https://example/a.png' },
      priority: 2,
      labels: { nodes: [{ name: 'ux', color: '#0af' }] },
      team: { name: 'Engineering' },
      project: { name: 'Q2 Roadmap' },
      updatedAt: '2026-04-01T10:00:00Z',
      url: 'https://linear.app/acme/issue/ENG-42',
    });

    const result = await smartLinkHandler({
      payload: { urls: ['https://linear.app/acme/issue/ENG-42/improve-onboarding'] },
      context,
    });

    expect(result.entities).toHaveLength(1);
    const [entry] = result.entities;
    expect(entry.meta.access).toBe('granted');
    expect(entry.entity.schemaVersion).toBe('2.0');
    expect(entry.entity.id).toBe('ENG-42');
    expect(entry.entity.displayName).toContain('ENG-42');
    expect(entry.entity.displayName).toContain('Improve onboarding');
    expect(entry.entity.status.name).toBe('In Progress');
    expect(entry.entity.assignee.displayName).toBe('Alice');
    expect(entry.entity['atlassian:remote-link'].type).toBe('task');
    expect(entry.entity.thumbnail.externalUrl).toMatch(/^https:\/\//);
  });

  test('returns not_found for unknown issue', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    getIssueByIdentifier.mockResolvedValue(null);

    const result = await smartLinkHandler({
      payload: { urls: ['https://linear.app/acme/issue/ENG-999/gone'] },
      context,
    });

    expect(result.entities[0].meta.access).toBe('not_found');
    expect(result.entities[0].entity).toBeUndefined();
  });

  test('skips non-Linear URLs gracefully', async () => {
    const result = await smartLinkHandler({
      payload: { urls: ['https://example.com/page'] },
      context,
    });

    expect(result.entities[0].meta.access).toBe('not_found');
  });

  test('handles multiple URLs in one request', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    getIssueByIdentifier
      .mockResolvedValueOnce({
        identifier: 'ENG-1',
        title: 'One',
        description: '',
        state: { name: 'Todo', type: 'unstarted', color: '#888' },
        assignee: null,
        priority: 0,
        labels: { nodes: [] },
        updatedAt: '2026-04-01T10:00:00Z',
        url: 'https://linear.app/acme/issue/ENG-1',
      })
      .mockResolvedValueOnce(null);

    const result = await smartLinkHandler({
      payload: {
        urls: [
          'https://linear.app/acme/issue/ENG-1/one',
          'https://linear.app/acme/issue/ENG-2/missing',
        ],
      },
      context,
    });

    expect(result.entities).toHaveLength(2);
    expect(result.entities[0].meta.access).toBe('granted');
    expect(result.entities[1].meta.access).toBe('not_found');
  });
});
