import React from 'react';
import { Box, Text } from '@forge/react';

const cellWidthStyle = (widthPct) => ({
  width: widthPct,
  minWidth: 0,
});

export const DataCell = ({ children, widthPct }) => (
  <Box padding="space.050" xcss={cellWidthStyle(widthPct)}>
    <Text>{children}</Text>
  </Box>
);
