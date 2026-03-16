# Architecture

The integrated app uses ORB Live Agent as the primary shell and routes multimodal generation tasks to Creative Storyteller.

## Layers

- `shell`: App layout and workflow/status presentation.
- `modules/live-agent`: Realtime audio interaction and ORB visuals.
- `modules/creative-storyteller`: Image/video generation module.
- `orchestration`: Routing, workflow states, task and artifact coordination.
- `modules/ui-navigator/placeholder`: Reserved extension slot for future implementation.

## Architecture Diagram

```mermaid
graph TD
    %% Define Nodes with Source Files as Labels
    Browser["Browser"]
    Frontend["Vite Frontend<br>(src/App.tsx)"]
    LiveAPI["Gemini Live API (voice + barge-in)<br>via src/modules/live-agent/components/live-audio.ts"]
    Storyteller["Creative Storyteller (Gemini image/video gen)<br>via src/modules/creative-storyteller/"]
    Orchestration["Orchestration Router<br>(src/orchestration/agentRouter.ts)"]
    CloudService["Cloud Upload Service (Cloud Run)<br>via src/cloud/services/cloudArtifactService.ts"]
    GCS["Google Cloud Storage bucket"]

    %% Define Connections
    Browser -->|interacts with| Frontend
    Frontend -->|voice streams| LiveAPI
    Frontend -->|generative requests| Storyteller
    Frontend -->|routes tasks| Orchestration
    Frontend -->|uploads artifacts| CloudService
    CloudService -->|stores files| GCS
```
