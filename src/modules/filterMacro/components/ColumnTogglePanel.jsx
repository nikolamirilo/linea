import React from 'react';
import { Box, Stack, Inline, Text, Button } from '@forge/react';

export const ColumnTogglePanel = ({
  allColumns,
  activeColumns,
  savingColumns,
  onToggle,
}) => (
  <Box padding="space.100">
    <Stack space="space.050">
      <Text>Toggle columns:</Text>
      <Inline space="space.050" shouldWrap>
        {allColumns.map((c) => {
          const on = activeColumns.includes(c.key);
          return (
            <Button
              key={c.key}
              appearance={on ? 'primary' : 'default'}
              onClick={() => onToggle(c.key)}
              isDisabled={savingColumns}
            >
              {on ? '✓ ' : '+ '}
              {c.label}
            </Button>
          );
        })}
      </Inline>
    </Stack>
  </Box>
);
