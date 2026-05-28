import React from 'react';
import { Box, Text } from '@forge/react';

const cellWidthStyle = (widthPct) => ({
  width: widthPct,
  minWidth: 0,
});

export const HeaderCell = ({ children, widthPct }) => (
  <Box padding="space.050" xcss={cellWidthStyle(widthPct)}>
    <Text>
      <Text as="strong">{children}</Text>
    </Text>
  </Box>
);
