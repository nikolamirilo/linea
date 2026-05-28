import React from 'react';
import { Box, Stack, Inline } from '@forge/react';
import { IssueTableHeader } from './IssueTableHeader';

const SKELETON = '#DFE1E6';
const SKELETON_ALT = '#EBECF0';
const ZEBRA = '#FAFBFC';

const ROW_PATTERNS = {
  identifier: ['48%', '60%', '44%', '55%', '58%', '50%'],
  title: ['92%', '78%', '86%', '95%', '72%', '88%'],
  state: ['56px', '72px', '50px', '64px', '60px', '68px'],
  assignee: ['70%', '55%', '78%', '62%', '75%', '58%'],
  priority: ['45%', '58%', '38%', '50%', '52%', '40%'],
  labels: [3, 2, 3, 2, 4, 1],
  updatedAt: ['60%', '52%', '68%', '48%', '72%', '55%'],
};

const LABEL_PILL_WIDTHS = ['36px', '48px', '28px', '40px'];

const pick = (column, i) => {
  const arr = ROW_PATTERNS[column] || ['80%', '70%', '90%', '60%', '75%', '85%'];
  return arr[i % arr.length];
};

const actionsCellStyle = {
  width: '80px',
  minWidth: '80px',
};

const bar = (width, height = '10px', color = SKELETON) => ({
  width,
  height,
  borderRadius: '4px',
  backgroundColor: color,
});

const chip = (width, height = '18px', color = SKELETON) => ({
  width,
  height,
  borderRadius: '9999px',
  backgroundColor: color,
});

const circle = (size = '22px', color = SKELETON) => ({
  width: size,
  height: size,
  borderRadius: '9999px',
  backgroundColor: color,
  flexShrink: 0,
});

const SkeletonShape = ({ column, rowIndex }) => {
  const w = pick(column, rowIndex);
  switch (column) {
    case 'identifier':
      return <Box xcss={bar(w, '11px')} />;
    case 'state':
      return <Box xcss={chip(w, '18px')} />;
    case 'assignee':
      return (
        <Inline space="space.075" alignBlock="center">
          <Box xcss={circle('22px')} />
          <Box xcss={bar(w, '10px')} />
        </Inline>
      );
    case 'labels': {
      const count = pick('labels', rowIndex);
      return (
        <Inline space="space.050" alignBlock="center">
          {Array.from({ length: count }).map((_, i) => (
            <Box
              key={i}
              xcss={chip(
                LABEL_PILL_WIDTHS[(rowIndex + i) % LABEL_PILL_WIDTHS.length],
                '14px',
                i % 2 === 0 ? SKELETON : SKELETON_ALT
              )}
            />
          ))}
        </Inline>
      );
    }
    case 'priority':
      return <Box xcss={bar(w, '10px')} />;
    case 'updatedAt':
      return <Box xcss={bar(w, '10px', SKELETON_ALT)} />;
    case 'title':
    default:
      return <Box xcss={bar(w, '12px')} />;
  }
};

const SkeletonCell = ({ column, widthPct, rowIndex }) => (
  <Box padding="space.100" xcss={{ width: widthPct, minWidth: 0 }}>
    <SkeletonShape column={column} rowIndex={rowIndex} />
  </Box>
);

const SkeletonRow = ({ activeColumns, widths, rowIndex }) => (
  <Box
    xcss={{
      width: '100%',
      backgroundColor: rowIndex % 2 === 0 ? 'transparent' : ZEBRA,
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderTopColor: '#F4F5F7',
    }}
  >
    <Inline space="space.0" alignBlock="center">
      {activeColumns.map((k) => (
        <SkeletonCell key={k} column={k} widthPct={widths[k]} rowIndex={rowIndex} />
      ))}
      <Box padding="space.100" xcss={actionsCellStyle}>
        <Box xcss={bar('56px', '22px', SKELETON_ALT)} />
      </Box>
    </Inline>
  </Box>
);

export const IssueTableSkeleton = ({ activeColumns, widths, rowCount = 6 }) => (
  <Stack space="space.0">
    <IssueTableHeader activeColumns={activeColumns} widths={widths} />
    {Array.from({ length: rowCount }, (_, i) => (
      <SkeletonRow
        key={i}
        activeColumns={activeColumns}
        widths={widths}
        rowIndex={i}
      />
    ))}
  </Stack>
);
