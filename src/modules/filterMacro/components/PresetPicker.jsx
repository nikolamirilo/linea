import React from 'react';
import { Box, Stack, Text, Button } from '@forge/react';
import { ErrorBanner } from '../../../shared/components/ErrorBanner';
const { PRESET_URLS } = require('../../../shared/constants/presets');

export const PresetPicker = ({ presets = PRESET_URLS, error, savingUrl, onPick }) => (
  <Box padding="space.200">
    <Stack space="space.150">
      <Text>
        <Text as="strong">Linear Filter</Text>
      </Text>
      <ErrorBanner error={error} appearance="inline" />
      <Text>Pick a filter to load issues:</Text>
      <Stack space="space.100">
        {presets.map((p) => (
          <Button
            key={p.url}
            appearance="default"
            onClick={() => onPick(p.url)}
            isDisabled={!!savingUrl}
          >
            {savingUrl === p.url ? 'Loading...' : p.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  </Box>
);
