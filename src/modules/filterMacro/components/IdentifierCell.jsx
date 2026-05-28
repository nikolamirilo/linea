import React from 'react';
import { Box, Link, Text } from '@forge/react';

const cellWidthStyle = (widthPct) => ({
  width: widthPct,
  minWidth: 0,
});

export const IdentifierCell = ({ issue, widthPct }) => (
  <Box padding="space.050" xcss={cellWidthStyle(widthPct)}>
    <Link href={issue.url} openNewTab>
      <Text as="strong">{issue.identifier}</Text>
    </Link>
  </Box>
);
