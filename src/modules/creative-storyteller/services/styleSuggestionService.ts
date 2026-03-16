import { getStoryAI } from './geminiStoryService';

export const generateStyleSuggestion = async (text: string): Promise<string> => {
  const ai = getStoryAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate one short visual style direction (10-15 words) for "${text}". Output only style.`,
    });
    return response.text?.trim() || '';
  } catch (e) {
    console.error('Failed to generate style suggestion', e);
    return '';
  }
};
