// Backward-compatibility facade: re-exports from split modules.
// New code should import from lib/linear/client, lib/linear/queries, or lib/linear/urlParser directly.

const { getAccessToken, linearQuery } = require('./linear/client');
const {
  getIssueByIdentifier,
  queryIssues,
  createIssue,
  listTeams,
  listLabels,
  listStates,
  getWorkspaceInfo,
  registerWebhook,
} = require('./linear/queries');

module.exports = {
  getAccessToken,
  linearQuery,
  getIssueByIdentifier,
  queryIssues,
  createIssue,
  listTeams,
  listLabels,
  listStates,
  getWorkspaceInfo,
  registerWebhook,
};
