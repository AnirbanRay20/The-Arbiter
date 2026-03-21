
# 🧠 MASTER PROMPT — AI Fact-Check & Claim Verification Web App
> Paste this entire document into Antigravity IDE to scaffold the complete web application.

---

## 🎯 OBJECTIVE

Build a **production-grade, full-stack AI-powered Fact-Checking & Claim Verification Web App** that:
- Accepts plain text **or** a news article URL as input
- Runs a **multi-step agentic verification pipeline** (Extract → Search → Verify → Report)
- Streams real-time progress to the user
- Presents a **visually stunning, interactive Accuracy Report** with citations and confidence scores

Evaluation criteria: **Accuracy (40 pts) + Aesthetics (30 pts) + Innovation (30 pts) + Bonus (30 pts)**

---

## 🏗️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend | **Next.js (React + Tailwind CSS)** |
| Backend | **FastAPI (Python)** |
| LLM & Orchestration | **Anthropic Claude API** (`claude-sonnet-4-20250514`) via LangChain |
| Search Integration | **Tavily Search API** (fallback: SerpAPI) |
| Animations | **Framer Motion** |
| State Management | **Zustand** or React Context |
| HTTP Client | **Axios** |
| Deployment | Frontend → Vercel · Backend → Render / Railway |

---

## 📁 PROJECT STRUCTURE

```
fact-check-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx           # Text input + URL input with tabs
│   │   │   ├── PipelineProgress.jsx     # Live step-by-step progress indicator
│   │   │   ├── ClaimCard.jsx            # Per-claim result card
│   │   │   ├── AccuracyReport.jsx       # Final report summary dashboard
│   │   │   ├── ConfidenceBadge.jsx      # Visual confidence score badge
│   │   │   ├── EvidenceDrawer.jsx       # Slide-in source citations panel
│   │   │   ├── AIDetectionPanel.jsx     # Bonus: AI text detection score
│   │   │   └── Header.jsx
│   │   ├── hooks/
│   │   │   └── useFactCheck.js          # Core hook managing pipeline state + SSE
│   │   ├── services/
│   │   │   └── api.js                   # Axios calls to backend
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   ├── factcheck.py                 # POST /api/factcheck  (SSE stream)
│   │   └── aidetect.py                  # POST /api/detect-ai
│   ├── agents/
│   │   ├── claim_extractor.py           # Agent 1: Extract atomic claims
│   │   ├── evidence_retriever.py        # Agent 2: Search per claim
│   │   └── verification_engine.py       # Agent 3: Verify + classify
│   ├── services/
│   │   ├── url_scraper.py               # Fetch + parse article from URL
│   │   └── ai_text_detector.py          # Bonus: AI-generated text detection
│   ├── utils/
│   │   └── prompts.py                   # All system prompts centralised
│   ├── main.py                          # FastAPI app entry point
│   └── requirements.txt
│
├── .env.example
└── README.md
```

---

## 🔄 PIPELINE ARCHITECTURE — Multi-Step Agentic Flow

The backend runs a **sequential multi-agent pipeline** triggered by a single API call.  
Progress is **streamed to the frontend via Server-Sent Events (SSE)**.

```
STEP 1 → [EXTRACTING]   Decompose input into discrete, verifiable claims
STEP 2 → [SEARCHING]    Formulate search queries + retrieve evidence per claim
STEP 3 → [VERIFYING]    Compare each claim against evidence → classify verdict
STEP 4 → [REPORTING]    Aggregate all results → structured accuracy report
STEP 5 → [DETECTING]    (Bonus) AI-generated text probability analysis
```

Each SSE event emitted to the frontend:
```json
{
  "step": "EXTRACTING | SEARCHING | VERIFYING | REPORTING | DETECTING",
  "status": "in_progress | complete | error",
  "progress": "3/7 claims processed",
  "data": { }
}
```

---

## 🧩 BACKEND — AGENT IMPLEMENTATION

### `POST /api/factcheck`

**Request body:**
```json
{
  "inputType": "text | url",
  "content": "raw text string or article URL"
}
```
**Response:** SSE stream of pipeline events (Content-Type: `text/event-stream`)

---

### AGENT 1 — `claim_extractor.py`

Call the Claude API with the following system prompt:

```
SYSTEM PROMPT (Claim Extractor):
You are a precision claim extraction engine. Your task is to decompose the provided
text into discrete, atomic, verifiable factual statements.

Rules:
- Each claim must be self-contained and independently verifiable.
- Remove opinions, predictions, and subjective statements entirely.
- Preserve the original meaning — do not paraphrase in a way that alters the claim.
- Do NOT include vague statements (e.g., "many people believe...").
- Output ONLY a valid JSON array. No preamble, no markdown fences.

Output format:
[
  {
    "id": "C1",
    "claim": "The Eiffel Tower is located in Paris, France.",
    "context": "...exact snippet from the original text..."
  }
]
```

**User prompt:** The full input text.

---

### AGENT 2 — `evidence_retriever.py`

For **each** extracted claim, do the following in sequence:

**Step 2a — Generate a search query using Claude:**

```
SYSTEM PROMPT (Query Formulator):
You are an expert research analyst. Given a factual claim, generate the single most
effective web search query to find authoritative evidence that confirms or refutes it.

Rules:
- Prioritize queries returning news outlets, academic, government, or encyclopedia results.
- Keep the query concise (under 10 words).
- For time-sensitive claims ("current CEO", "latest data"), append the current year (2025).
- Output ONLY the raw search query string. Nothing else.
```

**Step 2b — Execute Tavily search** (top 5 results per claim).

**Step 2c — Return structured evidence:**
```json
{
  "claimId": "C1",
  "searchQuery": "Eiffel Tower location city country",
  "sources": [
    {
      "title": "Eiffel Tower — Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Eiffel_Tower",
      "snippet": "The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris...",
      "domain": "wikipedia.org",
      "credibilityScore": 0.97
    }
  ]
}
```

**Error handling:**  
If search fails or returns zero results → mark claim as `"Unverifiable"` with `"reason": "No evidence found"` and **continue the pipeline without crashing**.  
Retry once with a 2-second delay on rate-limit errors before falling back.

---

### AGENT 3 — `verification_engine.py`

For each claim + evidence bundle, call Claude with **Chain-of-Thought + Self-Reflection** prompting:

```
SYSTEM PROMPT (Verification Agent):
You are a rigorous fact-verification engine with strict epistemic standards.
Your job is to evaluate a factual claim against the provided web evidence only.

Rules:
- Base your verdict EXCLUSIVELY on the provided evidence snippets.
- Do NOT use your internal knowledge under any circumstances.
- Verdict options:
    "True"           → evidence directly confirms the claim
    "False"          → evidence directly contradicts the claim
    "Partially True" → evidence partially supports or has caveats
    "Unverifiable"   → insufficient or no relevant evidence found
- If sources conflict with each other, flag the conflict explicitly.
- For temporally sensitive claims, treat evidence older than 6 months with caution.
- You MUST reason step-by-step before giving a verdict (Chain of Thought).
- Before finalising your verdict, apply self-reflection:
  "Am I relying on my internal knowledge rather than the provided evidence?
   If yes, revise verdict to Unverifiable."

Output ONLY valid JSON. No markdown fences. No preamble.

Output format:
{
  "claimId": "C1",
  "verdict": "True | False | Partially True | Unverifiable",
  "confidenceScore": 0.0–1.0,
  "reasoning": "Step-by-step reasoning based solely on evidence...",
  "conflictingEvidence": true | false,
  "conflictNote": "Description of conflict, or null",
  "temporallySensitive": true | false,
  "citations": [
    { "url": "...", "title": "...", "relevantSnippet": "..." }
  ]
}
```

**User prompt format:**
```
CLAIM: {claim text}

EVIDENCE:
[1] Source: {title} ({url})
Snippet: {snippet}

[2] Source: {title} ({url})
Snippet: {snippet}

Now reason step-by-step and evaluate the claim against this evidence only.
Before finalising, ask yourself: am I using internal knowledge? If yes, mark Unverifiable.
```

---

### AGENT 4 — `ai_text_detector.py` *(Bonus — 10 pts)*

Call Claude with a forensic self-reflective prompt:

```
SYSTEM PROMPT (AI Text Detector):
You are an expert linguist and AI forensics analyst. Analyse the provided text and
determine the probability that it was generated by an LLM rather than a human.

Analyse for these signals:
- Syntactic uniformity and absence of stylistic quirks
- Absence of personal anecdote, emotion, or subjectivity
- Overly balanced "on one hand / on the other hand" structure
- Unnaturally consistent sentence length and rhythm
- Absence of typos, colloquialisms, or cultural markers
- Repetition of transitional phrases typical of LLMs (e.g., "Furthermore", "It is worth noting")

Output ONLY valid JSON. No markdown fences.

{
  "aiProbability": 0.0–1.0,
  "humanProbability": 0.0–1.0,
  "signals": ["list of detected signals..."],
  "summary": "One paragraph explanation of the determination."
}
```

---

### SERVICE — `url_scraper.py`

- Accept a URL input.
- Use `httpx` + `BeautifulSoup` to fetch and extract article body text.
- Strip `<nav>`, `<footer>`, `<script>`, `<style>`, ads, and sidebar content.
- Return clean plain text.
- **Graceful degradation:** If scraping fails → emit SSE error event `"Unable to extract content from URL. Please paste the text directly."` and halt.

---

## 🎨 FRONTEND — UI/UX IMPLEMENTATION

### Aesthetic Direction

**Theme:** Dark Intelligence — mission-control meets investigative journalism.

| Token | Value | Usage |
|---|---|---|
| Background | `#0D0F14` | Page base with noise texture overlay |
| Accent / True | `#00E5FF` (Electric Cyan) | Active states, True verdict |
| Warning / Partial | `#FFAB00` (Amber) | Partially True verdict |
| Danger / False | `#FF3D57` (Crimson) | False verdict |
| Muted / Unknown | `#8892A4` (Slate) | Unverifiable verdict |
| Surface | `rgba(255,255,255,0.04)` | Glassmorphism card backgrounds |
| Font (Display) | `IBM Plex Mono` | Headers, verdict labels, monospaced data |
| Font (Body) | `DM Sans` | Descriptions, reasoning text |

**Card style:** Glassmorphism with `backdrop-filter: blur(12px)`, subtle border glow on hover.  
**Animations:** Framer Motion — staggered card appearance, live pipeline dots, animated confidence bars, smooth drawer slide-ins.

---

### COMPONENT: `InputPanel.jsx`

- Two tabs: **"Paste Text"** · **"Enter URL"**
- **Text tab:** Large textarea (min 8 rows), live character counter, animated placeholder cycling through example claims
- **URL tab:** Input with live format validation feedback (green tick / red cross)
- Primary CTA: **`Run Fact Check →`** — disabled during processing, shows spinner
- On submit: hide input panel, show `PipelineProgress`

---

### COMPONENT: `PipelineProgress.jsx`

Horizontal stepper shown immediately after submission:

```
[ ✓ Extracting Claims ] → [ ● Searching Evidence (3/7) ] → [ ◌ Verifying ] → [ ◌ Reporting ]
```

- **Completed** steps: checkmark icon, muted cyan
- **Active** step: pulsing glow animation, live count label (e.g., `Searching Evidence (3/7 claims)`)
- **Pending** steps: hollow circle, slate color
- **Error** step: red X icon with error message inline

---

### COMPONENT: `ClaimCard.jsx`

One animated card per claim. Appears via staggered fade-in as results stream in.

| Element | Details |
|---|---|
| Claim text | Bold, mapped to highlighted span in original input above |
| Verdict badge | Color-coded pill: `True` / `False` / `Partially True` / `Unverifiable` |
| Confidence score | Animated fill bar (0–100%) with percentage label |
| Reasoning | Collapsible accordion showing full Chain-of-Thought reasoning |
| Citations | Expandable list of source links with domain favicon, title, and snippet |
| ⚠️ Conflict flag | Amber banner: `"Conflicting sources found"` if `conflictingEvidence: true` |
| 🕐 Temporal flag | Slate banner: `"Time-sensitive claim — evidence may be outdated"` if applicable |

---

### COMPONENT: `AccuracyReport.jsx`

Final summary rendered **above** the claim cards after all claims are processed:

- **Overall Accuracy Score:** Radial gauge / donut chart — percentage of True + Partially True claims
- **Verdict Breakdown:** Horizontal stacked bar chart — True / False / Partially True / Unverifiable counts
- **Risk Level Label:** Computed dynamically:
  - ≥ 80% True → `🟢 Low Risk`
  - 50–79% True → `🟡 Medium Risk`
  - < 50% True → `🔴 High Risk`
  - Majority Unverifiable → `⚪ Insufficient Evidence`
- **Export Button:** Download full report as JSON

---

### COMPONENT: `AIDetectionPanel.jsx` *(Bonus)*

Below the accuracy report:

- Large semicircular probability meter: **`AI-Generated Probability: 73%`**
- Detected signals displayed as pill tags (e.g., `Uniform sentence length`, `No personal anecdote`)
- Summary paragraph with forensic explanation
- Color gradient: Green (Human) → Red (AI-Generated)

---

### COMPONENT: `EvidenceDrawer.jsx`

Slide-in panel from the right on "View All Sources" click:

- Full list of sources with domain favicon, title, relevance score badge, and snippet excerpt
- Color-coded relevance badge (cyan = high, amber = medium, slate = low)
- Source URL opens in new tab
- Close on overlay click or Escape key

---

## 🔌 API CONTRACTS

### Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/factcheck` | Main pipeline — SSE stream |
| `POST` | `/api/detect-ai` | AI text detection only |
| `GET` | `/api/health` | Health check |

### Environment Variables

```env
# backend/.env
ANTHROPIC_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
PORT=8000

# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🛡️ ERROR HANDLING & ROBUSTNESS

| Scenario | Behaviour |
|---|---|
| Search API rate limit | Retry once after 2s; if still failing → mark claim `Unverifiable` |
| Search returns 0 results | Mark claim `Unverifiable`, reason: `"No evidence found"`, continue |
| URL scraping fails | SSE error event → prompt user to paste text directly |
| Claude API timeout | Mark affected claim as `error`, continue remaining claims |
| Conflicting sources | Surface `⚠️ conflictNote` in UI — never silently resolve |
| Temporally sensitive claim | Show `🕐` disclaimer: `"Evidence may be outdated"` |
| All claims unverifiable | Show `⚪ Insufficient Evidence` risk level in report |

---

## 🚀 SETUP & RUN

```bash
# 1. Clone
git clone <repo-url> && cd fact-check-app

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env       # Add API keys
uvicorn main:app --reload  # Starts on port 8000

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_BASE_URL
npm run dev                  # Starts on port 3000
```

---

## 📋 EVALUATION CHECKLIST

### ✅ Accuracy (40 pts)
- [ ] Claims are atomic, self-contained, and context-preserving
- [ ] Search queries are intelligently formulated per claim
- [ ] Verification is evidence-only — no internal LLM knowledge used
- [ ] Confidence scores reflect actual evidence strength
- [ ] Credibility of sources considered in scoring

### ✅ Aesthetics (30 pts)
- [ ] Original text shown with claims highlighted and mapped visually
- [ ] Live pipeline progress stepper with per-step counts
- [ ] Claim cards are modern, clean, and non-technical-user-friendly
- [ ] Smooth staggered animations on card appearance
- [ ] Final accuracy report includes chart visualisations

### ✅ Approach & Innovation (30 pts)
- [ ] Pipeline recovers from failed searches without crashing
- [ ] Conflicting sources flagged explicitly with ⚠️ note
- [ ] Chain-of-Thought reasoning displayed per claim
- [ ] Temporally sensitive claims flagged with 🕐 caveat
- [ ] Self-reflection appended to all verification prompts
- [ ] Multi-pass: query formulation → search → evidence-based verdict

### ⭐ Bonus (30 pts available)
- [ ] AI Text Detection panel with probability score + signal breakdown (10 pts)
- [ ] AI Media / Deepfake detection for embedded images/audio (20 pts)

---

## 💡 PROMPT ENGINEERING PRINCIPLES (Applied Throughout)

1. **Chain-of-Thought (CoT):** All verification calls require step-by-step reasoning before verdict.
2. **Self-Reflection:** Verification agent self-questions: *"Am I using internal knowledge?"* — if yes, revises to `Unverifiable`.
3. **Strict Output Format:** All Claude calls output JSON only — no preamble, no markdown fences — enabling safe `JSON.parse()` without sanitisation.
4. **Evidence Isolation:** Verification prompt explicitly forbids using internal knowledge; evidence is the only admissible input.
5. **Temporal Awareness:** Query formulator appends current year for time-sensitive claims; verifier flags stale evidence.

---

*End of Master Prompt — paste this full document into Antigravity IDE.*
