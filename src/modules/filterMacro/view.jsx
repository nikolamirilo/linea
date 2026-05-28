import React, { useState } from 'react';
import ForgeReconciler, { Box, Stack } from '@forge/react';
import { useForgeContext } from '../../shared/hooks/useForgeContext';
import { useMacroConfig } from '../../shared/hooks/useMacroConfig';
import { useIssues } from '../../shared/hooks/useIssues';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import {
  NotConnectedState,
  isNotConnectedError,
  isUpstreamError,
} from '../../shared/components/NotConnectedState';
import { PresetPicker } from './components/PresetPicker';
import { FilterToolbar } from './components/FilterToolbar';
import { ColumnTogglePanel } from './components/ColumnTogglePanel';
import { IssueTable } from './components/IssueTable';
import { IssueTableSkeleton } from './components/IssueTableSkeleton';
const { ALL_COLUMNS, DEFAULT_COLUMNS } = require('../../shared/constants/columns');
const { PRESET_URLS } = require('../../shared/constants/presets');
const { computeColumnWidths } = require('../../shared/utils/columnWidths');

const App = () => {
  const { context, loading: loadingCtx, error: ctxError } = useForgeContext();
  const {
    config,
    loadingConfig,
    error: configError,
    pickPreset,
    clearConfig,
    toggleColumn,
    refresh,
    savingUrl,
    savingColumns,
  } = useMacroConfig(context.pageId, context.macroId);
  const { issues, loadingIssues, error: issuesError } = useIssues(config?.url);
  const [showColumns, setShowColumns] = useState(false);
  const [expandedIssueId, setExpandedIssueId] = useState(null);

  const error = ctxError || configError || issuesError;

  if (loadingCtx || loadingConfig) {
    return <LoadingState message="Loading Linear Filter macro..." />;
  }

  // Linear isn't connected yet (or token revoked) - show actionable state.
  if (isNotConnectedError(error)) {
    return <NotConnectedState reason={/expired|revoked/i.test(error) ? 'expired' : 'not_connected'} />;
  }

  if (!config?.url) {
    return (
      <PresetPicker
        presets={PRESET_URLS}
        error={error}
        savingUrl={savingUrl}
        onPick={pickPreset}
      />
    );
  }

  const activeColumns = (
    config.columns && config.columns.length ? config.columns : DEFAULT_COLUMNS
  ).filter((k) => ALL_COLUMNS.some((c) => c.key === k));

  const widths = computeColumnWidths(activeColumns, issues || []);

  return (
    <Box padding="space.100" xcss={{ width: '100%' }}>
      <Stack space="space.150">
        <FilterToolbar
          issueCount={issues?.length || 0}
          showColumns={showColumns}
          onToggleColumns={() => setShowColumns((v) => !v)}
          onRefresh={refresh}
          onChangeFilter={clearConfig}
          loadingIssues={loadingIssues}
        />

        {showColumns && (
          <ColumnTogglePanel
            allColumns={ALL_COLUMNS}
            activeColumns={activeColumns}
            savingColumns={savingColumns}
            onToggle={toggleColumn}
          />
        )}

        <ErrorBanner error={error} appearance="inline" />

        {loadingIssues && (!issues || issues.length === 0) ? (
          <IssueTableSkeleton activeColumns={activeColumns} widths={widths} />
        ) : (
          <IssueTable
            issues={issues}
            activeColumns={activeColumns}
            widths={widths}
            expandedIssueId={expandedIssueId}
            onToggleExpand={setExpandedIssueId}
          />
        )}
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
