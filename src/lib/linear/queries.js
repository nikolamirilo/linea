const { linearQuery } = require('./client');

// --- Query builders ---

async function getIssueByIdentifier(siteId, identifier) {
  const match = String(identifier || '').match(/^([A-Z][A-Z0-9]*)-(\d+)$/);
  if (!match) return null;
  const teamKey = match[1];
  const number = parseInt(match[2], 10);

  const data = await linearQuery(
    siteId,
    `query GetIssueByIdentifier($filter: IssueFilter!) {
      issues(filter: $filter, first: 1) {
        nodes {
          id identifier title priority url updatedAt description
          state { name type color }
          assignee { id name avatarUrl }
          labels(first: 10) { nodes { id name color } }
          team { id name }
          project { id name }
        }
      }
    }`,
    {
      filter: {
        team: { key: { eq: teamKey } },
        number: { eq: number },
      },
    }
  );

  return data.issues.nodes[0] || null;
}

async function queryIssues(
  siteId,
  { teamId, stateTypes, labelIds, limit = 25 }
) {
  const filter = {};

  if (teamId) {
    filter.team = { id: { eq: teamId } };
  }
  if (stateTypes && stateTypes.length > 0) {
    filter.state = { type: { in: stateTypes } };
  }
  if (labelIds && labelIds.length > 0) {
    filter.labels = { id: { in: labelIds } };
  }

  const data = await linearQuery(
    siteId,
    `query FilterIssues($filter: IssueFilter!, $limit: Int!) {
      issues(first: $limit, filter: $filter, orderBy: updatedAt) {
        nodes {
          id identifier title description priority url updatedAt dueDate
          state { name type color }
          assignee { id name avatarUrl }
          labels(first: 10) { nodes { id name color } }
          team { id name }
          estimate
        }
      }
    }`,
    { filter, limit }
  );

  return data.issues.nodes;
}

async function createIssue(
  siteId,
  { title, description, teamId, priority, labelIds, assigneeId, projectId }
) {
  const input = { title, description, teamId };
  if (priority !== undefined && priority !== null) input.priority = priority;
  if (labelIds && labelIds.length > 0) input.labelIds = labelIds;
  if (assigneeId) input.assigneeId = assigneeId;
  if (projectId) input.projectId = projectId;

  const data = await linearQuery(
    siteId,
    `mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id identifier title url description priority updatedAt dueDate
          state { name type color }
          assignee { id name avatarUrl }
          labels(first: 10) { nodes { id name color } }
          team { id name }
        }
      }
    }`,
    { input }
  );

  if (!data.issueCreate.success) {
    throw new Error('Failed to create Linear issue');
  }

  return data.issueCreate.issue;
}

async function listTeams(siteId) {
  const data = await linearQuery(
    siteId,
    `query ListTeams {
      teams(first: 50) {
        nodes { id name key }
      }
    }`
  );
  return data.teams.nodes;
}

async function listLabels(siteId) {
  const data = await linearQuery(
    siteId,
    `query ListLabels {
      issueLabels(first: 100) {
        nodes { id name color }
      }
    }`
  );
  return data.issueLabels.nodes;
}

async function listProjectsForTeam(siteId, teamId) {
  const data = await linearQuery(
    siteId,
    `query ListProjectsForTeam($teamId: String!) {
      team(id: $teamId) {
        projects(first: 100) {
          nodes { id name state }
        }
      }
    }`,
    { teamId }
  );
  return data.team?.projects?.nodes || [];
}

async function listStates(siteId) {
  const data = await linearQuery(
    siteId,
    `query ListStates {
      workflowStates(first: 100) {
        nodes { id name type color }
      }
    }`
  );
  return data.workflowStates.nodes;
}

async function getWorkspaceInfo(siteId) {
  const data = await linearQuery(
    siteId,
    `query WorkspaceInfo {
      organization { id name urlKey }
    }`
  );
  return data.organization;
}

async function registerWebhook(siteId, callbackUrl, secret) {
  const data = await linearQuery(
    siteId,
    `mutation CreateWebhook($input: WebhookCreateInput!) {
      webhookCreate(input: $input) {
        success
        webhook { id enabled }
      }
    }`,
    {
      input: {
        url: callbackUrl,
        resourceTypes: ['Issue'],
        secret,
        allPublicTeams: true,
      },
    }
  );
  return data.webhookCreate;
}

module.exports = {
  getIssueByIdentifier,
  queryIssues,
  createIssue,
  listTeams,
  listLabels,
  listProjectsForTeam,
  listStates,
  getWorkspaceInfo,
  registerWebhook,
};
