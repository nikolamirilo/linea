const { disconnectWorkspace } = require('../lib/oauth');

/**
 * Forge app uninstall event handler.
 *
 * Fires when the customer removes Linea from their Confluence site. We use
 * this to clear all per-site state Linea has stored — Linear OAuth tokens,
 * cached teams/labels/issues, macro configurations, and AI usage counters.
 *
 * This is the GDPR "right to erasure" path: when the customer removes the
 * app, all data tied to their site is wiped from Forge storage.
 *
 * The event payload includes `cloudId` (the Confluence site identifier).
 * `disconnectWorkspace` accepts a siteId and clears all known prefixes.
 */
exports.handler = async (event = {}) => {
  const cloudId =
    event?.cloudId ||
    event?.context?.cloudId ||
    event?.installContext ||
    null;

  if (!cloudId) {
    // We have no site identifier — nothing actionable. Return success so the
    // event is not retried indefinitely.
    return { success: true, cleared: false, reason: 'missing cloudId' };
  }

  try {
    await disconnectWorkspace(cloudId);
    return { success: true, cleared: true, cloudId };
  } catch (err) {
    // Log only the message — the event payload may contain identifiers we do
    // not want in operator-visible logs at full fidelity.
    console.error('Uninstall cleanup error:', err?.message || 'unknown');
    // Return success so Forge doesn't retry indefinitely; manual cleanup is
    // possible via support if needed.
    return { success: true, cleared: false, error: 'cleanup_failed' };
  }
};
