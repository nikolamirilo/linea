const { storage } = require('@forge/api');
const { sanitizeForRovo } = require('./security');

/**
 * Generate a Linear issue draft from selected Confluence text.
 *
 * MVP implementation: deterministic heuristic-based draft with per-type templates.
 * Detects the issue "type" (bug, question, improvement, ask, feature, spike, task)
 * from linguistic signals in the selected text and renders a tailored template.
 */

const TYPE_PATTERNS = [
  {
    type: 'question',
    regexes: [
      /\?\s*$/,
      /^\s*(why|how|what|when|where|which|who)\b/i,
      /\b(could|would|can) (we|you|it|i)\b/i,
      /\bis it possible\b/i,
      /\bdoes (anyone|anybody)\b/i,
      /\bhow do (we|i|you)\b/i,
    ],
  },
  {
    type: 'bug',
    regexes: [
      /\bbug\b/i,
      /\b(broken|crashing|crashes|crashed)\b/i,
      /\b(doesn'?t|does not|isn'?t|is not) work(ing)?\b/i,
      /\b(not working|stopped working)\b/i,
      /\b(throws?|raises?) (an )?(error|exception)\b/i,
      /\bregression\b/i,
      /\bfails? (to|when|silently)\b/i,
      /\bunexpected(ly)? (fail|behaviour|behavior|result)\b/i,
    ],
  },
  {
    type: 'improvement',
    regexes: [
      /\bimprove(ment|d)?\b/i,
      /\brefactor(ing)?\b/i,
      /\boptimi[sz]e\b/i,
      /\b(should|could) be (better|faster|clearer|cleaner|simpler)\b/i,
      /\bcleanup\b/i,
      /\btechnical debt\b/i,
      /\bmigrate\b/i,
    ],
  },
  {
    type: 'spike',
    regexes: [
      /\bspike\b/i,
      /\b(investigate|investigation)\b/i,
      /\b(research|explore|exploration)\b/i,
      /\b(proof of concept|poc)\b/i,
      /\b(prototype|feasibility)\b/i,
      /\bestimate\b/i,
      /\bscope out\b/i,
    ],
  },
  {
    type: 'ask',
    regexes: [
      /\bplease\b/i,
      /\b(can|could) you\b/i,
      /\bwe need\b/i,
      /\bwould like\b/i,
      /\brequest(ing|ed)?\b/i,
      /\bsupport\b.*\?/i,
    ],
  },
  {
    type: 'feature',
    regexes: [
      /\b(add|adding) (a |an |the )?(new )?(feature|ability|option|support)\b/i,
      /\b(implement|introduce) (a |an |the )?/i,
      /\bsupport (for|the ability)\b/i,
      /\bfeature request\b/i,
      /\bnew capability\b/i,
    ],
  },
];

function detectIssueType(text) {
  const input = String(text || '');
  if (!input.trim()) return 'task';
  const scores = {};
  for (const { type, regexes } of TYPE_PATTERNS) {
    scores[type] = regexes.reduce((n, re) => n + (re.test(input) ? 1 : 0), 0);
  }
  let best = 'task';
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : 'task';
}

const TEMPLATE_BUILDERS = {
  question: (text) => [
    '## Question',
    '',
    text,
    '',
    '## Context',
    '',
    '_What led to this question? Link any related docs or decisions._',
    '',
    '## Decision needed',
    '',
    '- [ ] ',
  ],
  bug: (text) => [
    '## Summary',
    '',
    text,
    '',
    '## Steps to reproduce',
    '',
    '1. ',
    '2. ',
    '',
    '## Expected behaviour',
    '',
    '_What should happen?_',
    '',
    '## Actual behaviour',
    '',
    '_What is happening instead?_',
    '',
    '## Impact',
    '',
    '_Who is affected and how badly?_',
  ],
  improvement: (text) => [
    '## Current behaviour',
    '',
    '_How does it work today?_',
    '',
    '## Proposed improvement',
    '',
    text,
    '',
    '## Why it matters',
    '',
    '_What does this unlock or make easier?_',
    '',
    '## Acceptance criteria',
    '',
    '- [ ] ',
  ],
  spike: (text) => [
    '## Question to answer',
    '',
    text,
    '',
    '## Scope',
    '',
    '_What is in scope? What is explicitly out of scope?_',
    '',
    '## Timebox',
    '',
    '_How long should we spend before reporting back?_',
    '',
    '## Outcome / artifact',
    '',
    '- [ ] ',
  ],
  ask: (text) => [
    '## Request',
    '',
    text,
    '',
    '## Why',
    '',
    '_What is the business or technical motivation?_',
    '',
    '## Acceptance criteria',
    '',
    '- [ ] ',
  ],
  feature: (text) => [
    '## Summary',
    '',
    text,
    '',
    '## Requirements',
    '',
    '- ',
    '',
    '## Out of scope',
    '',
    '- ',
    '',
    '## Acceptance criteria',
    '',
    '- [ ] ',
  ],
  task: (text) => [
    '## Description',
    '',
    text,
    '',
    '## Acceptance criteria',
    '',
    '- [ ] ',
  ],
};

function buildTemplate(issueType, text, pageTitle, spaceKey) {
  const builder = TEMPLATE_BUILDERS[issueType] || TEMPLATE_BUILDERS.task;
  const body = builder(text);
  return [
    ...body,
    '',
    '---',
    `_Type: ${issueType} · Created from Confluence page: ${pageTitle || 'untitled'} (space: ${spaceKey || 'unknown'})._`,
  ].join('\n');
}

async function draftIssueFromText({ text, pageTitle, pageLabels, spaceKey }) {
  const sanitized = sanitizeForRovo(text || '').trim();
  const sanitizedTitle = sanitizeForRovo(pageTitle || '').trim();

  if (!sanitized) {
    return {
      title: sanitizedTitle || 'New issue',
      description: '',
      priority: 0,
      labels: [],
      suggestedTeam: '',
      issueType: 'task',
    };
  }

  const issueType = detectIssueType(sanitized);

  const firstSentenceMatch = sanitized.match(/^[^.!?\n]{1,200}[.!?]?/);
  let title = firstSentenceMatch
    ? firstSentenceMatch[0].replace(/[.!?]$/, '').trim()
    : sanitized.slice(0, 80).trim();
  if (title.length > 80) title = title.slice(0, 77).trim() + '...';
  if (!title) title = sanitizedTitle || 'New issue';
  if (issueType === 'question' && !title.endsWith('?')) title = `${title}?`;

  const description = buildTemplate(issueType, sanitized, sanitizedTitle, spaceKey);

  let priority = 0;
  const lower = sanitized.toLowerCase();
  if (/\b(critical|urgent|blocker|asap|p0)\b/.test(lower)) priority = 1;
  else if (/\b(important|high|p1)\b/.test(lower)) priority = 2;
  else if (/\b(medium|p2)\b/.test(lower)) priority = 3;
  else if (/\b(minor|low|p3|p4|nice to have)\b/.test(lower)) priority = 4;

  const labels = Array.isArray(pageLabels) ? pageLabels.slice(0, 5) : [];
  const suggestedTeam = labels[0] || spaceKey || '';

  return {
    title,
    description,
    priority,
    labels,
    suggestedTeam,
    issueType,
  };
}

function parseRovoResponse(content) {
  let cleaned = (content || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const parsed = JSON.parse(cleaned);
  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Missing or invalid title');
  }
  if (parsed.title.length > 255) parsed.title = parsed.title.substring(0, 255);
  if (typeof parsed.description !== 'string') parsed.description = '';
  if (parsed.description.length > 50000) parsed.description = parsed.description.substring(0, 50000);
  if (typeof parsed.priority !== 'number' || parsed.priority < 0 || parsed.priority > 4) {
    parsed.priority = 0;
  }
  if (!Array.isArray(parsed.labels)) parsed.labels = [];
  parsed.labels = parsed.labels.filter((l) => typeof l === 'string').slice(0, 5);
  if (typeof parsed.suggestedTeam !== 'string') parsed.suggestedTeam = '';
  return parsed;
}

async function checkAiDraftQuota(siteId) {
  const month = new Date().toISOString().slice(0, 7).replace('-', '');
  const key = `usage:${siteId}:${month}:ai_drafts`;
  try {
    return (await storage.get(key)) || 0;
  } catch {
    return 0;
  }
}

async function incrementAiDraftCount(siteId) {
  const month = new Date().toISOString().slice(0, 7).replace('-', '');
  const key = `usage:${siteId}:${month}:ai_drafts`;
  try {
    const count = (await storage.get(key)) || 0;
    await storage.set(key, count + 1);
    return count + 1;
  } catch {
    return 0;
  }
}

const ISSUE_TYPES = Object.keys(TEMPLATE_BUILDERS);

function renderDescriptionForType({ text, issueType, pageTitle, spaceKey }) {
  const sanitized = sanitizeForRovo(text || '').trim();
  const sanitizedTitle = sanitizeForRovo(pageTitle || '').trim();
  const safeType = ISSUE_TYPES.includes(issueType) ? issueType : 'task';
  if (!sanitized) return '';
  return buildTemplate(safeType, sanitized, sanitizedTitle, spaceKey);
}

module.exports = {
  draftIssueFromText,
  detectIssueType,
  renderDescriptionForType,
  ISSUE_TYPES,
  parseRovoResponse,
  checkAiDraftQuota,
  incrementAiDraftCount,
};
