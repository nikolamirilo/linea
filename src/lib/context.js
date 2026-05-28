// Storage-key segment validator. Forge storage keys must be safe identifiers -
// reject any caller-supplied value that isn't alphanumeric/dash/underscore so
// a hostile UI cannot craft a key that collides with `linear_tokens:*` or any
// other namespace.
const SAFE_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

function safeKeySegment(value, fallback) {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  if (!SAFE_KEY_RE.test(value)) return fallback;
  return value;
}

function getSiteId(context) {
  const raw = context?.cloudId || context?.siteId || context?.localId || 'unknown';
  return safeKeySegment(String(raw), 'unknown');
}

function buildMacroKey(siteId, pageId, macroId, context) {
  const rawPage =
    pageId ||
    context?.extension?.content?.id ||
    context?.extensionContext?.content?.id ||
    context?.contentId ||
    'no-page';
  const rawMacro =
    macroId ||
    context?.localId ||
    context?.extension?.localId ||
    context?.extensionContext?.localId ||
    'no-macro';
  const safePage = safeKeySegment(String(rawPage), 'no-page');
  const safeMacro = safeKeySegment(String(rawMacro), 'no-macro');
  return `macro_config:${siteId}:${safePage}:${safeMacro}`;
}

module.exports = { getSiteId, buildMacroKey, safeKeySegment };
