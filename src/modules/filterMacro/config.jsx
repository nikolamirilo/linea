import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Select,
  CheckboxGroup,
  Textfield,
  Stack,
  Text,
  Button,
  Spinner,
  SectionMessage,
  useProductContext,
} from '@forge/react';
import { invoke, view } from '@forge/bridge';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';

const STATE_ITEMS = [
  { label: 'Backlog', value: 'backlog' },
  { label: 'In Progress', value: 'started' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'canceled' },
];

const Config = () => {
  const context = useProductContext();
  const rawConfig = context?.extension?.config || {};
  const current = (rawConfig.config && typeof rawConfig.config === 'object') ? rawConfig.config : rawConfig;

  const [teams, setTeams] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [teamId, setTeamId] = useState(current.teamId || '');
  const [stateTypes, setStateTypes] = useState(current.stateTypes || ['started']);
  const [labelIds, setLabelIds] = useState(current.labelIds || []);
  const [limit, setLimit] = useState(String(current.limit || '25'));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const options = await invoke('getFilterOptions');
        if (cancelled) return;
        if (options?.error) {
          setError(options.error);
        } else {
          setTeams(options.teams || []);
          setLabels(options.labels || []);
          if (!current.teamId && options.teams?.length > 0) {
            setTeamId(options.teams[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load filter options');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    await view.submit({
      config: {
        teamId,
        stateTypes,
        labelIds,
        limit,
      },
    });
  };

  if (loading) {
    return (
      <Stack space="space.100">
        <Spinner size="medium" />
        <Text>Loading teams...</Text>
      </Stack>
    );
  }

  if (error || teams.length === 0) {
    return (
      <SectionMessage appearance="error" title="Cannot load filter options">
        <Stack space="space.050">
          <Text>{error || 'No Linear teams are available.'}</Text>
          <Text>
            Make sure Linear is connected on the Linear Configuration page.
          </Text>
        </Stack>
      </SectionMessage>
    );
  }

  const teamOptions = teams.map((t) => ({
    label: `${t.name} (${t.key})`,
    value: t.id,
  }));
  const labelOptions = labels.map((l) => ({ label: l.name, value: l.id }));

  const currentTeam = teamOptions.find((o) => o.value === teamId) || null;
  const currentLabels = labelOptions.filter((o) => (labelIds || []).includes(o.value));

  return (
    <Stack space="space.100">
      <Select
        label="Team"
        name="teamId"
        options={teamOptions}
        defaultValue={currentTeam}
        onChange={(option) => setTeamId(option?.value || '')}
        isRequired
      />
      <CheckboxGroup
        label="Status types"
        name="stateTypes"
        options={STATE_ITEMS}
        defaultValue={stateTypes}
        onChange={(values) => setStateTypes(Array.isArray(values) ? values : [])}
      />
      <Select
        label="Labels (optional)"
        name="labelIds"
        options={labelOptions}
        defaultValue={currentLabels}
        onChange={(options) => setLabelIds((options || []).map((o) => o.value))}
        isMulti
      />
      <Textfield
        label="Max rows"
        name="limit"
        defaultValue={limit}
        onChange={(e) => setLimit(e.target.value)}
      />
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
