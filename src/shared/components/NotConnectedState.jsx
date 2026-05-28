import React from 'react';
import { Stack, SectionMessage, Text } from '@forge/react';

/**
 * Shown when a macro/view is rendered but the Linear workspace is not yet
 * connected (or the OAuth tokens were revoked / expired beyond refresh).
 *
 * Renders an actionable message pointing the user to the Linear Configuration
 * global page to (re)connect.
 */
export const NotConnectedState = ({ reason = 'not_connected' }) => {
  const isExpired = reason === 'expired';
  return (
    <Stack space="space.100">
      <SectionMessage
        appearance={isExpired ? 'warning' : 'information'}
        title={isExpired ? 'Linear connection expired' : 'Linear not connected'}
      >
        <Stack space="space.050">
          <Text>
            {isExpired
              ? 'Your Linear workspace authorization has expired or been revoked.'
              : 'Connect your Linear workspace to use this Linea feature.'}
          </Text>
          <Text>
            Go to <strong>Apps → Linear Configuration</strong> in Confluence and
            click <strong>Connect Linear Workspace</strong>.
          </Text>
        </Stack>
      </SectionMessage>
    </Stack>
  );
};

export function isNotConnectedError(message) {
  if (!message) return false;
  return /not connected|not authoriz|invalid_grant|token (expired|revoked)/i.test(
    String(message)
  );
}

export function isUpstreamError(message) {
  if (!message) return false;
  return /Linear API error: 5\d\d|timeout|aborted|network/i.test(String(message));
}
