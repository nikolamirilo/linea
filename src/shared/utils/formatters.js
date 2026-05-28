const { PRIORITY_LABELS } = require('../constants/priorities');
const { ALL_COLUMNS } = require('../constants/columns');

function formatDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function labelsToString(issue) {
  const arr = (
    issue.labels?.map?.((l) => l.name) ||
    issue.labels?.nodes?.map?.((l) => l.name) ||
    []
  ).filter(Boolean);
  return arr.length ? arr.join(', ') : '-';
}

function getCellText(issue, key) {
  switch (key) {
    case 'identifier':
      return issue.identifier || '-';
    case 'title':
      return issue.title || '-';
    case 'state':
      return issue.state?.name || '-';
    case 'assignee':
      return issue.assignee?.name || '-';
    case 'priority':
      return PRIORITY_LABELS[issue.priority] ?? '-';
    case 'labels':
      return labelsToString(issue);
    case 'updatedAt':
      return formatDate(issue.updatedAt);
    default:
      return '-';
  }
}

module.exports = { formatDate, labelsToString, getCellText };
