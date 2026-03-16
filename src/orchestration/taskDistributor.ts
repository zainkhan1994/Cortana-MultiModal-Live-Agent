import { AgentKind } from '../shared/types/agent.types';
import { WorkflowTask } from '../shared/types/workflow.types';

export const createTask = (agent: AgentKind, goal: string): WorkflowTask => {
  return {
    id: `${agent}-${crypto.randomUUID()}`,
    agent,
    goal,
    status: 'queued',
    inputArtifacts: [],
    outputArtifacts: [],
  };
};
