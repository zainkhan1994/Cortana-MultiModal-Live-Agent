export enum StorytellerAppState {
  IDLE = 'IDLE',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export interface StorytellerGenerationResult {
  imageUrl?: string;
  videoUrl?: string;
}
