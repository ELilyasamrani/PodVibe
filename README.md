# 🎧 PodVibe

> **Turn any article, link, or text into a lifelike AI podcast — instantly.**

PodVibe converts written content into engaging, deep-dive audio conversations between two AI hosts. Powered by **Google Gemini 2.5 Flash** for script generation and multi-speaker TTS for audio synthesis, all running directly in your browser.

---

## ✨ Features

- **🚀 Instant Generation** — Paste text or a URL and get a full podcast episode in seconds.
- **🌍 Multi-Language** — Supports English, French (FR & CA), Spanish, Arabic, Moroccan Darija, and Chinese.
- **🎙️ Custom Personas** — Name your hosts, assign them roles (e.g. *Skeptic*, *Expert*), write personality descriptions, and pick their voices.
- **🔊 5 AI Voices** — Choose from Puck, Charon, Fenrir, Kore, and Zephyr for each host.
- **📚 Programs (Series)** — Group episodes under a shared theme so every episode inherits a global context.
- **📜 Synchronized Transcript** — Follow along with a live transcript that highlights the active speaker.
- **⏱️ Flexible Length** — Short (~3 min), Medium (~5 min), or Long (~10 min) episodes.
- **💾 Local History** — All sessions are saved in your browser's localStorage — no account needed.
- **🔁 Use as Template** — Clone any past episode's prompt and settings to regenerate variations.
- **⚙️ Automation API** — Trigger generation via URL parameters and receive the result in a webhook (n8n, Zapier, etc.).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| AI (Script) | Google Gemini 2.5 Flash (`@google/genai`) |
| AI (Audio) | Gemini multi-speaker TTS |
| Icons | Lucide React |
| Storage | Browser `localStorage` |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/ELilyasamrani/ListenIn.git
cd ListenIn/ListenIn
npm install
```

### Configuration

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Alternatively, the app will prompt you to enter your API key directly in the browser on first use.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎬 How It Works

```
1. Input      →  Paste raw text, an article, or a URL
2. Script     →  Gemini 2.5 Flash generates a natural "deep-dive" dialogue
3. Audio      →  Multi-speaker TTS synthesizes lifelike audio per host
4. Listen     →  In-browser playback with waveform visualizer & transcript
```

---

## 🔌 Automation API

PodVibe exposes a **URL-based API** for headless or automated generation. When a browser visits the URL below, it triggers generation client-side and POSTs the result to your webhook.

### Endpoint

```
/?auto=true&key={API_KEY}&text={CONTENT}&webhook={WEBHOOK_URL}
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `auto` | ✅ Yes | Must be `true` to trigger auto-generation |
| `key` | ✅ Yes* | Your Gemini API key (*not needed if already saved in browser) |
| `text` / `url` | ✅ Yes | Source content or URL (URL-encoded) |
| `webhook` | Optional | URL to POST the generated result to |
| `lang` | Optional | `English`, `French`, `FrenchCA`, `Darija`, `Arabic`, `Spanish`, `Chinese` |
| `length` | Optional | `Short`, `Medium`, `Long` |
| `title` | Optional | Custom episode title |
| `description` | Optional | Custom instructions for the AI (e.g. `"Make it funny"`) |
| `host1` / `host2` | Optional | Custom host names |
| `host1Voice` / `host2Voice` | Optional | `Puck`, `Charon`, `Fenrir`, `Kore`, `Zephyr` |

### Webhook Payload

```json
{
  "title": "My Generated Podcast",
  "summary": "A concise summary of the episode.",
  "script": "Host 1: Hello...\nHost 2: This is amazing...",
  "duration": 125.5,
  "audioBase64": "UklGRi..."
}
```

> **Note:** Because PodVibe uses the Web Audio API, the page must be rendered in a real browser or headless browser (e.g. Puppeteer). A plain HTTP GET request will not work.

### n8n Integration Example

1. Create a **Webhook** node in n8n (POST method) and copy its URL.
2. Construct the PodVibe URL with your params + the webhook URL.
3. Open the URL in a headless browser node (e.g. Puppeteer).
4. The Webhook node receives the JSON payload including `audioBase64`.
5. Use a **Binary** node to decode it back to a `.wav` file for upload or storage.

---

## 📁 Project Structure

```
ListenIn/
├── App.tsx                 # Root app, state management, generation flow
├── types.ts                # TypeScript types (PodcastSession, PodcastSeries, etc.)
├── index.tsx               # React entry point
├── components/
│   ├── LandingPage.tsx     # Landing / marketing page
│   ├── Player.tsx          # Audio player with waveform visualizer
│   ├── Transcript.tsx      # Synchronized transcript view
│   ├── HistorySidebar.tsx  # Episode & series history
│   ├── ApiDocs.tsx         # In-app API documentation
│   ├── ApiKeyInput.tsx     # API key entry UI
│   └── Footer.tsx          # Footer component
├── services/
│   └── geminiService.ts    # Gemini API calls (script + audio generation)
└── utils/
    └── audioUtils.ts       # WAV encoding and audio decoding helpers
```

---

## 👤 Author

Developed by **Ilyas El Amrani**

[![GitHub](https://img.shields.io/badge/GitHub-ELilyasamrani-181717?logo=github)](https://github.com/ELilyasamrani)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-ilyas--el--amrani-0A66C2?logo=linkedin)](https://www.linkedin.com/in/ilyas-el-amrani)

---

## 📄 License

Licensed under Business Source License (BSL).
