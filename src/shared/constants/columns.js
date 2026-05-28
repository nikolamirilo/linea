const ALL_COLUMNS = [
  { key: 'identifier', label: 'ID', default: true },
  { key: 'title', label: 'Summary', default: true },
  { key: 'state', label: 'Status', default: true },
  { key: 'labels', label: 'Labels', default: true },
  { key: 'assignee', label: 'Assignee', default: false },
  { key: 'priority', label: 'Priority', default: false },
  { key: 'updatedAt', label: 'Updated', default: false },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.filter((c) => c.default).map((c) => c.key);

module.exports = { ALL_COLUMNS, DEFAULT_COLUMNS };
