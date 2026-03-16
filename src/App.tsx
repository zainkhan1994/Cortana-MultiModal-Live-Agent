import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OrbShellLayout } from './shell/OrbShellLayout';
import { ArtifactPanel } from './shell/ArtifactPanel';
import { WorkflowPanel } from './shell/WorkflowPanel';
import { SessionStatusBar } from './shell/SessionStatusBar';
import {
  StorytellerWorkspace,
  StorytellerWorkspaceHandle,
} from './modules/creative-storyteller/components/StorytellerWorkspace';
import { useWorkflowCoordinator } from './orchestration/workflowCoordinator';
import './modules/live-agent/components/live-audio';
import { routeAgentTask } from './orchestration/agentRouter';
import { createTask } from './orchestration/taskDistributor';
import { validateHackathonRequirements } from './orchestration/requirementGuard';
import { createContext } from 'react';
import { checkCloudHealth } from './cloud/services/cloudHealthService';

const AUTO_ROUTE_COOLDOWN_MS = 6000;
const CLOUD_HEALTH_POLL_MS = 45000;

const normalizeTranscript = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gdm-live-audio': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

const App: React.FC = () => {
  const workflow = useWorkflowCoordinator();
  const { stage, tasks, artifacts, onTaskStateChange, onArtifactCreated } = workflow;
  const storytellerRef = useRef<StorytellerWorkspaceHandle>(null);
  const [autoRouteEnabled, setAutoRouteEnabled] = useState(true);
  const [minTranscriptLength, setMinTranscriptLength] = useState(18);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveRecording, setLiveRecording] = useState(false);
  const [cloudChecked, setCloudChecked] = useState(false);
  const [cloudReachable, setCloudReachable] = useState(false);
  const [cloudMessage, setCloudMessage] = useState('Not checked');
  const [localFallbackEnabled, setLocalFallbackEnabled] = useState(true);
  const lastRoutedTranscript = useRef<string>('');
  const lastRouteAt = useRef<number>(0);
  const routeInFlight = useRef(false);
  const compliance = useMemo(() => validateHackathonRequirements(), []);

  const runCloudHealthCheck = useCallback(async () => {
    const result = await checkCloudHealth();
    setCloudChecked(result.checked);
    setCloudReachable(result.reachable);
    setCloudMessage(result.message);
  }, []);

  const handleRouteRequest = useCallback(async (goal: string, source: 'manual' | 'voice' = 'manual') => {
    if (routeInFlight.current) return;
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    routeInFlight.current = true;
    try {
      const decision = routeAgentTask(trimmedGoal);
      const liveTask = createTask('live-agent', trimmedGoal);
      onTaskStateChange({ ...liveTask, status: 'running' });

      if (decision.secondary === 'creative-storyteller') {
        const creativeTask = createTask('creative-storyteller', trimmedGoal);
        onTaskStateChange({ ...creativeTask, status: 'queued' });
        await storytellerRef.current?.generateFromPrompt(trimmedGoal);
        onTaskStateChange({ ...liveTask, status: 'completed' });
        return;
      }

      onArtifactCreated({
        id: `artifact-status-${Date.now()}`,
        kind: 'status-update',
        producer: 'orchestrator',
        payload: {
          message: `Live Agent handled ${source} request: ${decision.reason}`,
          goal: trimmedGoal,
        },
        createdAt: new Date().toISOString(),
      });
      onTaskStateChange({ ...liveTask, status: 'completed' });
    } finally {
      routeInFlight.current = false;
    }
  }, [onArtifactCreated, onTaskStateChange]);

  useEffect(() => {
    const onUserTranscript = async (event: Event) => {
      const customEvent = event as CustomEvent<{ text?: string; final?: boolean }>;
      const text = customEvent.detail?.text?.trim();
      const isFinal = !!customEvent.detail?.final;
      if (!text || !isFinal) return;

      onArtifactCreated({
        id: `artifact-transcript-${Date.now()}`,
        kind: 'transcript',
        producer: 'live-agent',
        payload: { text },
        createdAt: new Date().toISOString(),
      });

      if (!autoRouteEnabled) return;
      if (text.length < minTranscriptLength) return;

      const normalized = normalizeTranscript(text);
      const now = Date.now();

      if (lastRoutedTranscript.current === normalized) return;
      if (now - lastRouteAt.current < AUTO_ROUTE_COOLDOWN_MS) {
        onArtifactCreated({
          id: `artifact-status-cooldown-${Date.now()}`,
          kind: 'status-update',
          producer: 'orchestrator',
          payload: {
            message: 'Voice route skipped during cooldown window',
            transcript: text,
          },
          createdAt: new Date().toISOString(),
        });
        return;
      }

      lastRoutedTranscript.current = normalized;
      lastRouteAt.current = now;
      try {
        await handleRouteRequest(text, 'voice');
      } catch (error: any) {
        onArtifactCreated({
          id: `artifact-status-route-error-${Date.now()}`,
          kind: 'status-update',
          producer: 'orchestrator',
          payload: {
            message: error?.message || 'Voice route failed',
            transcript: text,
          },
          createdAt: new Date().toISOString(),
        });
      }
    };

    const onModelResponse = (event: Event) => {
      const customEvent = event as CustomEvent<{ text?: string }>;
      const text = customEvent.detail?.text?.trim();
      if (!text) return;
      onArtifactCreated({
        id: `artifact-model-text-${Date.now()}`,
        kind: 'interleaved-output',
        producer: 'live-agent',
        payload: { text },
        createdAt: new Date().toISOString(),
      });
    };

    const onSessionStatus = (event: Event) => {
      const customEvent = event as CustomEvent<{ connected?: boolean }>;
      setLiveConnected(!!customEvent.detail?.connected);
    };

    const onRecordingState = (event: Event) => {
      const customEvent = event as CustomEvent<{ recording?: boolean }>;
      setLiveRecording(!!customEvent.detail?.recording);
    };

    window.addEventListener('live-agent:user-transcript', onUserTranscript as EventListener);
    window.addEventListener('live-agent:model-response', onModelResponse as EventListener);
    window.addEventListener('live-agent:session-status', onSessionStatus as EventListener);
    window.addEventListener('live-agent:recording', onRecordingState as EventListener);
    return () => {
      window.removeEventListener('live-agent:user-transcript', onUserTranscript as EventListener);
      window.removeEventListener('live-agent:model-response', onModelResponse as EventListener);
      window.removeEventListener('live-agent:session-status', onSessionStatus as EventListener);
      window.removeEventListener('live-agent:recording', onRecordingState as EventListener);
    };
  }, [autoRouteEnabled, handleRouteRequest, minTranscriptLength, onArtifactCreated]);

  useEffect(() => {
    let active = true;
    let timerId: number | undefined;

    const poll = async () => {
      const result = await checkCloudHealth();
      if (!active) return;
      setCloudChecked(result.checked);
      setCloudReachable(result.reachable);
      setCloudMessage(result.message);
    };

    poll();
    timerId = window.setInterval(poll, CLOUD_HEALTH_POLL_MS);

    return () => {
      active = false;
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, []);

  useEffect(() => {
    const onTriggerGeneration = async () => {
      if (!liveConnected || !storytellerRef.current) return;
      try {
        await storytellerRef.current.generateFromPrompt("A cinematic, highly detailed visual representation of the current conversation context, futuristic, moody");
      } catch (e) {
        console.error("Manual generation failed", e);
      }
    };

    window.addEventListener('live-agent:trigger-generation', onTriggerGeneration as EventListener);
    return () => {
      window.removeEventListener('live-agent:trigger-generation', onTriggerGeneration as EventListener);
    };
  }, [liveConnected]);

    const cloudStatus = useMemo(() => {
    if (!compliance.cloudServiceEnabled) {
      return {
        mode: 'local' as const,
        title: 'Local-first mode',
        message: 'Your creations are safe and available on this device right away.',
        hint: 'Add VITE_CLOUD_PERSIST_ENDPOINT anytime to enable cloud sync.',
      };
    }
    if (cloudChecked && !cloudReachable) {
      return {
        mode: 'offline' as const,
        title: 'Cloud sync temporarily offline',
        message: 'You can keep creating. New artifacts will continue in local-only mode.',
        hint: cloudMessage,
      };
    }
    return {
      mode: 'online' as const,
      title: 'Cloud sync online',
      message: 'Artifacts are being saved to cloud storage.',
      hint: cloudMessage,
    };
  }, [cloudChecked, cloudMessage, cloudReachable, compliance.cloudServiceEnabled]);

  const artifactPanel = useMemo(
    () => (
      <ArtifactPanel
        artifacts={artifacts}
        cloudStatus={cloudStatus}
        rightContent={
          <StorytellerWorkspace
            ref={storytellerRef}
            onTaskStateChange={onTaskStateChange}
            onArtifactCreated={onArtifactCreated}
            localFallbackEnabled={localFallbackEnabled}
          />
        }
      />
    ),
    [artifacts, cloudStatus, localFallbackEnabled, onArtifactCreated, onTaskStateChange],
  );

  return (
    <div className="app-root">
      <OrbShellLayout
        left={
          <WorkflowPanel
            stage={stage}
            tasks={tasks}
            onRouteRequest={(goal) => handleRouteRequest(goal, 'manual')}
            autoRouteEnabled={autoRouteEnabled}
            onToggleAutoRoute={setAutoRouteEnabled}
            minTranscriptLength={minTranscriptLength}
            onMinTranscriptLengthChange={setMinTranscriptLength}
            onRecheckCloudHealth={runCloudHealthCheck}
            cloudHealthMessage={cloudMessage}
            localFallbackEnabled={localFallbackEnabled}
            onToggleLocalFallback={setLocalFallbackEnabled}
          />
        }
        center={<div dangerouslySetInnerHTML={{ __html: '<gdm-live-audio></gdm-live-audio>' }} style={{width: '100%', height: '100%'}} />}
        right={artifactPanel}
        bottom={
          <SessionStatusBar
            stage={stage}
            taskCount={tasks.length}
            autoRouteEnabled={autoRouteEnabled}
            liveConnected={liveConnected}
            liveRecording={liveRecording}
            cloudEnabled={compliance.cloudServiceEnabled}
            cloudChecked={cloudChecked}
            cloudReachable={cloudReachable}
            cloudMessage={cloudMessage}
          />
        }
      />
    </div>
  );
};

export default App;
