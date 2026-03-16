# Cortana — Multimodal Live Agent

An integrated multimodal hackathon platform combining:

- `Live Agent` (real-time voice interaction with Cortana HUD + 3D visualization)
- `Creative Storyteller` (image + video generation pipeline)
- `Workflow Orchestration` (task routing, artifact tracking, sync status)
- `UI Navigator` (placeholder module for future phase)

---

## Live Demo

**[https://zainkhan1994.github.io/Cortana-MultiModal-Live-Agent/](https://zainkhan1994.github.io/Cortana-MultiModal-Live-Agent/)**

> Pushing to `main` auto-deploys to GitHub Pages via the included CI workflow.

---

## Core Features

- Realtime Live Agent voice session with interruption handling
- Auto-routing from voice/transcript to creative generation tasks
- Storyteller generation flow:
  - style suggestion
  - image generation
  - video generation
- Artifact panel with local/cloud status and links
- Cloud health checks + local fallback mode
- Upload service scaffold for Cloud Run + Cloud Storage

---

## Tech Stack

- Frontend: React + TypeScript + Vite
- Realtime module: Lit + Three.js + Gemini Live
- Generation APIs: `@google/genai`
- Backend upload service: Node.js + Express + Multer + GCS SDK
- Deployment target: Google Cloud Run + Cloud Storage

---

## Repository Structure

- `src/modules/live-agent` - ORB Live API module and 3D visuals
- `src/modules/creative-storyteller` - multimodal generation UI + services
- `src/orchestration` - routing, tasks, workflow state, compliance guard
- `src/cloud/services` - cloud upload + cloud health clients
- `src/shell` - integrated app shell and panels
- `services/cloud-upload` - deployable upload service backend
- `docs/` - architecture, mappings, handoff, integration notes

---

## Prerequisites

- Node.js 20+
- npm
- (Optional for cloud deploy) Google Cloud SDK (`gcloud`)

---

## Frontend Local Setup

1. Install dependencies:
   - `npm install`
2. Configure env:
   - copy `.env.example` -> `.env`
3. Set at least:
   - `VITE_GEMINI_API_KEY`
4. Run:
   - `npm run dev`
5. Open:
   - `http://localhost:3000`

---

## Environment Variables

### Root app (`.env`)

- `VITE_GEMINI_API_KEY` - required for Gemini Live + generation
- `VITE_CLOUD_PERSIST_ENDPOINT` - optional upload endpoint (`/artifacts/upload`)
- `VITE_CLOUD_PERSIST_API_KEY` - optional API key header (`x-upload-api-key`)

### Upload service (`services/cloud-upload/.env`)

- `PORT` - default `8080`
- `BUCKET_NAME` - target Cloud Storage bucket
- `GOOGLE_CLOUD_PROJECT` - GCP project id
- `CORS_ORIGINS` - allowed frontend origins
- `UPLOAD_API_KEY` - optional upload API key (must match frontend)
- `MAKE_PUBLIC` - `false` for signed URLs, `true` for public objects
- `MAX_UPLOAD_BYTES` - upload limit

---

## GitHub Pages Deployment

The app auto-deploys to **GitHub Pages** on every push to `main`.

### Required GitHub repo settings

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Save.

### Required GitHub Actions secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Google Gemini API key (injected at build time) |
| `VITE_CLOUD_PERSIST_ENDPOINT` | Optional | Cloud Run upload endpoint |
| `VITE_CLOUD_PERSIST_API_KEY` | Optional | Upload service API key |

> **Note:** `VITE_*` secrets are inlined into the JS bundle at build time (standard Vite behaviour). They are not server-side secrets. Use a backend proxy if you need stricter key protection.

### Deployment workflow

The workflow file is at `.github/workflows/deploy.yml`. It:
1. Checks out the repo.
2. Installs dependencies with `npm ci`.
3. Runs `npm run build` (injects env secrets).
4. Uploads `dist/` as a GitHub Pages artifact.
5. Deploys it to `https://zainkhan1994.github.io/Cortana-MultiModal-Live-Agent/`.

---

The app supports three sync states:

- `Local-first mode` - no cloud endpoint configured
- `Cloud sync temporarily offline` - endpoint configured but unreachable
- `Cloud sync online` - upload service reachable and active

With `Local-only fallback` enabled, generation still succeeds when cloud sync is down.

---

## Backend Upload Service

Location:
- `services/cloud-upload`

Run locally:
1. `cd services/cloud-upload`
2. `npm install`
3. configure `.env`
4. `npm run dev`

Endpoints:
- `GET /healthz`
- `POST /artifacts/upload` (multipart form-data: `file`, `kind`, `prompt`, `timestamp`)

---

## Cloud Deploy Notes

You can deploy `services/cloud-upload` to Cloud Run and point:
- `VITE_CLOUD_PERSIST_ENDPOINT=https://<service-url>/artifacts/upload`

Important:
- Some org policies block public Cloud Run (`allUsers` invoker)
- If blocked, use local upload service or private authenticated proxy pattern

Deployment helper:
- `services/cloud-upload/deploy.ps1`

---

## Testing Checklist

- Start frontend and confirm ORB renders
- Start mic and verify Live Agent session/events
- Trigger multimodal request and verify:
  - workflow task transitions
  - image/video artifacts
  - cloud/local sync status
- Toggle fallback mode and test offline behavior
- Build check:
  - `npm run build`

---

## Known Constraints

- `UI Navigator` is currently a placeholder module
- Intent routing is heuristic regex-based (not model-classified)
- Cloud Run public access may be restricted by org IAM policy

---

## Documentation References

- `docs/architecture.md`
- `docs/file-mapping.md`
- `docs/suyama-handoff.md`
