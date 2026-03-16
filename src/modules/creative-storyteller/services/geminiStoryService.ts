import { GoogleGenAI } from '@google/genai';

export const getStoryAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
