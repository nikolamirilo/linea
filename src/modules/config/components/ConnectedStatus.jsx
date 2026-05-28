import React from 'react';
import { Stack, Inline, Text, Button, SectionMessage, Link } from '@forge/react';

export const ConnectedStatus = ({ workspace, onDisconnect, onRefresh }) => (
  <Stack space="space.100">
    <SectionMessage appearance="success" title="Connected">
      {workspace ? (
        <Text>
          Linked to Linear workspace:{' '}
          <Text as="strong">{workspace.name || '(unknown)'}</Text>
        </Text>
      ) : (
        <Text>A Linear workspace is connected.</Text>
      )}
    </SectionMessage>
    {workspace && (
      <Text>
        Organization: {workspace.name} ({workspace.urlKey})
      </Text>
    )}
    <Inline space="space.100">
      <Button appearance="danger" onClick={onDisconnect}>
        Disconnect Linear Workspace
      </Button>
      <Button appearance="subtle" onClick={onRefresh}>
        Refresh Status
      </Button>
    </Inline>
  </Stack>
);
