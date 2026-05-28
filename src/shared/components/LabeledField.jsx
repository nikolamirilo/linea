import React from 'react';
import { Text } from '@forge/react';

export const LabeledField = ({ label, children }) => (
  <Text>
    <Text as="strong">{label}: </Text>
    {children}
  </Text>
);
