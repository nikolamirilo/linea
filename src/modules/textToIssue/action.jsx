import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Stack,
  Inline,
  Button,
  LinkButton,
  Icon,
  Lozenge,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalTransition,
} from '@forge/react';
import { invoke, rovo } from '@forge/bridge';
import { useForgeContext } from '../../shared/hooks/useForgeContext';
import { LinearLogo } from '../../shared/components/LinearLogo';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorBanner } from '../../shared/components/ErrorBanner';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';
import {
  NotConnectedState,
  isNotConnectedError,
} from '../../shared/components/NotConnectedState';
import { SuccessMessage } from './components/SuccessMessage';
import { IssueForm } from './components/IssueForm';

const App = () => {
  const { context, loading: contextLoading } = useForgeContext();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('0');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [labelIds, setLabelIds] = useState([]);
  const [labels, setLabels] = useState([]);
  const [issueType, setIssueType] = useState('task');
  const [issueTypeLoading, setIssueTypeLoading] = useState(false);

  const generateDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectedText = context.selectedText;
      if (!selectedText) {
        setError(
          'No text was selected. Close this dialog, select a paragraph of text on the page, then click the Linear icon again.'
        );
        setLoading(false);
        return;
      }

      const draft = await invoke('draftIssue', {
        selectedText,
        pageContext: {
          title: context.title,
          labels: [],
          spaceKey: context.spaceKey,
        },
      });

      if (draft?.error) {
        setError(draft.error);
        return;
      }

      setTitle(draft.title || '');
      setDescription(draft.description || '');
      setPriority(String(draft.suggestedPriority ?? 0));
      setTeams(Array.isArray(draft.teams) ? draft.teams : []);
      setLabels(Array.isArray(draft.labels) ? draft.labels : []);
      setLabelIds([]);
      setProjectId('');
      setProjects([]);
      setIssueType(draft.issueType || 'task');
      if (draft.suggestedTeamId) {
        setTeamId(draft.suggestedTeamId);
      } else if (draft.teams?.length > 0) {
        setTeamId(draft.teams[0].id);
      }
    } catch (err) {
      setError('Failed to generate draft: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextLoading) {
      generateDraft();
    }
  }, [contextLoading]);

  useEffect(() => {
    if (!teamId) {
      setProjects([]);
      setProjectId('');
      return;
    }
    let cancelled = false;
    (async () => {
      setProjectsLoading(true);
      try {
        const result = await invoke('listProjects', { teamId });
        if (cancelled) return;
        setProjects(Array.isArray(result?.projects) ? result.projects : []);
        setProjectId('');
      } catch (err) {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!teamId) {
      setError('Please select a team');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const result = await invoke('createIssue', {
        title: title.trim(),
        description,
        teamId,
        priority: parseInt(priority, 10),
        labelIds,
        assigneeId: null,
        projectId: projectId || null,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.issue || null);
    } catch (err) {
      setError('Failed to create issue: ' + (err?.message || String(err)));
    } finally {
      setCreating(false);
    }
  };

  const handleIssueTypeChange = async (option) => {
    const nextType = option?.value || 'task';
    if (nextType === issueType) return;

    const selectedText = context?.selectedText;
    if (!selectedText) {
      setIssueType(nextType);
      return;
    }

    setIssueType(nextType);
    setIssueTypeLoading(true);
    try {
      const result = await invoke('renderDescription', {
        selectedText,
        issueType: nextType,
        pageContext: {
          title: context.title,
          spaceKey: context.spaceKey,
        },
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDescription(result.description || '');
      setTitle((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return prev;
        if (nextType === 'question' && !trimmed.endsWith('?')) {
          return `${trimmed}?`;
        }
        if (nextType !== 'question' && trimmed.endsWith('?')) {
          return trimmed.slice(0, -1);
        }
        return prev;
      });
    } catch (err) {
      setError('Failed to switch template: ' + (err?.message || String(err)));
    } finally {
      setIssueTypeLoading(false);
    }
  };

  const closeModal = () => setIsOpen(false);

  const TYPE_LOZENGE = {
    bug: { label: 'Bug', appearance: 'removed' },
    question: { label: 'Question', appearance: 'new' },
    improvement: { label: 'Improvement', appearance: 'inprogress' },
    feature: { label: 'Feature', appearance: 'success' },
    ask: { label: 'Ask', appearance: 'moved' },
    spike: { label: 'Spike', appearance: 'default' },
    task: { label: 'Task', appearance: 'default' },
  };
  const lozenge = TYPE_LOZENGE[issueType] || TYPE_LOZENGE.task;

  const renderBody = () => {
    if (loading) {
      return <LoadingState message="Generating Linear issue draft..." showSpinner />;
    }
    if (success) {
      return <SuccessMessage issue={success} />;
    }
    if (isNotConnectedError(error)) {
      return <NotConnectedState reason={/expired|revoked/i.test(error) ? 'expired' : 'not_connected'} />;
    }
    return (
      <Stack space="space.200">
        <ErrorBanner error={error} />
        <IssueForm
          title={title}
          description={description}
          priority={priority}
          teamId={teamId}
          teams={teams}
          projectId={projectId}
          projects={projects}
          projectsLoading={projectsLoading}
          labelIds={labelIds}
          labels={labels}
          issueType={issueType}
          issueTypeLoading={issueTypeLoading}
          onTitleChange={(e) => setTitle(e.target.value)}
          onDescriptionChange={(e) => setDescription(e.target.value)}
          onPriorityChange={(option) => setPriority(option?.value || '0')}
          onTeamChange={(option) => setTeamId(option?.value || '')}
          onProjectChange={(option) => setProjectId(option?.value || '')}
          onLabelsChange={(ids) => setLabelIds(Array.isArray(ids) ? ids : [])}
          onIssueTypeChange={handleIssueTypeChange}
        />
      </Stack>
    );
  };

  return (
    <ModalTransition>
      {isOpen && (
        <Modal onClose={closeModal} width="large" shouldScrollInViewport={true}>
          <ModalHeader>
            <Inline spread="space-between" alignBlock="center" grow="fill">
              <Inline space="space.100" alignBlock="center">
                <LinearLogo size={24} />
                <ModalTitle>Create Linear Issue</ModalTitle>
                {!loading && !success && (
                  <Lozenge appearance={lozenge.appearance}>
                    {lozenge.label}
                  </Lozenge>
                )}
              </Inline>
              {!success && (
                <Button
                  appearance="subtle"
                  onClick={closeModal}
                  spacing="compact"
                >
                  <Icon glyph="cross" label="Close" size="small" />
                </Button>
              )}
            </Inline>
          </ModalHeader>
          <ModalBody>{renderBody()}</ModalBody>
          {!loading && !success && (
            <ModalFooter>
              <Button appearance="subtle" onClick={generateDraft}>
                Re-generate
              </Button>
              <Button
                appearance="subtle"
                onClick={async () => {
                  const selectedText = context?.selectedText || '';
                  if (!selectedText.trim()) {
                    setError(
                      'No text was selected. Close this dialog, select a paragraph, then try again.'
                    );
                    return;
                  }
                  try {
                    await rovo.open({
                      type: 'forge',
                      agentKey: 'linear-task-specialist',
                      agentName: 'Linea Task Specialist',
                      prompt: `I highlighted the following passage on a Confluence page titled "${context?.title || 'Untitled'}" in space "${context?.spaceKey || 'unknown'}". Please draft a Linear issue from it and help me refine the title, description, and priority. When I approve, create it in Linear.\n\n---\n${selectedText}`,
                    });
                  } catch (err) {
                    setError(
                      'Could not open Rovo. This feature requires a Confluence plan that includes Rovo (Standard / Premium / Enterprise).'
                    );
                  }
                }}
              >
                Refine with Rovo AI
              </Button>
              <Button
                appearance="primary"
                onClick={handleCreate}
                isDisabled={creating}
              >
                {creating ? 'Creating...' : 'Create in Linear'}
              </Button>
            </ModalFooter>
          )}
          {success && (
            <ModalFooter>
              <Button appearance="subtle" onClick={closeModal}>
                Close
              </Button>
              <LinkButton
                appearance="primary"
                href={success?.url}
                target="_blank"
              >
                Open in Linear
              </LinkButton>
            </ModalFooter>
          )}
        </Modal>
      )}
    </ModalTransition>
  );
};

ForgeReconciler.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
