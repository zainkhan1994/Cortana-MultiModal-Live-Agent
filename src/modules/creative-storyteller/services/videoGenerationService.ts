import { cleanBase64 } from '../utils/storytellerUtils';
import { getStoryAI, sleep } from './geminiStoryService';

const createBlankImage = (width: number, height: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }
  return cleanBase64(canvas.toDataURL('image/png'));
};

const pollForVideo = async (operation: any) => {
  const ai = getStoryAI() as any;
  let op = operation;
  const startTime = Date.now();
  const MAX_WAIT_TIME = 180000;

  while (!op.done) {
    if (Date.now() - startTime > MAX_WAIT_TIME) {
      throw new Error('Video generation timed out.');
    }
    await sleep(5000);
    op = await ai.operations.getVideosOperation({ operation: op });
  }
  return op;
};

const fetchVideoBlob = async (uri: string) => {
  const url = new URL(uri);
  url.searchParams.append('key', process.env.API_KEY || '');
  const videoResponse = await fetch(url.toString());
  if (!videoResponse.ok) {
    throw new Error(`Failed to fetch video content: ${videoResponse.statusText}`);
  }
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

export const generateTextVideo = async (
  text: string,
  imageBase64: string,
  imageMimeType: string,
  promptStyle: string,
): Promise<string> => {
  const ai = getStoryAI() as any;
  if (!imageBase64) throw new Error('Image generation failed, cannot generate video.');

  const cleanImageBase64 = cleanBase64(imageBase64);
  const startImage = createBlankImage(1280, 720);
  const revealPrompt = `Cinematic transition. The text "${text}" forms from darkness. ${promptStyle}.`;

  const operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: revealPrompt,
    image: {
      imageBytes: startImage,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
      lastFrame: {
        imageBytes: cleanImageBase64,
        mimeType: imageMimeType,
      },
    },
  });

  const op = await pollForVideo(operation);
  if (!op.error && op.response?.generatedVideos?.[0]?.video?.uri) {
    return fetchVideoBlob(op.response.generatedVideos[0].video.uri);
  }

  throw new Error(op.error?.message || 'Unable to generate video.');
};
