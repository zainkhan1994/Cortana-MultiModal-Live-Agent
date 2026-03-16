export type ArtifactKind =
  | 'transcript'
  | 'audio'
  | 'image'
  | 'video'
  | 'story-plan'
  | 'interleaved-output'
  | 'status-update';

export interface Artifact<T = unknown> {
  id: string;
  kind: ArtifactKind;
  producer: 'live-agent' | 'creative-storyteller' | 'ui-navigator' | 'orchestrator';
  payload: T;
  createdAt: string;
}
