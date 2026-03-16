export interface CloudHealthStatus {
  checked: boolean;
  reachable: boolean;
  message: string;
}

const getCloudEndpoint = () => (process.env.CLOUD_PERSIST_ENDPOINT || '').trim();

const buildHealthUrl = (uploadUrl: string) => {
  try {
    const url = new URL(uploadUrl);
    url.pathname = '/healthz';
    url.search = '';
    return url.toString();
  } catch (_e) {
    if (uploadUrl.endsWith('/artifacts/upload')) {
      return uploadUrl.replace(/\/artifacts\/upload$/, '/healthz');
    }
    return '';
  }
};

export const checkCloudHealth = async (): Promise<CloudHealthStatus> => {
  const endpoint = getCloudEndpoint();
  if (!endpoint) {
    return {
      checked: false,
      reachable: false,
      message: 'Cloud endpoint not configured',
    };
  }

  const healthUrl = buildHealthUrl(endpoint);
  if (!healthUrl) {
    return {
      checked: false,
      reachable: false,
      message: 'Invalid cloud endpoint URL',
    };
  }

  try {
    const response = await fetch(healthUrl, { method: 'GET' });
    if (!response.ok) {
      return {
        checked: true,
        reachable: false,
        message: `Health check failed (${response.status})`,
      };
    }

    return {
      checked: true,
      reachable: true,
      message: 'Cloud upload service reachable',
    };
  } catch (error: any) {
    return {
      checked: true,
      reachable: false,
      message: error?.message || 'Cloud health check failed',
    };
  }
};
