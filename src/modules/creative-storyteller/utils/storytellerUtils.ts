// @ts-ignore
import { GIFEncoder, applyPalette, quantize } from 'gifenc';

export const getRandomStyle = (): string => {
  const styles = [
    'formed by fluffy white clouds in a deep blue summer sky',
    'written in glowing constellations against a dark nebula galaxy',
    'arranged using colorful autumn leaves on wet green grass',
    'reflected in cyberpunk neon puddles on a rainy street',
    'displayed on a futuristic translucent holographic interface',
    'composed of vibrant colorful smoke swirling in a dark room',
  ];
  return styles[Math.floor(Math.random() * styles.length)];
};

export const cleanBase64 = (data: string): string => {
  return data.replace(/^data:.*,/, '');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const createGifFromVideo = async (videoUrl: string): Promise<Blob> => {
  if (typeof GIFEncoder !== 'function') {
    throw new Error('GIF library failed to load correctly.');
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 4;
        const width = 400;
        let height = Math.floor((video.videoHeight / video.videoWidth) * width);
        if (height % 2 !== 0) height -= 1;

        const fps = 10;
        const totalFrames = Math.floor(duration * fps);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not get canvas context');

        const gif = GIFEncoder();

        for (let i = 0; i < totalFrames; i++) {
          await new Promise((r) => setTimeout(r, 0));
          video.currentTime = i / fps;
          await new Promise<void>((r) => {
            const handler = () => {
              video.removeEventListener('seeked', handler);
              r();
            };
            video.addEventListener('seeked', handler);
          });
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const palette = quantize(imageData.data, 256);
          const index = applyPalette(imageData.data, palette);
          gif.writeFrame(index, width, height, { palette, delay: 1000 / fps });
        }

        gif.finish();
        resolve(new Blob([gif.bytes()], { type: 'image/gif' }));
      } catch (e) {
        reject(e);
      }
    };

    video.onerror = () => reject(new Error('Video load failed'));
    video.load();
  });
};
