import { getStoryAI } from './geminiStoryService';

interface TextImageOptions {
  text: string;
  style: string;
  typographyPrompt?: string;
  referenceImage?: string;
}

export const generateTextImage = async ({
  text,
  style,
  typographyPrompt,
  referenceImage,
}: TextImageOptions): Promise<{ data: string; mimeType: string }> => {
  const ai = getStoryAI();
  const parts: any[] = [];
  const typoInstruction = typographyPrompt?.trim()
    ? typographyPrompt
    : 'High-quality, cinematic, legible typography.';

  if (referenceImage) {
    const [mimeTypePart, data] = referenceImage.split(';base64,');
    parts.push({
      inlineData: {
        data,
        mimeType: mimeTypePart.replace('data:', ''),
      },
    });
  }

  parts.push({
    text: `Create cinematic image with centered text "${text}". Style: ${style}. Typography: ${typoInstruction}.`,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('No image generated');
};
