import { AgentKind } from './agent.types';

export type WorkflowStage =
  | 'user-interaction'
  | 'task-distribution'
  | 'content-creation'
  | 'digital-action'
  | 'real-time-feedback';

export interface WorkflowTask {
  id: string;
  agent: AgentKind;
  goal: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  inputArtifacts: string[];
  outputArtifacts: string[];
}
