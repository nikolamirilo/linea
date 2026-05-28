import React from 'react';
import { Box, Inline, Text } from '@forge/react';
import { HeaderCell } from './HeaderCell';
const { ALL_COLUMNS } = require('../../../shared/constants/columns');

const actionsCellStyle = {
  width: '80px',
  minWidth: '80px',
};

export const IssueTableHeader = ({ activeColumns, widths }) => (
  <Box xcss={{ width: '100%' }}>
    <Inline space="space.0" alignBlock="center">
      {activeColumns.map((k) => {
        const col = ALL_COLUMNS.find((c) => c.key === k);
        return (
          <HeaderCell key={k} widthPct={widths[k]}>
            {col?.label || k}
          </HeaderCell>
        );
      })}
      {/* Blank header for the Details actions column */}
      <Box padding="space.050" xcss={actionsCellStyle}>
        <Text> </Text>
      </Box>
    </Inline>
  </Box>
);
