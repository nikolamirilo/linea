import React, { useState } from 'react';
import ForgeReconciler, {
  Textfield,
  Select,
  Text,
  Stack,
  Button,
  useProductContext,
} from '@forge/react';
import { view } from '@forge/bridge';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';

const DISPLAY_OPTIONS = [
  { label: 'URL', value: 'url' },
  { label: 'Inline', value: 'inline' },
  { label: 'Card', value: 'card' },
];

const findDisplayOption = (value) => {
  const v = value?.value ?? value;
  return DISPLAY_OPTIONS.find((o) => o.value === v) || DISPLAY_OPTIONS[2];
};

const Config = () => {
  const context = useProductContext();
  const current = context?.extension?.config || {};

  const [url, setUrl] = useState(typeof current.url === 'string' ? current.url : '');
  const [displayMode, setDisplayMode] = useState(findDisplayOption(current.displayMode));

  const handleSave = async () => {
    await view.submit({
      config: {
        url: url.trim(),
        displayMode: displayMode.value,
      },
    });
  };

  return (
    <Stack space="space.100">
      <Textfield
        label="Linear issue URL"
        name="url"
        isRequired
        defaultValue={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://linear.app/workspace/issue/ENG-123/..."
      />
      <Select
        label="Display"
        name="displayMode"
        options={DISPLAY_OPTIONS}
        defaultValue={displayMode}
        onChange={(option) => setDisplayMode(option || DISPLAY_OPTIONS[2])}
      />
      <Text>
        Paste any Linear issue URL. Pick how it renders: a plain URL, an inline
        chip (ID, summary, status), or a full card.
      </Text>
      <Button appearance="primary" onClick={handleSave}>
        Save
      </Button>
    </Stack>
  );
};

ForgeReconciler.render(
  <ErrorBoundary>
    <Config />
  </ErrorBoundary>
);
