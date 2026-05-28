import React from 'react';
import { Stack, Inline, Heading, Icon } from '@forge/react';
import { LinearIssueInline } from '../../../shared/components/LinearIssueInline';

export const SuccessMessage = ({ issue }) => {
  if (!issue) return null;
  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center" alignInline="center">
        <Heading as="h3">Issue created in Linear</Heading>
        <Icon
          glyph="check-circle"
          label="Success"
          size="medium"
          primaryColor="color.icon.success"
        />
      </Inline>
      <LinearIssueInline issue={issue} size="large" />
    </Stack>
  );
};
