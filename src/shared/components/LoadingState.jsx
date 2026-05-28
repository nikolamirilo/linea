import React from 'react';
import { Text, Box, Stack, Spinner } from '@forge/react';

export const LoadingState = ({ message, showSpinner = false }) => (
  <Box padding="space.200">
    <Stack space="space.200" alignInline={showSpinner ? 'center' : undefined}>
      {showSpinner && <Spinner size="large" />}
      <Text>{message}</Text>
    </Stack>
  </Box>
);
