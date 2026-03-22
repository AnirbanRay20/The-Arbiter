# 🛡️ The Arbiter — Forensic Intelligence

The Arbiter is a high-end, production-grade AI fact-checking and forensic intelligence application. It accepts any raw text or URL, extracts verifiable claims, searches the live internet for evidence, and evaluates the accuracy of each claim using an advanced LLM reasoning pipeline. 

Designed with a custom "Terminal Intelligence" aesthetic inspired by Bloomberg command centers and modern data-dense investigations.

---

## ✨ Key Features

- **Multi-Step Agentic Pipeline**: 
  - **Extractor**: Isolates discrete, verifiable claims from large blocks of text or scraped web articles.
  - **Searcher**: Formulates optimized search queries and retrieves real-time evidence using the Tavily Search API.
  - **Verifier**: Evaluates claims against retrieved evidence using Chain-of-Thought (CoT) and self-reflection to determine a verdict (True, False, Partially True, Unverifiable).
- **Real-Time Streaming**: Uses Server-Sent Events (SSE) to push live pipeline updates, extraction data, and verification results directly to the UI.
- **AI Text Detection**: Built-in heuristic check to determine if the provided text was likely AI-generated.
- **Bespoke UI Design**: A stunning, data-rich frontend built with React, `framer-motion` animations, and pure inline CSS (zero Tailwind dependencies), featuring animated gauges and Chain-of-Thought evidence drawers.

---

## 🛠️ Technology Stack

**Frontend (React + Vite)**
- `react`, `react-dom`
- `framer-motion` (for smooth pipeline and card animations)
- `lucide-react` & Google Material Symbols (Iconography)
- Built with a pure inline-style CSS architecture and a custom `useFactCheck` SSE hook.

**Backend (Node.js + Express)**
- `express` (SSE streaming API routes)
- `groq-sdk` (Powered by **Llama 3.3 70B Versatile** for all extraction and verification logic)
- `tavily-python` API analog via HTTP (Live web search and evidence retrieval)
- `axios` & `cheerio` (Fast URL content scraping)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- [Groq API Key](https://console.groq.com)
- [Tavily API Key](https://tavily.com/)

### 1. Backend Setup

```bash
cd fact-check-app/backend
npm install

# Create your isolated environment file
cp .env.example .env
```

Add your API Keys to the backend `.env` file:
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

Start the backend server on `http://localhost:8000`:
```bash
npm run dev
```

### 2. Frontend Setup

In a new terminal window:
```bash
cd fact-check-app/frontend
npm install
```

Start the Vite development server on `http://localhost:5173`:
```bash
npm run dev
```

---

## 🧠 How the Pipeline Works

1. **Input**: A user submits raw text or a URL. If a URL is provided, the backend scrapes the article text using `cheerio`.
2. **AI Detection**: The text is evaluated in parallel to gauge the likelihood of AI generation.
3. **Extraction**: The LLM splits the text into singular, isolated claims, ignoring opinions and rhetorical statements.
4. **Search Generation**: For each claim, an optimized search query is sent to Tavily to gather news and factual evidence.
5. **Verification**: The LLM cross-references the claim against the fetched context, generating a detailed reasoning chain, confidence score, and final verdict.
6. **Reporting**: Results are streamed to the frontend in real-time. Once complete, an aggregate Session Intelligence Report calculates total accuracy risks.

---

## 🎨 Theme & Aesthetics

The UI operates on a highly strict, data-dense "Claude/ChatGPT" lateral layout. It embraces dark, highly analytical "Surface Container" color schemes natively supported by Google's Material Design tokens.

### Color Tokens
- **True**: `#00E5FF` (Electric Cyan)
- **False**: `#FF3D57` (Crimson)
- **Partial**: `#FFAB00` (Amber)
- **Unknown/Muted**: `#556070` (Slate)

Fonts: *Space Grotesk*, *Manrope*, and *IBM Plex Mono*.

Author: 
  Anusmita Ray Chaudhuri,Anirban Ray