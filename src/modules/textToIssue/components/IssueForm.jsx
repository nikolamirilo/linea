import React from 'react';
import {
  Stack,
  Label,
  RequiredAsterisk,
  Textfield,
  TextArea,
  Select,
} from '@forge/react';
const { PRIORITY_OPTIONS } = require('../../../shared/constants/priorities');

const ISSUE_TYPE_OPTIONS = [
  { label: 'Task', value: 'task' },
  { label: 'Bug', value: 'bug' },
  { label: 'Question', value: 'question' },
  { label: 'Improvement', value: 'improvement' },
  { label: 'Feature', value: 'feature' },
  { label: 'Ask / Request', value: 'ask' },
  { label: 'Spike / Research', value: 'spike' },
];

const Field = ({ id, label, isRequired, children }) => (
  <Stack space="space.050">
    <Label labelFor={id}>
      {label}
      {isRequired ? <RequiredAsterisk /> : null}
    </Label>
    {children}
  </Stack>
);

export const IssueForm = ({
  title,
  description,
  priority,
  teamId,
  teams,
  projectId,
  projects,
  projectsLoading,
  labelIds,
  labels,
  issueType,
  issueTypeLoading,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onTeamChange,
  onProjectChange,
  onLabelsChange,
  onIssueTypeChange,
}) => {
  const teamOptions = teams.map((t) => ({ label: t.name, value: t.id }));
  const teamValue = teamOptions.find((o) => o.value === teamId) || null;
  const priorityValue = PRIORITY_OPTIONS.find((o) => o.value === priority) || null;

  const projectOptions = (projects || []).map((p) => ({
    label: p.name,
    value: p.id,
  }));
  const projectValue = projectOptions.find((o) => o.value === projectId) || null;

  const labelOptions = (labels || []).map((l) => ({
    label: l.name,
    value: l.id,
  }));
  const labelValues = labelOptions.filter((o) =>
    (labelIds || []).includes(o.value)
  );

  const issueTypeValue =
    ISSUE_TYPE_OPTIONS.find((o) => o.value === issueType) ||
    ISSUE_TYPE_OPTIONS[0];

  return (
    <Stack space="space.200">
      <Field id="issueType" label="Tone Type">
        <Select
          inputId="issueType"
          name="issueType"
          options={ISSUE_TYPE_OPTIONS}
          value={issueTypeValue}
          onChange={onIssueTypeChange}
          isDisabled={issueTypeLoading}
          placeholder={issueTypeLoading ? 'Regenerating...' : undefined}
        />
      </Field>

      <Field id="title" label="Title" isRequired>
        <Textfield
          id="title"
          name="title"
          value={title}
          onChange={onTitleChange}
          isRequired
        />
      </Field>

      <Field id="description" label="Description">
        <TextArea
          id="description"
          name="description"
          value={description}
          onChange={onDescriptionChange}
          minimumRows={8}
        />
      </Field>

      
      <Field id="priority" label="Priority">
        <Select
          inputId="priority"
          name="priority"
          options={PRIORITY_OPTIONS}
          value={priorityValue}
          onChange={onPriorityChange}
        />
      </Field>

      <Field id="teamId" label="Team" isRequired>
        <Select
          inputId="teamId"
          name="teamId"
          options={teamOptions}
          value={teamValue}
          onChange={onTeamChange}
          isRequired
        />
      </Field>
    
      <Field id="projectId" label="Project">
        <Select
          inputId="projectId"
          name="projectId"
          options={projectOptions}
          value={projectValue}
          onChange={onProjectChange}
          isClearable
          isDisabled={!teamId || projectsLoading}
          placeholder={
            !teamId
              ? 'Select a team first'
              : projectsLoading
                ? 'Loading projects...'
                : projectOptions.length === 0
                  ? 'No projects in this team'
                  : 'Select a project (optional)'
          }
        />
      </Field>

      <Field id="labelIds" label="Labels">
        <Select
          inputId="labelIds"
          name="labelIds"
          options={labelOptions}
          value={labelValues}
          onChange={(options) =>
            onLabelsChange(
              Array.isArray(options) ? options.map((o) => o.value) : []
            )
          }
          isMulti
          isSearchable
          isClearable
          placeholder={
            labelOptions.length === 0
              ? 'No labels available'
              : 'Search and select labels (optional)'
          }
          isDisabled={labelOptions.length === 0}
        />
      </Field>

    </Stack>
  );
};
