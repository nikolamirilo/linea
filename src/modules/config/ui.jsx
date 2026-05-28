import React, { useState, useEffect } from 'react';
import ForgeReconciler, { Text, Heading, Stack } from '@forge/react';
import { invoke } from '@forge/bridge';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import { ConnectedStatus } from './components/ConnectedStatus';
import { DisconnectedStatus } from './components/DisconnectedStatus';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [workspace, setWorkspace] = useState(null);
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [authUrl, setAuthUrl] = useState(null);
  const [redirectUri, setRedirectUri] = useState(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await invoke('getConnectionStatus');
      setConnected(!!status?.connected);
      setWorkspace(status?.workspace || null);
      setWarning(status?.warning || null);
      if (status?.error) setError(status.error);
    } catch (err) {
      setError(
        'Failed to load connection status: ' + (err?.message || String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const result = await invoke('startOAuth');
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.authorizeUrl) {
        setAuthUrl(result.authorizeUrl);
        setRedirectUri(result.redirectUri || null);
      }
    } catch (err) {
      setError(
        'Failed to start OAuth flow: ' + (err?.message || String(err))
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke('disconnect');
      if (result?.error) {
        setError(result.error);
      } else {
        setConnected(false);
        setWorkspace(null);
        setWarning(null);
        setAuthUrl(null);
      }
    } catch (err) {
      setError('Failed to disconnect: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingState message="Loading Linear connection status..." showSpinner />
    );
  }

  return (
    <Stack space="space.200">
      <Heading as="h1">Linea - Linear Configuration</Heading>
      <Text>
        Connect your Linear workspace to enable issue creation, link unfurling,
        and filter macros.
      </Text>

      <ErrorBanner error={error} />

      {warning && (
        <ErrorBanner error={warning} appearance="inline" />
      )}

      {connected ? (
        <ConnectedStatus
          workspace={workspace}
          onDisconnect={handleDisconnect}
          onRefresh={loadStatus}
        />
      ) : (
        <DisconnectedStatus
          authUrl={authUrl}
          redirectUri={redirectUri}
          connecting={connecting}
          onConnect={handleConnect}
          onRefresh={loadStatus}
        />
      )}

      <Heading as="h3">About</Heading>
      <Text>
        Linea brings Linear integration to Confluence: AI-assisted
        text-to-ticket creation, rich link unfurling for Linear URLs, and a
        Linear Filter macro for embedding live issue lists.
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
