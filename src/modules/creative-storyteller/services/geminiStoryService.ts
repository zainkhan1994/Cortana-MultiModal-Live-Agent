import { GoogleGenAI } from '@google/genai';

export const getStoryAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDqQhl48itATTX3DkYxD_L2Czdl5z7Is5Y' });

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
