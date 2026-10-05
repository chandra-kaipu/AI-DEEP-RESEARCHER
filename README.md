# AI Deep Researcher 📜

An autonomous, full-stack, production-grade generative research engine. Given any query, topic, or document, **AI Deep Researcher** executes live web searches, scrapes content, parses secondary/adjacent outbound URLs with Cheerio, models market momentum and sentiment with LLMs, and synthesizes interactive briefings, dynamic mindmaps, time-series charts, and generative concept art.

> **Zero-Mock Policy:** Every panel in the user interface is wired directly to live network endpoints. When API keys are not yet provided, clear contextual instructions and an in-app setup modal guide the user—never falling back to artificial placeholder data.

---

## 🎨 Visual Identity & Architecture

- **Editorial Palette:** Warm cream paper tones (`#F5F2EA`), terracotta clay highlights (`#D97757`), muted sage (`#8C9C7C`), and warm ink typography with dark mode inversion support.
- **Typography:** Warm editorial serif (*Fraunces*) for titles and headers; humanist sans (*Inter*) for UI and reading copy.
- **Living Paper Canvas:** Interactive full-viewport Three.js WebGL background with morphing organic gradient meshes and a reactive synapse particle network that accelerates and pulses during research in-flight.
- **Full-Stack Separation:** Node.js + Express backend proxies all third-party APIs (keeping secrets server-side), streaming progress in real-time to a React 18 + Vite frontend via Server-Sent Events (SSE).

---

## 🚀 Key Features

1. **Live Web Retrieval:** Queries live web search providers (Tavily API, SerpAPI, or Bing Web Search).
2. **Miscellaneous & Outbound Link Discovery:** Cheerio parses HTML bodies across retrieved sources to discover secondary, adjacent citations not returned in top search ranks.
3. **Trend & Momentum Analytics:** Real LLM analysis calculates subtopic momentum (0–100), sentiment (-1.0 to +1.0), and emerging vs. fading narrative vectors, rendered with Recharts.
4. **Interactive Mindmap:** Draggable, pannable, zoomable hierarchical knowledge graph powered by `@xyflow/react`.
5. **Dual-Mode Synthesis & ELI5:** Long-form executive briefings with source citations, plus an instant toggle for an "Explain Like I'm 5" (ELI5) plain-language breakdown.
6. **Audio Narration (TTS):** One-click text-to-speech reading using OpenAI TTS API with browser speech synthesis fallback.
7. **Generative Topic Artwork:** Custom conceptual illustrations generated dynamically via OpenAI DALL-E 3 / Stability AI.
8. **Grounded Corpus Chat (RAG):** Conversational Q&A grounded strictly in the actually-fetched search corpus.
9. **Dual-Topic Comparison Mode:** Runs parallel searches and cross-corpus LLM synthesis to compare two technologies or topics side-by-side.
10. **Voice Input:** Dictate research topics via the Web Speech API.
11. **Document Upload:** Upload your own PDF, TXT, or Markdown notes to fold directly into the research synthesis pipeline.
12. **Dossier Export:** Export full research briefs to formatted Markdown (`.md`) or print-ready PDF.
13. **Local Library:** Past research sessions persist in `localStorage` for instant review.

---

## 🛠️ Environment Variables

Configure these in `.env` or in Replit's **Secrets** tab:

```ini
# Live Search API (Tavily recommended, or Bing / SerpAPI)
SEARCH_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx
SEARCH_PROVIDER=tavily

# LLM API (Anthropic Claude or OpenAI)
LLM_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxx
LLM_PROVIDER=anthropic

# Image Generation API (OpenAI DALL-E or Stability)
IMAGE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
IMAGE_PROVIDER=openai

# Optional: Text-to-Speech Narration
TTS_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Server Port
PORT=3001
```

*Note: You can also configure runtime API keys directly from the in-app **API Setup** modal.*

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run Both Server & Client Concurrently
```bash
npm run dev
```
- Client runs on `http://localhost:5173`
- Server runs on `http://localhost:3001`
- Requests to `/api/*` are automatically proxied from Vite to Express.

### 3. Production Build & Execution
```bash
npm run build
npm run start
```
The server serves the compiled React client directly from `client/dist`.

---

## 🌐 Deploying to Replit

1. Create a **Node.js Repl** and clone this repository.
2. Add your keys (`SEARCH_API_KEY`, `LLM_API_KEY`, `IMAGE_API_KEY`) under the **Secrets (Environment Variables)** panel.
3. The included `.replit` file runs `npm run start` and serves the app on port 3001 mapped to port 80.
4. Click **Run** in Replit to build and launch!
