import React from 'react';
import { Box, Image } from '@forge/react';
const LINEAR_LOGO = require('../../modules/filterMacro/linear-logo-data.js');

export const LinearLogo = ({ size = 20 }) => (
  <Box
    xcss={{
      width: `${size}px`,
      height: `${size}px`,
      overflow: 'hidden',
      borderRadius: 'radius.full',
      flexShrink: 0,
    }}
  >
    <Image
      src={LINEAR_LOGO}
      alt="Linear"
      xcss={{ width: '100%', height: '100%', display: 'block' }}
    />
  </Box>
);