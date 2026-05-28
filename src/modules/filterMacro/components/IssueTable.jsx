import React from 'react';
import { Stack, Text } from '@forge/react';
import { IssueTableHeader } from './IssueTableHeader';
import { IssueTableRow } from './IssueTableRow';

export const IssueTable = ({
  issues,
  activeColumns,
  widths,
  expandedIssueId,
  onToggleExpand,
}) => {
  if (!issues || issues.length === 0) {
    return <Text>No Linear issues match this filter.</Text>;
  }

  return (
    <Stack space="space.0">
      <IssueTableHeader activeColumns={activeColumns} widths={widths} />
      {issues.map((issue) => {
        const issueKey = issue.id || issue.identifier;
        const isExpanded = expandedIssueId === issueKey;
        return (
          <IssueTableRow
            key={issueKey}
            issue={issue}
            activeColumns={activeColumns}
            widths={widths}
            isExpanded={isExpanded}
            onToggleExpand={() =>
              onToggleExpand(isExpanded ? null : issueKey)
            }
          />
        );
      })}
    </Stack>
  );
};
