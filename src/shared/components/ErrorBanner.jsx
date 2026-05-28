import React from 'react';
import { Text, SectionMessage } from '@forge/react';

export const ErrorBanner = ({ error, appearance = 'section' }) => {
  if (!error) return null;
  if (appearance === 'inline') {
    return <Text>Error: {error}</Text>;
  }
  return (
    <SectionMessage appearance="error" title="Error">
      <Text>{error}</Text>
    </SectionMessage>
  );
};
