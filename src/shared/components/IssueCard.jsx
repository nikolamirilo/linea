import React from 'react';
import { Box, Stack, Inline, Text, Button, Link } from '@forge/react';
import { LinearLogo } from './LinearLogo';
import { LabeledField } from './LabeledField';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatDate, labelsToString } from '../utils/formatters';
const { PRIORITY_LABELS } = require('../constants/priorities');

export const IssueCard = ({ issue, onClose }) => (
  <Box padding="space.150">
    <Stack space="space.100">
      <Inline space="space.100" alignBlock="center">
        <LinearLogo />
        <Text>
          <Text as="strong">{issue.identifier}</Text>
        </Text>
        {onClose && (
          <Button appearance="subtle" onClick={onClose}>
            Close
          </Button>
        )}
      </Inline>

      <LabeledField label="Summary">{issue.title || '-'}</LabeledField>

      <Text>
        <Text as="strong">Description:</Text>
      </Text>
      <Box padding="space.100">
        <MarkdownRenderer text={issue.description} />
      </Box>

      <LabeledField label="Status">{issue.state?.name || '-'}</LabeledField>
      <LabeledField label="Assignee">{issue.assignee?.name || 'Unassigned'}</LabeledField>
      <LabeledField label="Labels">{labelsToString(issue)}</LabeledField>
      <LabeledField label="Priority">{PRIORITY_LABELS[issue.priority] ?? '-'}</LabeledField>
      <LabeledField label="Due date">
        {issue.dueDate ? formatDate(issue.dueDate) : 'No due date'}
      </LabeledField>
      <LabeledField label="Updated">{formatDate(issue.updatedAt)}</LabeledField>
      <LabeledField label="URL">
        <Link href={issue.url} openNewTab>
          {issue.url}
        </Link>
      </LabeledField>
    </Stack>
  </Box>
);
