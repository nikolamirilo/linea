jest.mock('../../src/lib/linear/queries', () => ({
  createIssue: jest.fn(),
  listTeams: jest.fn(),
}));
jest.mock('../../src/lib/cache/kvsCache', () => ({
  kvsGetWithTTL: jest.fn(),
  kvsSet: jest.fn(),
}));

const { createIssue, listTeams } = require('../../src/lib/linear/queries');
const { kvsGetWithTTL, kvsSet } = require('../../src/lib/cache/kvsCache');

const {
  handler: rovoCreateIssueHandler,
  mapPriority,
  resolveTeamId,
} = require('../../src/modules/rovoAgent/resolver');

describe('Rovo action: mapPriority', () => {
  test.each([
    ['urgent', 1],
    ['high', 2],
    ['normal', 3],
    ['medium', 3],
    ['low', 4],
    ['none', 0],
    ['no priority', 0],
    ['UNKNOWN', 0],
    [undefined, 0],
    [null, 0],
    ['', 0],
    [2, 2],
    [7, 0],
  ])('maps %p to %p', (input, expected) => {
    expect(mapPriority(input)).toBe(expected);
  });
});

describe('Rovo action: resolveTeamId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns team matching teamKey exactly', async () => {
    kvsGetWithTTL.mockResolvedValue([
      { id: 't1', name: 'Engineering', key: 'ENG' },
      { id: 't2', name: 'Reactify', key: 'REA' },
    ]);

    const result = await resolveTeamId('site-1', 'REA');
    expect(result.teamId).toBe('t2');
    expect(listTeams).not.toHaveBeenCalled();
  });

  test('falls back to first team when teamKey not found', async () => {
    kvsGetWithTTL.mockResolvedValue([
      { id: 't1', name: 'Engineering', key: 'ENG' },
    ]);

    const result = await resolveTeamId('site-1', 'NOPE');
    expect(result.teamId).toBe('t1');
  });

  test('fetches and caches teams on miss', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    listTeams.mockResolvedValue([{ id: 't1', name: 'Eng', key: 'ENG' }]);

    const result = await resolveTeamId('site-1', 'ENG');
    expect(listTeams).toHaveBeenCalledWith('site-1');
    expect(kvsSet).toHaveBeenCalledWith(
      'teams:site-1',
      [{ id: 't1', name: 'Eng', key: 'ENG' }],
      1800
    );
    expect(result.teamId).toBe('t1');
  });

  test('throws when no teams available', async () => {
    kvsGetWithTTL.mockResolvedValue([]);
    await expect(resolveTeamId('site-1', 'ENG')).rejects.toThrow(
      /No Linear teams are accessible/
    );
  });
});

describe('Rovo action: rovoCreateIssueHandler', () => {
  const context = { cloudId: 'site-1', siteId: 'site-1' };

  beforeEach(() => jest.clearAllMocks());

  test('creates an issue with mapped priority and matched team', async () => {
    kvsGetWithTTL.mockResolvedValue([
      { id: 't-eng', name: 'Engineering', key: 'ENG' },
    ]);
    createIssue.mockResolvedValue({
      identifier: 'ENG-42',
      title: 'Fix the login flow',
      url: 'https://linear.app/acme/issue/ENG-42',
    });

    const result = await rovoCreateIssueHandler(
      {
        title: 'Fix the login flow',
        description: 'Users report the login button is unresponsive.',
        priority: 'high',
        teamKey: 'ENG',
      },
      context
    );

    expect(createIssue).toHaveBeenCalledWith('site-1', {
      title: 'Fix the login flow',
      description: 'Users report the login button is unresponsive.',
      teamId: 't-eng',
      priority: 2,
    });
    expect(result.success).toBe(true);
    expect(result.issue.identifier).toBe('ENG-42');
    expect(result.message).toContain('ENG-42');
  });

  test('uses first team when teamKey omitted', async () => {
    kvsGetWithTTL.mockResolvedValue([
      { id: 't-first', name: 'First', key: 'FIR' },
      { id: 't-second', name: 'Second', key: 'SEC' },
    ]);
    createIssue.mockResolvedValue({
      identifier: 'FIR-1',
      title: 'Task',
      url: 'https://linear.app/acme/issue/FIR-1',
    });

    const result = await rovoCreateIssueHandler({ title: 'Task' }, context);

    expect(createIssue).toHaveBeenCalledWith(
      'site-1',
      expect.objectContaining({ teamId: 't-first', priority: 0 })
    );
    expect(result.success).toBe(true);
  });

  test('rejects missing title', async () => {
    const result = await rovoCreateIssueHandler({}, context);
    expect(result.error).toMatch(/Title is required/);
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('rejects title over 255 chars', async () => {
    const result = await rovoCreateIssueHandler(
      { title: 'x'.repeat(300) },
      context
    );
    expect(result.error).toMatch(/255-character limit/);
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('rejects description over 50,000 chars', async () => {
    const result = await rovoCreateIssueHandler(
      { title: 'ok', description: 'x'.repeat(60000) },
      context
    );
    expect(result.error).toMatch(/50,000-character limit/);
    expect(createIssue).not.toHaveBeenCalled();
  });

  test('returns error when Linear workspace not connected', async () => {
    kvsGetWithTTL.mockResolvedValue(null);
    listTeams.mockRejectedValue(
      new Error('Linear workspace not connected. Please configure.')
    );

    const result = await rovoCreateIssueHandler(
      { title: 'Task', teamKey: 'ENG' },
      context
    );

    expect(result.error).toMatch(/not connected/i);
  });
});
