class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

// Patterns that, if matched in an error message, indicate the message may
// contain a secret/token/credential and must NOT be returned to the UI.
const SECRET_PATTERNS = [
  /\blin_(api|oauth)_[A-Za-z0-9_-]+/,         // Linear API/OAuth tokens
  /\bBearer\s+[A-Za-z0-9._-]+/i,              // Bearer header values
  /\bey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWTs
  /\bclient_secret\s*[:=]\s*\S+/i,            // OAuth client secret
  /\b(?:password|passwd|pwd|secret|token|apikey|api_key)\s*[:=]\s*\S+/i,
];

function looksLikeSecret(s) {
  if (!s || typeof s !== 'string') return false;
  return SECRET_PATTERNS.some((re) => re.test(s));
}

/**
 * Convert any thrown error into a safe message for the UI.
 *
 * Rules:
 *   - ValidationError → expose the message (these are user-facing)
 *   - AuthError       → expose the message (login/connect prompts)
 *   - "not connected" → expose (the UI checks for it to show the connect button)
 *   - secrets present → generic message
 *   - everything else → generic message
 */
function sanitizeUserError(err) {
  const message = err?.message || String(err || '');
  if (err instanceof ValidationError) return message;
  if (err instanceof AuthError) return message;
  if (/not connected/i.test(message)) return message;
  if (looksLikeSecret(message)) {
    return 'An unexpected error occurred. Please try again or contact support.';
  }
  // Strip any potential token-like substrings as a final defense.
  if (message.length > 300) {
    return 'An unexpected error occurred. Please try again or contact support.';
  }
  return message;
}

function validateInput(value, { maxLength, required, pattern } = {}) {
  if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    throw new ValidationError('Value is required');
  }
  if (value && maxLength && value.length > maxLength) {
    throw new ValidationError(`Value exceeds max length of ${maxLength}`);
  }
  if (value && pattern && !pattern.test(value)) {
    throw new ValidationError('Value does not match required format');
  }
  return value;
}

function sanitizeForRovo(text) {
  if (!text) return '';
  return text
    .replace(/ignore (all )?(previous|above|prior) (instructions|prompts)/gi, '[filtered]')
    .replace(/system:|assistant:|user:/gi, '[filtered]')
    .replace(/<\/?script[^>]*>/gi, '[filtered]')
    .replace(/javascript:/gi, '[filtered]');
}

function validateLinearIdentifier(identifier) {
  if (!identifier || !/^[A-Z][A-Z0-9]+-\d+$/.test(identifier)) {
    throw new ValidationError('Invalid Linear issue identifier');
  }
  return identifier;
}

function validateTeamId(teamId) {
  if (!teamId || typeof teamId !== 'string' || teamId.length > 50) {
    throw new ValidationError('Invalid team ID');
  }
  return teamId;
}

const MAX_URL_LENGTH = 2048;

function validateUrl(url, { required = false } = {}) {
  if (url == null || url === '') {
    if (required) throw new ValidationError('URL is required');
    return '';
  }
  if (typeof url !== 'string') {
    throw new ValidationError('URL must be a string');
  }
  if (url.length > MAX_URL_LENGTH) {
    throw new ValidationError(`URL exceeds maximum length of ${MAX_URL_LENGTH}`);
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new ValidationError('URL must start with http:// or https://');
  }
  return url;
}

const VALID_PRIORITIES = new Set([0, 1, 2, 3, 4]);

function validatePriority(priority) {
  if (priority == null || priority === '') return 0;
  const n = typeof priority === 'string' ? parseInt(priority, 10) : priority;
  if (!VALID_PRIORITIES.has(n)) {
    throw new ValidationError('Priority must be 0, 1, 2, 3, or 4');
  }
  return n;
}

const VALID_ISSUE_TYPES = new Set([
  'bug', 'feature', 'improvement', 'question', 'ask', 'spike', 'task',
]);

function validateIssueType(type) {
  if (!type) return 'task';
  if (typeof type !== 'string' || !VALID_ISSUE_TYPES.has(type)) {
    throw new ValidationError(
      `Invalid issue type. Must be one of: ${[...VALID_ISSUE_TYPES].join(', ')}`
    );
  }
  return type;
}

module.exports = {
  ValidationError,
  AuthError,
  validateInput,
  sanitizeForRovo,
  sanitizeUserError,
  looksLikeSecret,
  validateLinearIdentifier,
  validateTeamId,
  validateUrl,
  validatePriority,
  validateIssueType,
  MAX_URL_LENGTH,
};
