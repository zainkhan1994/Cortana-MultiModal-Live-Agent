import { AgentKind } from '../shared/types/agent.types';

export interface RoutingDecision {
  primary: AgentKind;
  secondary?: AgentKind;
  reason: string;
}

const MULTIMODAL_PATTERN =
  /\b(generate|create|design|make|image|video|poster|storyboard|visual|thumbnail|reel)\b/i;

export const routeAgentTask = (userGoal: string): RoutingDecision => {
  if (MULTIMODAL_PATTERN.test(userGoal)) {
    return {
      primary: 'live-agent',
      secondary: 'creative-storyteller',
      reason: 'Multimodal creation requested',
    };
  }

  return {
    primary: 'live-agent',
    reason: 'Realtime conversation request',
  };
};
