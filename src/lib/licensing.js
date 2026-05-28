/**
 * Linea licensing - single SKU, full access for paying customers.
 *
 * Pricing model: $2/user/month, free for ≤10 users (Atlassian standard).
 * No feature differentiation between paid plans - every paying customer gets
 * everything. Free tier exists only because Atlassian Marketplace requires it
 * and to enable evaluation; it has soft limits to encourage upgrade.
 *
 * License state comes from Forge (`context.license`) and is set by Atlassian
 * Marketplace based on the customer's subscription. We treat any active license
 * as "paid" (no `tier` distinction).
 */

const FREE_FEATURES = {
  maxAiDraftsPerMonth: 50, // soft limit on Rovo-backed text-to-issue drafts
  filterMacros: 1,         // soft limit on number of saved filter macros
};

const PAID_FEATURES = {
  maxAiDraftsPerMonth: Infinity,
  filterMacros: Infinity,
};

class LicenseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LicenseError';
  }
}

/**
 * Returns the active feature set based on the Forge license context.
 *
 * Forge sets `context.license.active` to `true` when the customer has an
 * active paid or evaluation subscription. We map that to our single paid SKU.
 */
function checkLicense(context) {
  const { license } = context || {};
  if (license && license.active) {
    return { paid: true, features: PAID_FEATURES };
  }
  return { paid: false, features: FREE_FEATURES };
}

/**
 * Throw if the AI-draft soft limit has been reached on the free tier.
 * Paid customers always pass this check.
 */
async function checkAiDraftLimit(context, currentCount) {
  const { features } = checkLicense(context);
  if (currentCount >= features.maxAiDraftsPerMonth) {
    throw new LicenseError(
      `Free tier draft limit reached (${features.maxAiDraftsPerMonth}/month). ` +
        'Upgrade to a paid plan for unlimited AI drafts.'
    );
  }
  return true;
}

module.exports = {
  FREE_FEATURES,
  PAID_FEATURES,
  checkLicense,
  checkAiDraftLimit,
  LicenseError,
};
