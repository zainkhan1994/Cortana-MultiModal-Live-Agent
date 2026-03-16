interface PersistArtifactInput {
  kind: 'image' | 'video';
  sourceUrl: string;
  prompt: string;
  fileName?: string;
}

export interface PersistArtifactResult {
  enabled: boolean;
  uploaded: boolean;
  persistedUrl?: string;
  message: string;
}

const getCloudEndpoint = () => (process.env.CLOUD_PERSIST_ENDPOINT || '').trim();
const getCloudPersistApiKey = () => (process.env.CLOUD_PERSIST_API_KEY || '').trim();

const buildFileName = (kind: 'image' | 'video', prompt: string, explicit?: string) => {
  if (explicit) return explicit;
  const safePrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'artifact';
  const extension = kind === 'image' ? 'png' : 'mp4';
  return `${kind}-${safePrompt}-${Date.now()}.${extension}`;
};

const sourceUrlToBlob = async (sourceUrl: string): Promise<Blob> => {
  if (sourceUrl.startsWith('data:')) {
    const response = await fetch(sourceUrl);
    return response.blob();
  }
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to read source artifact: ${response.statusText}`);
  }
  return response.blob();
};

export const persistArtifactToCloud = async (
  input: PersistArtifactInput,
): Promise<PersistArtifactResult> => {
  const endpoint = getCloudEndpoint();
  if (!endpoint) {
    return {
      enabled: false,
      uploaded: false,
      message: 'Cloud persistence endpoint not configured.',
    };
  }

  try {
    const blob = await sourceUrlToBlob(input.sourceUrl);
    const fileName = buildFileName(input.kind, input.prompt, input.fileName);
    const formData = new FormData();
    formData.append('file', new File([blob], fileName, { type: blob.type || 'application/octet-stream' }));
    formData.append('kind', input.kind);
    formData.append('prompt', input.prompt);
    formData.append('timestamp', new Date().toISOString());

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getCloudPersistApiKey()
        ? {
            'x-upload-api-key': getCloudPersistApiKey(),
          }
        : undefined,
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upload failed (${response.status}): ${body || response.statusText}`);
    }

    const data = (await response.json()) as { url?: string; message?: string };
    return {
      enabled: true,
      uploaded: true,
      persistedUrl: data.url,
      message: data.message || 'Uploaded to cloud storage.',
    };
  } catch (error: any) {
    return {
      enabled: true,
      uploaded: false,
      message: error?.message || 'Cloud upload failed.',
    };
  }
};
