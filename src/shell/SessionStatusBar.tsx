import React from 'react';
import { WorkflowStage } from '../shared/types/workflow.types';

interface SessionStatusBarProps {
  stage: WorkflowStage;
  taskCount: number;
  autoRouteEnabled: boolean;
  liveConnected: boolean;
  liveRecording: boolean;
  cloudEnabled: boolean;
  cloudReachable: boolean;
  cloudChecked: boolean;
  cloudMessage: string;
}

export const SessionStatusBar: React.FC<SessionStatusBarProps> = ({
  stage,
  taskCount,
  autoRouteEnabled,
  liveConnected,
  liveRecording,
  cloudEnabled,
  cloudReachable,
  cloudChecked,
  cloudMessage,
}) => {
  return (
    <div className="status-bar">
      <span>Stage: {stage}</span>
      <span>Tasks: {taskCount}</span>
      <span>Voice Auto-route: {autoRouteEnabled ? 'ON' : 'OFF'}</span>
      <span>Live Session: {liveConnected ? 'Connected' : 'Disconnected'}</span>
      <span>Mic: {liveRecording ? 'Recording' : 'Idle'}</span>
      <span>Model Stack: Gemini Live + Gemini Image/Video</span>
      <span>Cloud Persistence: {cloudEnabled ? 'Configured' : 'Not configured'}</span>
      <span>
        Cloud API: {cloudChecked ? (cloudReachable ? 'Reachable' : 'Unreachable') : 'Not checked'}
      </span>
      <span title={cloudMessage}>Cloud Health: {cloudMessage}</span>
    </div>
  );
};
