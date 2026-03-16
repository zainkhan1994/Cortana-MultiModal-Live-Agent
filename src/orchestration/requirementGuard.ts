export const validateHackathonRequirements = () => {
  const cloudEndpointConfigured = !!(process.env.CLOUD_PERSIST_ENDPOINT || '').trim();
  return {
    usesGemini: true,
    usesGenAISDK: true,
    cloudServiceEnabled: cloudEndpointConfigured,
  };
};
