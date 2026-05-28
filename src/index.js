// Linea - Linear All-in-One for Confluence
// Consolidated entry point: re-exports all function handlers referenced in manifest.yml.

const textToIssueResolver = require('./modules/textToIssue/resolver').handler;
const filterMacroResolver = require('./modules/filterMacro/resolver').handler;
const linkUnfurlResolver = require('./modules/linkUnfurl/resolver').handler;
const linearSmartLinkFn = require('./modules/linkUnfurl/resolver').smartLinkHandler;
const linearLinkResolver = require('./modules/linearLink/resolver').handler;
const configResolver = require('./modules/config/resolver').handler;
const oauthCallbackFn = require('./webtriggers/oauthCallback').handler;
const linearWebhookFn = require('./webtriggers/linearWebhook').handler;
const rovoCreateIssueFn = require('./modules/rovoAgent/resolver').handler;
const appUninstallFn = require('./lifecycle/uninstall').handler;

module.exports = {
  textToIssueResolver,
  filterMacroResolver,
  linkUnfurlResolver,
  linearSmartLinkFn,
  linearLinkResolver,
  configResolver,
  oauthCallbackFn,
  linearWebhookFn,
  rovoCreateIssueFn,
  appUninstallFn,
};
