param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [string]$Region = "us-central1",
  [string]$ServiceName = "cloud-upload-service",
  [string]$CorsOrigins = "http://localhost:3000",
  [string]$UploadApiKey = "",
  [switch]$MakePublic
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying $ServiceName to Cloud Run..." -ForegroundColor Cyan
Write-Host "Project: $ProjectId"
Write-Host "Region: $Region"
Write-Host "Bucket: $BucketName"

$image = "gcr.io/$ProjectId/$ServiceName"

gcloud config set project $ProjectId | Out-Null

Write-Host "Submitting container build..." -ForegroundColor Yellow
gcloud builds submit --tag $image

$makePublicValue = if ($MakePublic.IsPresent) { "true" } else { "false" }

$envVars = @(
  "BUCKET_NAME=$BucketName"
  "GOOGLE_CLOUD_PROJECT=$ProjectId"
  "MAKE_PUBLIC=$makePublicValue"
  "CORS_ORIGINS=$CorsOrigins"
)

if ($UploadApiKey -ne "") {
  $envVars += "UPLOAD_API_KEY=$UploadApiKey"
}

$envVarArg = $envVars -join ","

Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
  --image $image `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars $envVarArg

$serviceUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"

Write-Host ""
Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "Service URL: $serviceUrl"
Write-Host "Frontend VITE_CLOUD_PERSIST_ENDPOINT: $serviceUrl/artifacts/upload"
