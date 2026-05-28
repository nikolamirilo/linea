import React from 'react';
import { Inline, Text, Button, Spinner } from '@forge/react';
import { LinearLogo } from '../../../shared/components/LinearLogo';

export const FilterToolbar = ({
  issueCount,
  showColumns,
  onToggleColumns,
  onRefresh,
  onChangeFilter,
  loadingIssues,
}) => (
  <Inline spread="space-between" alignBlock="center">
    <Inline space="space.100" alignBlock="center">
      <LinearLogo />
      <Text>
        <Text as="strong">Linear issues</Text> ({issueCount})
      </Text>
      {loadingIssues && <Spinner size="small" />}
    </Inline>
    <Inline space="space.050">
      <Button appearance="subtle" onClick={onToggleColumns}>
        {showColumns ? 'Hide columns' : 'Columns'}
      </Button>
      <Button
        appearance="subtle"
        onClick={onRefresh}
        isDisabled={loadingIssues}
      >
        {loadingIssues ? 'Refreshing…' : 'Refresh'}
      </Button>
      <Button appearance="subtle" onClick={onChangeFilter}>
        Change filter
      </Button>
    </Inline>
  </Inline>
);
