import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Box,
  Text,
  Link,
  SectionMessage,
  useProductContext,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { IssueCard } from '../../shared/components/IssueCard';
import { LinearIssueInline } from '../../shared/components/LinearIssueInline';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import {
  NotConnectedState,
  isNotConnectedError,
} from '../../shared/components/NotConnectedState';

const UrlView = ({ issue }) => (
  <Link href={issue.url} openNewTab>
    {issue.url}
  </Link>
);

const App = () => {
  const context = useProductContext();
  const rawConfig = context?.extension?.config || {};
  const config = (rawConfig.config && typeof rawConfig.config === 'object') ? rawConfig.config : rawConfig;
  const displayMode =
    (typeof config.displayMode === 'object'
      ? config.displayMode?.value
      : config.displayMode) || 'card';
  const url = (config.url || '').trim();

  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!url) {
      setState({ loading: false, error: 'No Linear URL configured. Click Settings to add one.' });
      return;
    }
    setState({ loading: true });
    let active = true;
    const timeoutId = setTimeout(() => {
      if (active) setState({ loading: false, error: 'Request timed out. Check your Linear connection.' });
    }, 25000);

    (async () => {
      try {
        const result = await invoke('getLinearIssue', { url });
        if (!active) return;
        clearTimeout(timeoutId);
        if (result?.error) {
          setState({ loading: false, error: result.error });
        } else if (result?.notFound) {
          setState({ loading: false, error: `Issue ${result.identifier} not found` });
        } else {
          setState({ loading: false, issue: result.issue });
        }
      } catch (err) {
        if (!active) return;
        clearTimeout(timeoutId);
        setState({ loading: false, error: err?.message || 'Failed to load Linear issue' });
      }
    })();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [url]);

  if (state.loading) {
    return <LoadingState message="Loading Linear issue..." showSpinner />;
  }

  if (isNotConnectedError(state.error)) {
    return <NotConnectedState reason={/expired|revoked/i.test(state.error) ? 'expired' : 'not_connected'} />;
  }

  if (state.error) {
    return (
      <SectionMessage appearance="warning" title="Linear Link">
        <Text>{state.error}</Text>
      </SectionMessage>
    );
  }

  const { issue } = state;

  if (displayMode === 'url') {
    return (
      <Box padding="space.050">
        <UrlView issue={issue} />
      </Box>
    );
  }

  if (displayMode === 'inline') {
    return <LinearIssueInline issue={issue} />;
  }

  return <IssueCard issue={issue} />;
};

ForgeReconciler.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
