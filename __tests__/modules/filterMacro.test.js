jest.mock('../../src/lib/linear/queries', () => ({
  queryIssues: jest.fn(),
  listTeams: jest.fn(),
  listLabels: jest.fn(),
}));
jest.mock('../../src/lib/linear/client', () => ({
  linearQuery: jest.fn(),
}));
jest.mock('../../src/lib/cache/kvsCache', () => ({
  kvsGetWithTTL: jest.fn(),
  kvsSet: jest.fn(),
}));

const { queryIssues, listTeams, listLabels } = require('../../src/lib/linear/queries');
const { kvsGetWithTTL, kvsSet } = require('../../src/lib/cache/kvsCache');
const { storage } = require('@forge/api');

const resolverDefs = require('../../src/modules/filterMacro/resolver').handler;

describe('Filter Macro resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context = { cloudId: 'site-1', siteId: 'site-1', extension: { config: {} } };

  describe('getFilterOptions', () => {
    test('returns cached teams and labels', async () => {
      kvsGetWithTTL.mockResolvedValueOnce([{ id: 't1', name: 'Eng', key: 'ENG' }]);
      kvsGetWithTTL.mockResolvedValueOnce([{ id: 'l1', name: 'Bug', color: '#f00' }]);

      const result = await resolverDefs.getFilterOptions({ context });

      expect(result.teams).toHaveLength(1);
      expect(result.labels).toHaveLength(1);
      expect(listTeams).not.toHaveBeenCalled();
    });

    test('fetches teams and labels on cache miss', async () => {
      kvsGetWithTTL.mockResolvedValue(null);
      kvsSet.mockResolvedValue();
      listTeams.mockResolvedValue([{ id: 't1', name: 'Eng', key: 'ENG' }]);
      listLabels.mockResolvedValue([{ id: 'l1', name: 'Bug', color: '#f00' }]);

      const result = await resolverDefs.getFilterOptions({ context });

      expect(result.teams).toHaveLength(1);
      expect(result.labels).toHaveLength(1);
      expect(listTeams).toHaveBeenCalledWith('site-1');
    });

    test('returns error field if listTeams throws', async () => {
      kvsGetWithTTL.mockResolvedValue(null);
      listTeams.mockRejectedValue(new Error('boom'));

      const result = await resolverDefs.getFilterOptions({ context });

      expect(result.error).toBe('boom');
      expect(result.teams).toEqual([]);
    });
  });

  describe('saveMacroConfig / loadMacroConfig', () => {
    test('save stores under derived key', async () => {
      storage.set.mockResolvedValue();

      const result = await resolverDefs.saveMacroConfig({
        payload: {
          pageId: 'page-1',
          macroId: 'macro-1',
          config: { url: 'https://linear.app/acme/team/ENG/active', columns: ['identifier'] },
        },
        context,
      });

      expect(result.success).toBe(true);
      expect(storage.set).toHaveBeenCalledWith(
        'macro_config:site-1:page-1:macro-1',
        { url: 'https://linear.app/acme/team/ENG/active', columns: ['identifier'] }
      );
    });

    test('load retrieves from storage', async () => {
      const saved = { url: 'https://linear.app/acme/team/ENG/active', columns: ['identifier'] };
      storage.get.mockResolvedValue(saved);

      const result = await resolverDefs.loadMacroConfig({
        payload: { pageId: 'page-1', macroId: 'macro-1' },
        context,
      });

      expect(result.config).toEqual(saved);
      expect(storage.get).toHaveBeenCalledWith('macro_config:site-1:page-1:macro-1');
    });

    test('load returns null when nothing stored', async () => {
      storage.get.mockResolvedValue(null);

      const result = await resolverDefs.loadMacroConfig({
        payload: { pageId: 'page-1', macroId: 'macro-1' },
        context,
      });

      expect(result.config).toBeNull();
    });
  });

  describe('resolveFilterUrl', () => {
    test('parses team URL and queries Linear', async () => {
      kvsGetWithTTL.mockResolvedValue([{ id: 't1', name: 'Engineering', key: 'ENG' }]);
      queryIssues.mockResolvedValue([
        {
          id: 'i1',
          identifier: 'ENG-1',
          title: 'Fix bug',
          url: 'https://linear.app/acme/issue/ENG-1',
          state: { name: 'In Progress', type: 'started', color: '#f00' },
          assignee: { id: 'u1', name: 'Alice' },
          priority: 2,
          labels: { nodes: [{ name: 'bug' }] },
        },
      ]);

      const result = await resolverDefs.resolveFilterUrl({
        payload: { url: 'https://linear.app/acme/team/ENG/active' },
        context,
      });

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].identifier).toBe('ENG-1');
      expect(result.issues[0].labels).toEqual([{ name: 'bug' }]);
      expect(queryIssues).toHaveBeenCalledWith(
        'site-1',
        expect.objectContaining({
          teamId: 't1',
          stateTypes: ['started', 'unstarted'],
        })
      );
    });

    test('returns error on non-linear URL', async () => {
      const result = await resolverDefs.resolveFilterUrl({
        payload: { url: 'https://example.com/foo' },
        context,
      });
      expect(result.error).toMatch(/linear\.app/i);
      expect(result.issues).toEqual([]);
    });

    test('returns error on unknown team key', async () => {
      kvsGetWithTTL.mockResolvedValue([{ id: 't1', name: 'Eng', key: 'ENG' }]);
      const result = await resolverDefs.resolveFilterUrl({
        payload: { url: 'https://linear.app/acme/team/XYZ/active' },
        context,
      });
      expect(result.error).toMatch(/XYZ/);
      expect(result.issues).toEqual([]);
    });

    test('returns error on malformed URL', async () => {
      const result = await resolverDefs.resolveFilterUrl({
        payload: { url: 'not-a-url' },
        context,
      });
      expect(result.error).toBeTruthy();
      expect(result.issues).toEqual([]);
    });

    test('maps backlog category to backlog state', async () => {
      kvsGetWithTTL.mockResolvedValue([{ id: 't1', key: 'ENG' }]);
      queryIssues.mockResolvedValue([]);

      await resolverDefs.resolveFilterUrl({
        payload: { url: 'https://linear.app/acme/team/ENG/backlog' },
        context,
      });

      expect(queryIssues).toHaveBeenCalledWith(
        'site-1',
        expect.objectContaining({ stateTypes: ['backlog'] })
      );
    });
  });

  describe('getFilterResults', () => {
    test('uses config.url when provided', async () => {
      kvsGetWithTTL.mockResolvedValue([{ id: 't1', key: 'ENG' }]);
      queryIssues.mockResolvedValue([{ id: 'i1', identifier: 'ENG-1', labels: { nodes: [] } }]);

      const result = await resolverDefs.getFilterResults({
        payload: { config: { url: 'https://linear.app/acme/team/ENG/active' } },
        context,
      });

      expect(result.issues).toHaveLength(1);
    });

    test('falls back to teamId config (legacy)', async () => {
      queryIssues.mockResolvedValue([{ id: 'i2', identifier: 'ENG-2', labels: { nodes: [] } }]);

      const result = await resolverDefs.getFilterResults({
        payload: { config: { teamId: 't1', stateTypes: ['started'] } },
        context,
      });

      expect(result.issues).toHaveLength(1);
      expect(queryIssues).toHaveBeenCalledWith(
        'site-1',
        expect.objectContaining({ teamId: 't1' })
      );
    });

    test('returns error when config has neither url nor teamId', async () => {
      const result = await resolverDefs.getFilterResults({
        payload: { config: {} },
        context,
      });
      expect(result.error).toMatch(/not configured/i);
      expect(result.issues).toEqual([]);
    });
  });
});
