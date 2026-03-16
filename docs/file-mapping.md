# File Mapping

## Live Agent migration

- `index.tsx` -> `src/modules/live-agent/components/live-audio.ts`
- `visual-3d.ts` -> `src/modules/live-agent/components/visual-3d.ts`
- `visual.ts` -> `src/modules/live-agent/components/visual.ts`
- `analyser.ts` -> `src/modules/live-agent/engine/analyser.ts`
- `backdrop-shader.ts` -> `src/modules/live-agent/engine/backdrop-shader.ts`
- `sphere-shader.ts` -> `src/modules/live-agent/engine/sphere-shader.ts`
- `utils.ts` -> `src/modules/live-agent/utils/audioCodec.ts`

## Creative Storyteller migration

- Provided `geminiService.ts` split into:
  - `src/modules/creative-storyteller/services/geminiStoryService.ts`
  - `src/modules/creative-storyteller/services/styleSuggestionService.ts`
  - `src/modules/creative-storyteller/services/imageGenerationService.ts`
  - `src/modules/creative-storyteller/services/videoGenerationService.ts`
- Provided `utils.ts` -> `src/modules/creative-storyteller/utils/storytellerUtils.ts`
- Provided `App.tsx` -> `src/modules/creative-storyteller/components/StorytellerWorkspace.tsx`
