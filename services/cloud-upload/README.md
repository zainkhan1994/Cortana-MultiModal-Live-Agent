# Cloud Upload Service (Cloud Run)

This service receives generated media artifacts and stores them in Google Cloud Storage.

## Endpoints

- `GET /healthz`
- `POST /artifacts/upload` (multipart/form-data)

### Upload request format

- `file`: binary file (required)
- `kind`: `image` or `video` (required)
- `prompt`: source prompt text (optional)
- `timestamp`: ISO timestamp (optional)
- Header `x-upload-api-key`: required only if `UPLOAD_API_KEY` is configured

### Upload response format

```json
{
  "message": "Artifact uploaded successfully.",
  "url": "https://...",
  "objectPath": "image/2026-03-15/...",
  "publicUrl": "https://storage.googleapis.com/...",
  "kind": "image",
  "contentType": "image/png"
}
```

## Local run

1. Copy `.env.example` to `.env`
2. Configure env values
3. Install deps and run:

```bash
npm install
npm run dev
```

## Deploy to Cloud Run

From `services/cloud-upload`:

```bash
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/cloud-upload-service

gcloud run deploy cloud-upload-service \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/cloud-upload-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars BUCKET_NAME=$BUCKET_NAME,MAKE_PUBLIC=false,CORS_ORIGINS=https://your-frontend-domain
```

### PowerShell one-command deploy (Windows)

```powershell
.\deploy.ps1 `
  -ProjectId "your-gcp-project-id" `
  -BucketName "your-gcs-bucket-name" `
  -CorsOrigins "http://localhost:3000,https://your-frontend-domain" `
  -UploadApiKey "your-secret-upload-key"
```

## Frontend integration

Set this in root frontend `.env.local`:

```env
CLOUD_PERSIST_ENDPOINT=https://<cloud-run-url>/artifacts/upload
CLOUD_PERSIST_API_KEY=your-secret-upload-key
```
