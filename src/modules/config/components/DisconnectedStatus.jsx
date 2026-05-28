import React from 'react';
import { Stack, Button, SectionMessage, Text } from '@forge/react';
import { OAuthFlow } from './OAuthFlow';

export const DisconnectedStatus = ({
  authUrl,
  redirectUri,
  connecting,
  onConnect,
  onRefresh,
}) => (
  <Stack space="space.150">
    <SectionMessage appearance="information" title="Not connected">
      <Text>
        No Linear workspace is linked yet. Follow the steps below to connect.
      </Text>
    </SectionMessage>

    {!authUrl ? (
      <Button
        appearance="primary"
        onClick={onConnect}
        isDisabled={connecting}
      >
        {connecting ? 'Preparing...' : 'Connect Linear Workspace'}
      </Button>
    ) : (
      <OAuthFlow
        authUrl={authUrl}
        redirectUri={redirectUri}
        onRefresh={onRefresh}
      />
    )}
  </Stack>
);
