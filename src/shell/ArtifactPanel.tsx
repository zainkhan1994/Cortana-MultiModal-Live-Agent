import React from 'react';
import { Artifact } from '../shared/types/artifact.types';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  rightContent?: React.ReactNode;
  cloudStatus?: {
    mode: 'local' | 'offline' | 'online';
    title: string;
    message: string;
    hint?: string;
  };
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifacts, rightContent, cloudStatus }) => {
  return (
    <div className="shell-card">
      <h2>Creative Storyteller</h2>
      {cloudStatus && (
        <div className={`sync-card sync-card-${cloudStatus.mode}`}>
          <div className="sync-card-title-row">
            <span className="sync-dot" />
            <strong>{cloudStatus.title}</strong>
          </div>
          <div className="sync-card-message">{cloudStatus.message}</div>
          {cloudStatus.hint && <div className="sync-card-hint">{cloudStatus.hint}</div>}
        </div>
      )}
      {rightContent}
      <h3>Artifacts</h3>
      <ul className="list">
        {artifacts.length === 0 && <li className="muted">No artifacts yet.</li>}
        {artifacts.map((artifact) => (
          <li key={artifact.id}>
            <strong>{artifact.kind}</strong> - {artifact.producer}
            <div className="muted">{new Date(artifact.createdAt).toLocaleTimeString()}</div>
            {(artifact.payload as any)?.localOnly && (
              <div className="artifact-tag">saved locally</div>
            )}
            {artifact.kind === 'status-update' && (
              <div className="muted">{(artifact.payload as any)?.message}</div>
            )}
            {artifact.kind === 'image' && (
              <>
                <a
                  className="muted"
                  href={(artifact.payload as any)?.imageDataUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open image
                </a>
                {(artifact.payload as any)?.cloud?.persistedUrl && (
                  <a
                    className="muted"
                    href={(artifact.payload as any)?.cloud?.persistedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open cloud image
                  </a>
                )}
                {(artifact.payload as any)?.cloud?.message && (
                  <div className="muted">{(artifact.payload as any)?.cloud?.message}</div>
                )}
              </>
            )}
            {artifact.kind === 'video' && (
              <>
                <a
                  className="muted"
                  href={(artifact.payload as any)?.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open video
                </a>
                {(artifact.payload as any)?.cloud?.persistedUrl && (
                  <a
                    className="muted"
                    href={(artifact.payload as any)?.cloud?.persistedUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open cloud video
                  </a>
                )}
                {(artifact.payload as any)?.cloud?.message && (
                  <div className="muted">{(artifact.payload as any)?.cloud?.message}</div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
