import { Artifact } from '../shared/types/artifact.types';

type ArtifactSubscriber = (artifact: Artifact) => void;

class ArtifactBus {
  private subscribers: Set<ArtifactSubscriber> = new Set();

  publish(artifact: Artifact) {
    for (const subscriber of this.subscribers) {
      subscriber(artifact);
    }
  }

  subscribe(fn: ArtifactSubscriber) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
}

export const artifactBus = new ArtifactBus();
