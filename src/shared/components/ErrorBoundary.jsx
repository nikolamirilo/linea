import React from 'react';
import { Stack, SectionMessage, Text } from '@forge/react';

/**
 * Error boundary for Forge UI Kit entry points.
 *
 * Forge UI Kit is React-based, so the standard React class-component error
 * boundary pattern works. Without this, an unhandled exception during render
 * crashes the entire UI Kit panel - the user just sees a blank box.
 *
 * Wrap every top-level component (action.jsx, view.jsx, config.jsx, ui.jsx)
 * with <ErrorBoundary>...</ErrorBoundary>.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error) {
    // Log to Forge app logs, never to the user.
    // eslint-disable-next-line no-console
    console.error('Linea UI error boundary caught:', error?.message || 'unknown');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack space="space.150">
          <SectionMessage appearance="error" title="Something went wrong">
            <Text>
              Linea hit an unexpected error rendering this view. Try refreshing the
              page. If the problem persists, please contact support.
            </Text>
          </SectionMessage>
        </Stack>
      );
    }
    return this.props.children;
  }
}
