import { useCallback, useMemo, useState } from 'react';
import { Artifact } from '../shared/types/artifact.types';
import { WorkflowStage, WorkflowTask } from '../shared/types/workflow.types';

export const useWorkflowCoordinator = () => {
  const [stage, setStage] = useState<WorkflowStage>('user-interaction');
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const onTaskStateChange = useCallback((task: WorkflowTask) => {
    setTasks((prev) => {
      const exists = prev.some((p) => p.id === task.id);
      if (!exists) {
        return [...prev, task];
      }
      return prev.map((p) => (p.id === task.id ? task : p));
    });

    if (task.status === 'queued') {
      setStage('task-distribution');
    } else if (task.status === 'running') {
      setStage('content-creation');
    } else if (task.status === 'completed') {
      setStage('real-time-feedback');
    } else if (task.status === 'failed') {
      setStage('real-time-feedback');
    }
  }, []);

  const onArtifactCreated = useCallback((artifact: Artifact) => {
    setArtifacts((prev) => [artifact, ...prev]);
    if (artifact.kind === 'image' || artifact.kind === 'video' || artifact.kind === 'interleaved-output') {
      setStage('digital-action');
    }
  }, []);

  return useMemo(
    () => ({
      stage,
      tasks,
      artifacts,
      onTaskStateChange,
      onArtifactCreated,
    }),
    [artifacts, onArtifactCreated, onTaskStateChange, stage, tasks],
  );
};
