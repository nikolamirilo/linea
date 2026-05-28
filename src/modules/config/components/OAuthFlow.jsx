import React from 'react';
import { Stack, Text, Link, Button, SectionMessage } from '@forge/react';

export const OAuthFlow = ({ authUrl, redirectUri, onRefresh }) => (
  <Stack space="space.100">
    <SectionMessage appearance="information" title="Open the authorization link">
      <Stack space="space.050">
        <Text>
          Click the link below to grant Linea access to your Linear workspace. A
          new tab will open.
        </Text>
        <Link href={authUrl} openNewTab>
          Open Linear authorization page
        </Link>
        <Text>
          After you approve, this page will not auto-refresh. Click{' '}
          <Text as="strong">Refresh Status</Text> once the callback tab shows
          "Successfully connected".
        </Text>
      </Stack>
    </SectionMessage>
    {redirectUri && (
      <SectionMessage
        appearance="information"
        title="Callback URL reference (for setup)"
      >
        <Stack space="space.050">
          <Text>
            Your Linear OAuth app should already have this URL registered as an
            allowed callback URL:
          </Text>
          <Text>{redirectUri}</Text>
          <Text>
            Only revisit linear.app/settings/api/applications if Linear shows an
            "Invalid redirect URI" error when you click Authorize.
          </Text>
        </Stack>
      </SectionMessage>
    )}
    <Button appearance="subtle" onClick={onRefresh}>
      I've finished authorizing - Refresh Status
    </Button>
  </Stack>
);
