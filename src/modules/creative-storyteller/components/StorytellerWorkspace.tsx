import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Artifact } from '../../../shared/types/artifact.types';
import { WorkflowTask } from '../../../shared/types/workflow.types';
import { generateTextImage } from '../services/imageGenerationService';
import { generateStyleSuggestion } from '../services/styleSuggestionService';
import { generateTextVideo } from '../services/videoGenerationService';
import { getRandomStyle } from '../utils/storytellerUtils';
import { persistArtifactToCloud } from '../../../cloud/services/cloudArtifactService';

interface StorytellerWorkspaceProps {
  onTaskStateChange: (task: WorkflowTask) => void;
  onArtifactCreated: (artifact: Artifact) => void;
  localFallbackEnabled: boolean;
}

export interface StorytellerWorkspaceHandle {
  generateFromPrompt: (prompt: string) => Promise<void>;
}

export const StorytellerWorkspace = forwardRef<StorytellerWorkspaceHandle, StorytellerWorkspaceProps>(({
  onTaskStateChange,
  onArtifactCreated,
  localFallbackEnabled,
}, ref) => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('');
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const createTask = (goal: string): WorkflowTask => ({
    id: `story-${Date.now()}`,
    agent: 'creative-storyteller',
    goal,
    status: 'running',
    inputArtifacts: [],
    outputArtifacts: [],
  });

  const handleGenerate = async (forcedPrompt?: string) => {
    const prompt = (forcedPrompt ?? text).trim();
    if (!prompt) return;
    const task = createTask(`Create multimodal story assets for: ${prompt}`);
    onTaskStateChange(task);
    setIsGenerating(true);
    setStatus('Generating cinematic image...');
    setImageSrc(null);
    setVideoSrc(null);

    try {
      const styleToUse = style.trim() || getRandomStyle();
      const { data, mimeType } = await generateTextImage({ text: prompt, style: styleToUse });
      const imageDataUrl = `data:${mimeType};base64,${data}`;
      setImageSrc(imageDataUrl);
      setStatus('Persisting image artifact...');
      const persistedImage = await persistArtifactToCloud({
        kind: 'image',
        sourceUrl: imageDataUrl,
        prompt,
      });
      const imageLocalOnly = !persistedImage.uploaded;
      if (imageLocalOnly && !localFallbackEnabled) {
        throw new Error(`Cloud image persistence failed: ${persistedImage.message}`);
      }
      onArtifactCreated({
        id: `artifact-image-${Date.now()}`,
        kind: 'image',
        producer: 'creative-storyteller',
        payload: {
          imageDataUrl,
          prompt,
          cloud: persistedImage,
          localOnly: imageLocalOnly,
        },
        createdAt: new Date().toISOString(),
      });
      if (imageLocalOnly) {
        onArtifactCreated({
          id: `artifact-status-image-local-${Date.now()}`,
          kind: 'status-update',
          producer: 'creative-storyteller',
          payload: {
            message: `Image stored as local-only fallback: ${persistedImage.message}`,
          },
          createdAt: new Date().toISOString(),
        });
      }

      setStatus('Generating cinematic video...');
      const videoUrl = await generateTextVideo(prompt, data, mimeType, styleToUse);
      setVideoSrc(videoUrl);
      setStatus('Persisting video artifact...');
      const persistedVideo = await persistArtifactToCloud({
        kind: 'video',
        sourceUrl: videoUrl,
        prompt,
      });
      const videoLocalOnly = !persistedVideo.uploaded;
      if (videoLocalOnly && !localFallbackEnabled) {
        throw new Error(`Cloud video persistence failed: ${persistedVideo.message}`);
      }
      onArtifactCreated({
        id: `artifact-video-${Date.now()}`,
        kind: 'video',
        producer: 'creative-storyteller',
        payload: {
          videoUrl,
          prompt,
          cloud: persistedVideo,
          localOnly: videoLocalOnly,
        },
        createdAt: new Date().toISOString(),
      });
      if (videoLocalOnly) {
        onArtifactCreated({
          id: `artifact-status-video-local-${Date.now()}`,
          kind: 'status-update',
          producer: 'creative-storyteller',
          payload: {
            message: `Video stored as local-only fallback: ${persistedVideo.message}`,
          },
          createdAt: new Date().toISOString(),
        });
      }

      onTaskStateChange({ ...task, status: 'completed' });
      setStatus(imageLocalOnly || videoLocalOnly ? 'Completed (local-only fallback).' : 'Completed.');
    } catch (err: any) {
      onTaskStateChange({ ...task, status: 'failed' });
      setStatus(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generateFromPrompt: async (prompt: string) => {
      setText(prompt);
      await handleGenerate(prompt);
    },
  }));

  return (
    <div className="storyteller-workspace">
      <div className="row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your story asset..."
        />
      </div>
      <div className="row">
        <textarea
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Art direction style (optional)"
        />
      </div>
      <div className="row buttons">
        <button
          type="button"
          onClick={async () => setStyle(await generateStyleSuggestion(text))}
          disabled={!text.trim() || isGenerating}
        >
          Suggest Style
        </button>
        <button type="button" onClick={() => handleGenerate()} disabled={!text.trim() || isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {status && <p className="muted">{status}</p>}
      {imageSrc && <img className="artifact-preview" src={imageSrc} alt="Story image" />}
      {videoSrc && <video className="artifact-preview" src={videoSrc} controls autoPlay loop muted />}
    </div>
  );
});

StorytellerWorkspace.displayName = 'StorytellerWorkspace';
