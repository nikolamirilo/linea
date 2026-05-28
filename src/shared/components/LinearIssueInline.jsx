import React from 'react';
import { Box, Inline, Link, Lozenge, Strong } from '@forge/react';
import { LinearLogo } from './LinearLogo';

const stateAppearance = (type) => {
  switch (type) {
    case 'completed':
      return 'success';
    case 'started':
      return 'inprogress';
    case 'canceled':
      return 'removed';
    case 'unstarted':
    case 'backlog':
    default:
      return 'default';
  }
};

export const LinearIssueInline = ({ issue, size = 'medium' }) => {
  const isLarge = size === 'large';
  const logoSize = isLarge ? 20 : 16;
  const inlineSpace = isLarge ? 'space.150' : 'space.075';
  const padding = isLarge ? 'space.150' : 'space.050';

  const titleBlock = (
    <Inline space="space.075" alignBlock="center">
      <Link href={issue.url} openNewTab xcss>
        {issue.identifier}
      </Link>
      {issue.title}
    </Inline>
  );

  return (
    <Box
      padding={padding}
      xcss={
        isLarge
          ? {
              width: '100%',
              borderStyle: 'solid',
              borderWidth: 'border.width',
              borderColor: 'color.border',
              borderRadius: 'border.radius',
              backgroundColor: 'color.background.neutral.subtle',
            }
          : undefined
      }
    >
      {isLarge ? (
        <Inline spread="space-between" alignBlock="center" grow="fill">
          <Inline space={inlineSpace} alignBlock="center">
            <LinearLogo size={logoSize} />
            {titleBlock}
          </Inline>
          {issue.state?.name && (
            <Lozenge appearance={stateAppearance(issue.state?.type)}>
              {issue.state.name}
            </Lozenge>
          )}
        </Inline>
      ) : (
        <Inline space={inlineSpace} alignBlock="center">
          <LinearLogo size={logoSize} />
          {titleBlock}
          {issue.state?.name && (
            <Lozenge appearance={stateAppearance(issue.state?.type)}>
              {issue.state.name}
            </Lozenge>
          )}
        </Inline>
      )}
    </Box>
  );
};