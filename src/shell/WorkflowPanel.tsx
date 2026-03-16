import React, { useState } from 'react';
import { WorkflowStage, WorkflowTask } from '../shared/types/workflow.types';

interface WorkflowPanelProps {
  stage: WorkflowStage;
  tasks: WorkflowTask[];
  onRouteRequest: (goal: string) => void;
  autoRouteEnabled: boolean;
  onToggleAutoRoute: (enabled: boolean) => void;
  minTranscriptLength: number;
  onMinTranscriptLengthChange: (value: number) => void;
  onRecheckCloudHealth: () => void;
  cloudHealthMessage: string;
  localFallbackEnabled: boolean;
  onToggleLocalFallback: (enabled: boolean) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  stage,
  tasks,
  onRouteRequest,
  autoRouteEnabled,
  onToggleAutoRoute,
  minTranscriptLength,
  onMinTranscriptLengthChange,
  onRecheckCloudHealth,
  cloudHealthMessage,
  localFallbackEnabled,
  onToggleLocalFallback,
  focusMode,
  onToggleFocusMode,
}) => {
  const [goal, setGoal] = useState('');

  return (
    <div className="shell-card">
      <div className="shell-card-header">
        <h2>Workflow</h2>
        {onToggleFocusMode && (
          <button
            type="button"
            className="compact-btn"
            onClick={onToggleFocusMode}
            title={focusMode ? 'Exit focus mode' : 'Focus mode'}
          >
            {focusMode ? '⊠ Exit Focus' : '⊡ Focus'}
          </button>
        )}
      </div>
      <p className="muted">Current stage: {stage}</p>
      <div className="workflow-settings">
        <label className="setting-row">
          <span>Auto-route from voice</span>
          <input
            type="checkbox"
            checked={autoRouteEnabled}
            onChange={(e) => onToggleAutoRoute(e.target.checked)}
          />
        </label>
        <label className="setting-column">
          <span>Minimum transcript length: {minTranscriptLength}</span>
          <input
            type="range"
            min={8}
            max={80}
            value={minTranscriptLength}
            onChange={(e) => onMinTranscriptLengthChange(Number(e.target.value))}
          />
        </label>
        <label className="setting-row">
          <span>Local-only fallback</span>
          <input
            type="checkbox"
            checked={localFallbackEnabled}
            onChange={(e) => onToggleLocalFallback(e.target.checked)}
          />
        </label>
        <div className="setting-row">
          <span>Cloud health: {cloudHealthMessage}</span>
          <button type="button" className="compact-btn" onClick={onRecheckCloudHealth}>
            Re-check
          </button>
        </div>
      </div>
      <div className="workflow-composer">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Type a mission request (ex: Create a cinematic teaser image and video)"
        />
        <button
          type="button"
          onClick={() => {
            if (!goal.trim()) return;
            onRouteRequest(goal.trim());
          }}
          disabled={!goal.trim()}
        >
          Route Mission
        </button>
      </div>
      <ul className="list">
        {tasks.length === 0 && <li className="muted">No active tasks.</li>}
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.agent}</strong> - {task.status}
            <div className="muted">{task.goal}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};
