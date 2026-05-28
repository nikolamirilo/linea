import React from 'react';
import { Box, Inline, Button } from '@forge/react';
import { DataCell } from './DataCell';
import { IdentifierCell } from './IdentifierCell';
import { IssueCard } from '../../../shared/components/IssueCard';
import { formatDate, labelsToString } from '../../../shared/utils/formatters';
const { PRIORITY_LABELS } = require('../../../shared/constants/priorities');

const actionsCellStyle = {
  width: '80px',
  minWidth: '80px',
};

const renderDataCell = (issue, key, widths) => {
  const w = widths[key];
  switch (key) {
    case 'identifier':
      return <IdentifierCell key={key} issue={issue} widthPct={w} />;
    case 'title':
      return <DataCell key={key} widthPct={w}>{issue.title || '-'}</DataCell>;
    case 'state':
      return <DataCell key={key} widthPct={w}>{issue.state?.name || '-'}</DataCell>;
    case 'assignee':
      return <DataCell key={key} widthPct={w}>{issue.assignee?.name || '-'}</DataCell>;
    case 'priority':
      return <DataCell key={key} widthPct={w}>{PRIORITY_LABELS[issue.priority] ?? '-'}</DataCell>;
    case 'labels':
      return <DataCell key={key} widthPct={w}>{labelsToString(issue)}</DataCell>;
    case 'updatedAt':
      return <DataCell key={key} widthPct={w}>{formatDate(issue.updatedAt)}</DataCell>;
    default:
      return <DataCell key={key} widthPct={w}>-</DataCell>;
  }
};

export const IssueTableRow = ({
  issue,
  activeColumns,
  widths,
  isExpanded,
  onToggleExpand,
}) => (
  <Box xcss={{ width: '100%' }}>
    <Inline space="space.0" alignBlock="center">
      {activeColumns.map((k) => renderDataCell(issue, k, widths))}
      <Box padding="space.050" xcss={actionsCellStyle}>
        <Button appearance="subtle" onClick={onToggleExpand}>
          {isExpanded ? 'Hide' : 'Details'}
        </Button>
      </Box>
    </Inline>
    {isExpanded && (
      <IssueCard issue={issue} onClose={onToggleExpand} />
    )}
  </Box>
);
