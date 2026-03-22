# 🛡️ The Arbiter — Forensic Intelligence

> *"Our system doesn't just verify facts — it explains them with real-world evidence, handles conflicting sources, and provides a complete accuracy report."*

The Arbiter is a high-end, production-grade AI fact-checking and forensic intelligence application. It accepts any raw text or URL, extracts verifiable claims, searches the live internet for evidence, and evaluates the accuracy of each claim using an advanced LLM reasoning pipeline.

Designed with a custom **Terminal Intelligence** aesthetic inspired by Bloomberg command centers and modern data-dense investigations.

---

## ✨ Key Features

- **Multi-Step Agentic Pipeline**
  - **Extractor** — Isolates discrete, verifiable atomic claims from large blocks of text or scraped web articles. Handles questions, converts them to verifiable statements.
  - **Searcher** — Formulates optimized search queries and retrieves real-time evidence using the Tavily Search API.
  - **Verifier** — Evaluates claims against retrieved evidence using Chain-of-Thought (CoT) and self-reflection to determine a verdict: `True`, `False`, `Partially True`, or `Unverifiable`.

- **Real-Time Streaming** — Uses Server-Sent Events (SSE) to push live pipeline updates, extraction data, and verification results directly to the UI.

- **AI Text Detection** — Built-in forensic check to determine if the provided text was likely AI-generated. Detects syntactic uniformity, absence of personal anecdote, transitional phrase patterns, and more.

- **AI Image / Deepfake Detection** — Upload any image or paste a URL. The system uses Groq's vision model to analyze for AI generation signals: plastic skin, distorted hands, garbled text, inconsistent lighting.

- **Conflict Detection** — Automatically flags when retrieved sources disagree with each other, marking claims as `⚠️ Conflicting Sources`.

- **Temporal Awareness** — Time-sensitive claims are flagged with `🕐 Time-sensitive` and all verdicts are stamped `Verified as of [Month Year]`.

- **Session Intelligence Report** — Aggregate accuracy gauge, risk level (Low / Medium / High), and breakdown of True / Partial / False / Unknown claims with JSON + PNG export.

- **Explainability Flow** — Animated `Input → Extract → Search → Verify → Report` pipeline diagram showing exactly which stage is active in real time.

- **Bespoke UI Design** — Data-rich frontend built with React, Framer Motion animations, and pure inline CSS (zero Tailwind dependencies), featuring animated gauges, Chain-of-Thought evidence drawers, and an orange/cyan glowing scrollbar system.

---

## 🛠️ Technology Stack

### Frontend (React + Vite)
| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `framer-motion` | Pipeline and card animations |
| `lucide-react` | Icon library |
| Google Material Symbols | Extended iconography |
| Pure inline CSS | Zero Tailwind — full design control |

### Backend (Node.js + Express)
| Package | Purpose |
|---|---|
| `express` | SSE streaming API routes |
| `groq-sdk` | Llama 3.3 70B — extraction, verification, AI detection |
| `tavily` (via HTTP) | Live web search and evidence retrieval |
| `axios` + `cheerio` | Fast URL content scraping |
| `multer` | Image upload handling |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- [Groq API Key](https://console.groq.com)
- [Tavily API Key](https://app.tavily.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/AnirbanRay20/the-arbiter.git
cd the-arbiter
```

---

### 2. Backend Setup

```bash
cd fact-check-app/backend
npm install
```

Create your `.env` file:

```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

Start the backend server on `http://localhost:8000`:

```bash
node server.js
```

Health check:
```bash
curl http://localhost:8000/api/health
# → {"status":"healthy"}
```

---

### 3. Frontend Setup

In a new terminal:

```bash
cd fact-check-app/frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧠 How the Pipeline Works

```
User Input (Text or URL)
        │
        ▼
┌───────────────┐
│  URL Scraper  │  cheerio scrapes article text if URL provided
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ AI Detection  │  Parallel: is this text AI-generated?
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Extractor   │  LLM splits text into atomic, verifiable claims
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Searcher   │  Tavily fetches real-time web evidence per claim
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Verifier    │  LLM cross-references claim vs evidence (CoT + self-reflection)
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    Report     │  Accuracy score, risk level, conflict flags, citations
└───────────────┘
        │
   Streamed live via SSE to frontend
```

---

## 🎨 Theme & Design System

The UI operates on a highly strict, data-dense **Terminal Intelligence** dark theme.

### Color Tokens
| Token | Hex | Usage |
|---|---|---|
| True / Accent | `#00E5FF` | Verified claims, cyan glow |
| False | `#FF3D57` | False claims, high risk |
| Partially True | `#FFAB00` | Conflicting, uncertain |
| Muted | `#556070` | Secondary text, unknown |
| Background | `#121317` | App background |
| Surface | `#161820` | Cards, panels |
| Sidebar | `#1a1b20` | Navigation |

### Typography
- **Space Grotesk** — Headings, labels, buttons
- **Manrope** — Body text, claim content
- **IBM Plex Mono** — Code, metadata, pipeline labels

---

## 📁 Project Structure

```
fact-check-app/
├── backend/
│   ├── agents/
│   │   ├── claimExtractor.js       # Atomic claim extraction
│   │   ├── evidenceRetriever.js    # Tavily search + query formulation
│   │   └── verificationEngine.js  # CoT verdict engine
│   ├── routes/
│   │   ├── factcheck.js            # POST /api/factcheck (SSE)
│   │   ├── aidetect.js             # POST /api/detect-ai
│   │   └── imagecheck.js          # POST /api/analyze-image
│   ├── services/
│   │   ├── aiTextDetector.js       # LLM text forensics
│   │   ├── imageAnalyzer.js        # Vision model image forensics
│   │   └── urlScraper.js           # Cheerio article scraper
│   ├── utils/
│   │   └── prompts.js              # All LLM system prompts
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AccuracyReport.jsx
│       │   ├── AIDetectionPanel.jsx
│       │   ├── ClaimCard.jsx
│       │   ├── CorrectAnswerPanel.jsx
│       │   ├── EvidenceDrawer.jsx
│       │   ├── ExplainabilityFlow.jsx
│       │   ├── HistoryView.jsx
│       │   ├── ImageAnalysisPanel.jsx
│       │   ├── PipelineProgress.jsx
│       │   ├── Sidebar.jsx
│       │   ├── SuggestionsView.jsx
│       │   ├── SupportView.jsx
│       │   └── TopBar.jsx
│       ├── hooks/
│       │   └── useFactCheck.js     # SSE pipeline state manager
│       └── services/
│           └── api.js
```

---

## 👥 Authors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/AnirbanRay20">
        <img src="https://github.com/AnirbanRay20.png" width="80" style="border-radius:50%" /><br/>
        <b>Anirban Ray</b>
      </a><br/>
      <sub>Lead Developer & Architect</sub><br/>
      <sub>Backend pipeline, agents, infrastructure</sub><br/>
      <a href="mailto:anirbanmark1429@gmail.com">📧 anirbanmark1429@gmail.com</a><br/>
      <a href="https://github.com/AnirbanRay20">🐙 github.com/AnirbanRay20</a>
    </td>
    <td align="center">
      <a href="https://github.com/anus05">
        <img src="https://github.com/anus05.png" width="80" style="border-radius:50%" /><br/>
        <b>Anusmita Ray Chaudhuri</b>
      </a><br/>
      <sub>UI/UX Designer & Frontend Developer</sub><br/>
      <sub>Dashboard design, component system, UX</sub><br/>
      <a href="mailto:titirray05@gmail.com">📧 titirray05@gmail.com</a><br/>
      <a href="https://github.com/anus05">🐙 github.com/anus05</a>
    </td>
  </tr>
</table>

---

## 📄 License

MIT License — Built for the **Forensic Intelligence Hackathon 2026**

---

<div align="center">
  <sub>Built with ⚡ by Anirban Ray & Anusmita Ray Chaudhuri</sub>
</div>
