# Repo-specific instructions for AI coding agents

This project (Podvibe / ListenIn) is a small TypeScript + React app that turns text or URLs into short podcast-style audio using Gemini. The file layout and runtime patterns below are the most important things to know before editing or adding features.

**Quick Run**:
- **Install deps:** `npm install`
- **Dev server:** `npm run dev` (uses Vite)
- **Build:** `npm run build`

**Entry points & structure**:
- `index.html` — app shell and an `importmap` used for AI Studio/CDN imports; main script is `index.tsx`.
- `index.tsx` — React mount point (root element `#root`).
- `App.tsx` — single-page app logic: UI, state, generation flow, localStorage handling, and automation via URL params.
- `services/geminiService.ts` — contains all Gemini interactions: `generatePodcastScript`, `generatePodcastAudio`, and `estimateTimestamps`. Update voice names or model config here.
- `utils/audioUtils.ts` — PCM/base64 helpers, `createWavBlob`, `decodeAudioData` (sampleRate: 24000, mono). Audio format is Int16Array PCM throughout.
- `components/*` — UI widgets (API key input, history sidebar, player, transcript).
- `types.ts` — canonical TypeScript types for sessions, lines, and generation state.

**Key runtime/workflow details (do not break these assumptions)**
- API key storage: the UI saves the API key to `localStorage` under `gemini_api_key`. App also supports providing the key via URL params (`?key=...` or `?apiKey=...`).
- History: session list is persisted to `localStorage` under `podcast_history`.
- Automation: `App.tsx` supports automated generation via URL query params. Example: `?auto=true&key=...&text=...&webhook=...` — the app will generate audio and POST `{ title, script, duration, audioBase64 }` to the `webhook` URL.
- Script format expected by the UI: `generatePodcastScript` returns text where every line is `Speaker: Text` and the script may include a `TITLE:` first line. The service strips `TITLE:` before returning the parsed script and lines.
- Audio format: `generatePodcastAudio` returns raw PCM encoded as `Int16Array` (sampleRate 24000). Use `createWavBlob` or `createWavUrl` from `utils/audioUtils.ts` to make playable assets.

**Important patterns & conventions**
- Centralized AI calls: all Gemini model names and request shapes live in `services/geminiService.ts`. Prefer adding config/flags here rather than spreading model names across the codebase.
- Cultural/voice config: `CULTURAL_CONFIGS` maps `PodcastLanguage` values to defaults (hosts/voices/context). If you add a language, update this object and `types.ts`.
- Timestamp estimation: `estimateTimestamps` is a simple char-count proportional estimator — tolerable for UI highlighting but not exact. If you replace it, keep the same `ScriptLine` shape in `types.ts`.
- UI state persistence: avoid changing localStorage keys unless you migrate data (search for `gemini_api_key` and `podcast_history`).

**Testing & debug tips**
- To debug without a real Gemini key, you can stub `services/geminiService.ts` functions to return canned scripts and `Int16Array` audio.
- Use the URL automation flow to drive end-to-end scenarios in the browser quickly: `?auto=true&key=<key>&text=Hello%20world&length=Short`.
- Check console logs for helpful error messages; `App.tsx` surfaces generation errors in `generationState`.

**Security & operational notes**
- The app expects a Gemini API key — do not commit secrets. README suggests `.env.local`, but the running app reads `localStorage` or URL params in the browser. CI/deploy processes should inject the key into the environment used to launch the app or into a secure UI endpoint.
- Gemini models used: `gemini-2.5-flash` (content) and `gemini-2.5-flash-preview-tts` (TTS). Be mindful of quotas and the content-to-audio pipeline.

If anything here is unclear or you want me to expand a section (examples for stubbing tests, migration notes for localStorage, or a changelog strategy), tell me which parts and I will iterate.
