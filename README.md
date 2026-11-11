# Shop-Floor Supervisor AI Copilot

A grounded RAG assistant built for manufacturing shop-floor supervisors (**Kaveri Precision Components — Hosur Plant**). Supervisors can type or speak questions in **English, Tamil, or Hindi** and receive concise, verified answers strictly from active plant SOPs and machine maintenance manuals—complete with **document numbers, revision codes, page numbers, section citations, and safety warnings**.

---

## Key Capabilities

- **Strictly Grounded Answers:** Responses come exclusively from ingested plant PDFs stored in PostgreSQL (`pgvector`). If an answer is missing or out of scope, the assistant informs the supervisor clearly instead of guessing.
- **Active Revision Control:** Automatically excludes superseded document revisions (`QC-SOP-014 Rev 03`) so supervisors only receive guidance from current active revisions (`Rev 04`).
- **Safety Warning Preservation:** Critical warnings and cautions (e.g., LOTO isolation, hydraulic depressurization) are extracted and surfaced in prominent callout banners before procedural steps.
- **Multilingual Voice & Text (`en-IN`, `ta-IN`, `hi-IN`):** Supervisors can speak or type in English, Tamil, or Hindi. The system translates search intent to English for document retrieval and generates the answer in the selected language while keeping document IDs, machine models, alarm codes, and engineering units intact.
- **Read-Aloud Support:** Built-in browser text-to-speech reads safety warnings first, followed by the answer, for hands-free shop-floor use.
- **Security & Observability:** Includes prompt-injection guardrails, sliding-window rate limiting, HTTP security headers, and clean 5-stage pipeline logging traced by request ID.

---

## Plant Documents Covered

| Document Number | Title | Revision | Status |
|---|---|---|---|
| `SAF-SOP-003` | Lockout / Tagout (LOTO) - Safety Procedure | `05` | `ACTIVE` |
| `QC-SOP-014` | Incoming Material Inspection - Standard Operating Procedure | `04` | `ACTIVE` *(supersedes Rev `03`)* |
| `QC-SOP-014` | Incoming Material Inspection - Standard Operating Procedure | `03` | `SUPERSEDED` *(excluded from search)* |
| `MNT-MAN-CNC-02` | Preventive Maintenance Manual - TX-200 CNC Turning Centre | `02` | `ACTIVE` |

---

## How the Application Answers Questions

```text
Supervisor Question (Text / Voice in EN, TA, HI)
   │
   ▼
[1] AI Classifier & Guardrails (Gemini Call 1)
   ├── Prompt injection detected ───────────────► Blocked safely
   ├── GENERAL (greetings / "who are you?") ───► Direct conversational reply (RAG skipped)
   ├── OUT_OF_SCOPE (general knowledge) ────────► Polite scope reminder (RAG skipped)
   └── Plant Scope (SAFETY / QUALITY / MACHINE / MAINTENANCE / COMBINED)
          │  Generates concise English search_query
          ▼
[2] Vector Retrieval (PostgreSQL + pgvector)
   │  Filters strictly to status = 'ACTIVE' and relevant document_types
   │  (Retries across all active documents if typed filter returns weak matches)
   ▼
[3] Evidence & Similarity Validation (MIN_SIMILARITY=0.8)
   ├── Best similarity < 0.8 ───────────────────► Safe "not enough information" fallback
   └── Sufficient evidence
          │
          ▼
[4] Grounded Answer Generation (Gemini Call 2)
   │  Enforces structured JSON (answer, warnings, used_chunk_ids)
   │  Outputs in supervisor's selected language (EN / TA / HI)
   ▼
[5] Final Response
      Validated answer + prominent safety warnings + exact citations (Doc, Rev, Page, Section)
```

> **Note on Similarity Threshold (`MIN_SIMILARITY=0.8`, fallback `0.5`):** `backend/.env.example` configures `MIN_SIMILARITY=0.8` to enforce strict relevance before passing retrieved chunks to the answer generator (`backend/app/core/config.py` uses `0.5` as its fallback default when `MIN_SIMILARITY` is unset). Because cosine similarity scores depend on the embedding model and query phrasing, you can adjust `MIN_SIMILARITY` in `backend/.env` if your documents or multilingual queries require a looser or tighter threshold.

### Multilingual Workflow (English, Tamil, Hindi)
All plant SOPs and manuals are stored in English. When a supervisor selects **Tamil (`ta-IN`)** or **Hindi (`hi-IN`)** in the chat bar (or uses voice input):
1. **Query Translation:** The classifier converts the supervisor's question into concise English technical keywords (`search_query`) so `pgvector` accurately matches the English PDF chunks.
2. **Localized Answer:** The answer generator writes the explanation, steps, and safety instructions in natural Tamil or Hindi.
3. **Technical Integrity:** Document numbers (`SAF-SOP-003`, `QC-SOP-014`, `MNT-MAN-CNC-02`), revision numbers (`Rev 04`), machine names (`TX-200`), alarm codes (`AL-104`), and measurements (`6 - 8 %`, `0 bar`, `+/- 0.050 mm`) remain in alphanumeric English so nothing is lost in translation.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, `react-markdown`, Browser Web Speech API (`SpeechRecognition` & `speechSynthesis`)
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, `psycopg`, `pgvector`, PyMuPDF (`pymupdf`)
- **Database:** PostgreSQL 16+ with `pgvector` extension (tested with Neon.tech)
- **AI Models:** Google Gemini via `google-genai` SDK (`gemini-2.5-flash` for classification, vision OCR fallback, and grounded answering; `gemini-embedding-001` for 768-dim vector embeddings)

---

## Setup and Installation

### Prerequisites
- **Python 3.11+** (tested on Python 3.14)
- **Node.js 18+** and **npm**
- **PostgreSQL 16+** with the `pgvector` extension enabled (e.g., a free [Neon](https://neon.tech) database or local PostgreSQL instance)
- **Google Gemini API Key** from Google AI Studio

---

### 1. Clone the Repository
```bash
git clone https://github.com/Inzimamul-haq/Biztel-assignment.git
cd Biztel-assignment
```

### 2. Install Dependencies

**Backend (Python virtual environment):**
```bash
python -m venv .venv
```
Activate the virtual environment:
- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **macOS / Linux:**
  ```bash
  source .venv/bin/activate
  ```
Install Python packages:
```bash
pip install -r backend/requirements.txt
```

**Frontend (Node.js):**
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Copy the example files and fill in your credentials. **Never commit `.env` files or real API keys.**

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
```
Update `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
DIRECT_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIM=768
JWT_SECRET=replace-with-a-random-string-at-least-32-chars
JWT_EXPIRE_MINUTES=720
CORS_ORIGINS=http://localhost:3000
TOP_K=5
MIN_SIMILARITY=0.8
CHUNK_TOKENS=650
CHUNK_OVERLAP_TOKENS=85
MAX_QUESTION_CHARS=500
```
*(Note: If using Neon, `DATABASE_URL` can be the pooled connection string and `DIRECT_URL` the unpooled connection string for schema creation. For local PostgreSQL, both can be identical.)*

**Frontend (`frontend/.env`):**
```bash
cp frontend/.env.example frontend/.env
```
Ensure `frontend/.env` points to the FastAPI backend:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Initialize Database, Seed Demo User & Ingest PDFs

Run the following scripts from inside the `backend/` directory with your virtual environment active:

```bash
cd backend

# 1. Create the pgvector extension, 5 tables, and HNSW vector index
python -m scripts.init_db --verify

# 2. Seed the demo supervisor account (for local demo/evaluation only)
python -m scripts.seed_demo_user

# 3. Extract, chunk, embed, and store the 4 plant PDFs
python -m scripts.ingest_documents --spot-check
```
- Already active or superseded revisions are skipped on re-runs, preventing duplicate chunks.
- To rebuild chunks after modifying chunking rules, pass `--reingest`.

### 5. Start the Application (Localhost)

Open two terminals:

**Terminal 1 — Start the FastAPI Backend (`http://localhost:8000`):**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*(Verify health check at `http://localhost:8000/api/health`.)*

**Terminal 2 — Start the Next.js Frontend (`http://localhost:3000`):**
```bash
cd frontend
npm run dev
```

### 6. Local Network / Mobile Access (Same Wi-Fi)

To demonstrate the application on a phone over the same Wi-Fi network (for example, if your laptop's LAN IP is `192.168.1.5`):

> **Important:** On a phone, `localhost` points to the phone itself, not your laptop. Both the frontend API URL and backend CORS configuration must use your laptop's LAN IP.

1. **Find your laptop's LAN IP** (`ipconfig` on Windows or `ifconfig`/`ip addr` on macOS/Linux), e.g. `192.168.1.5`.
2. **Allow the phone's frontend origin in `backend/.env`:**
   ```env
   CORS_ORIGINS=http://localhost:3000,http://192.168.1.5:3000
   ```
3. **Set the backend LAN URL in `frontend/.env`:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://192.168.1.5:8000
   ```
4. **Run the backend bound to all interfaces (`0.0.0.0`):**
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
5. **Run the frontend bound to the LAN interface:**
   ```bash
   cd frontend
   npm run dev -- -H 0.0.0.0 -p 3000
   ```
6. **Open on your phone's browser:**
   ```text
   Frontend: http://192.168.1.5:3000
   Backend:  http://192.168.1.5:8000
   ```
   *(Ensure Windows Firewall / macOS Firewall permits incoming TCP traffic on ports `3000` and `8000`. Note: Browser security restricts Web Speech API microphone access to HTTPS or `localhost`, so over plain HTTP on LAN the text chat and read-aloud work normally while the mic button hides gracefully if blocked by the browser.)*

### 7. Login and Start Chatting
1. Open **`http://localhost:3000`** (or **`http://<YOUR_LAN_IP>:3000`** on mobile).
2. Click **"Use demo supervisor account"** or sign in with the seeded demo account (`supervisor@shopfloor.local` / `Shopfloor123`), or register a new account at `/signup`.
   > **Security Notice:** `supervisor@shopfloor.local` / `Shopfloor123` are **demo-only credentials** intended strictly for local evaluation with a disposable seed database. Change or remove the demo seed credentials, disable the pre-fill button, and rotate `JWT_SECRET` before any production or public deployment.
3. Ask manufacturing questions by typing, selecting a suggested chip, or using voice input.

---

## Five Self-Created Questions and Application Outputs

Below are five self-created questions tested against the application, showing verbatim outputs, safety warnings, and citations from the four ingested PDFs—including an unanswerable question.

### 1. Hydraulic Hose Replacement Precautions & Post-Installation Checks (Answered with Warning)
- **Question:** *"The hydraulic hose on the TX-200 CNC machine needs replacement. What precautions must be taken before loosening the hose fittings, and what should be verified after installing the new hose?"*
- **Safety Warning:** `Never open the electrical cabinet or hydraulic circuit on a running or energised machine.`
- **Application Answer:**
  > Before loosening the hydraulic hose fittings on the TX-200, isolate the machine per SAF-SOP-003, including releasing stored hydraulic pressure, and confirm the panel pressure gauge reads zero. Place a drip tray and loosen fittings slowly.
  >
  > After installation:
  > 1. Fit a new hose of the same rating and tighten fittings.
  > 2. Remove locks as per SAF-SOP-003.
  > 3. Start the hydraulic unit and confirm pressure returns to 3.5 - 4.0 MPa with no leaks.
- **Sources:**
  - `MNT-MAN-CNC-02` | Rev `02` | Page `1` | `§ 2. Safety First`
  - `MNT-MAN-CNC-02` | Rev `02` | Page `2` | `§ 7. Replacing a Hydraulic Hose`

---

### 2. Acceptable Hydraulic Pressure Range & Inspection Instrument (Answered with Warning)
- **Question:** *"During routine maintenance, what is the acceptable hydraulic pressure range for the TX-200, and which instrument should the operator use to check it?"*
- **Safety Warning:** `Never open the electrical cabinet or hydraulic circuit on a running or energised machine.`
- **Application Answer:**
  > The acceptable hydraulic system pressure range for the TX-200 is 3.5 - 4.0 MPa (35 - 40 bar). The operator should use the panel pressure gauge to check it.
- **Sources:**
  - `MNT-MAN-CNC-02` | Rev `02` | Page `1` | `§ 3. Normal Operating Parameters`
  - `MNT-MAN-CNC-02` | Rev `02` | Page `1` | `§ 2. Safety First`

---

### 3. BH-220 Bore Diameter Inspection Method & Grounded Honesty (Answered)
- **Question:** *"For incoming BH-220 bearing housings, what inspection method is required for the bore diameter, and why can't a digital caliper be used for this measurement?"*
- **Application Answer:**
  > For incoming BH-220 bearing housings, the bore diameter must be inspected using a **Coordinate Measuring Machine (CMM)**, as it is marked as a critical dimension. The available excerpts do not state why a digital caliper cannot be used, other than specifying that dimensions marked CMM must be checked on the CMM.
- **Sources:**
  - `QC-SOP-014` | Rev `04` | Page `2` | `§ 6. Inspection Dimensions - BH-220 Bearing Housing (Machined, from sub-contractor)`
  - `QC-SOP-014` | Rev `04` | Page `2` | `§ 5. Procedure`

---

### 4. Machine Alarm Troubleshooting (Answered)
- **Question:** *"The machine is showing alarm AL-104. What does it mean and what should the operator do?"*
- **Application Answer:**
  > Alarm AL-104 means "Way lube oil level low". Operator action:
  > 1. Top up with ISO VG 68 oil to the MAX mark.
  > 2. Press RESET. The machine can continue after reset.
- **Source:** `MNT-MAN-CNC-02` | Rev `02` | Page `2` | `§ 6. Common Alarms`

---

### 5. Missing Information in Uploaded PDFs (Unanswerable)
- **Question:** *"What is the use of BH-220?"*
- **Status:** `Not enough information` (`INSUFFICIENT_EVIDENCE`)
- **Application Answer:**
  > I couldn't find the requested information in the available documents. Please provide the relevant document or contact the concerned department.
- **Source:** None (`[]`) — the active documents cover BH-220 incoming inspection tolerances, not its mechanical assembly purpose, so the assistant refuses to invent an answer.

---

## Demo Video

- **Walkthrough Recording (Login, Grounded Q&A, Sources, Multilingual & Mobile Demo):** [Add Google Drive or Loom Demo Video Link Here](#)

---

## Screenshots

### Answered Questions & Source Citations

**1. Coolant Concentration (`MNT-MAN-CNC-02`, Page 1)**
![Coolant concentration answer and source card](AI-samples/answered/1.png)

**2. Alarm `AL-104` Troubleshooting (`MNT-MAN-CNC-02`, Page 2)**
![Alarm AL-104 answer and source card](AI-samples/answered/2.png)

**3. BH-220 Tolerance Specification (`QC-SOP-014` Rev 04, Page 2)**
![BH-220 tolerance answer and source card](AI-samples/answered/3.png)

---

### Unanswerable & Out-of-Scope Handling

**1. Out-of-Scope General Knowledge & Missing Document Information**
![Out-of-scope and insufficient evidence handling](AI-samples/unanswered/1.png)

**2. Additional Unanswered / Boundary Case**
![Additional unanswered case](AI-samples/unanswered/2.png)

---

### Multilingual Support (Hindi & Tamil)

**1. Hindi (`hi-IN`) Safety & LOTO Response with Preserved Codes and Safety Warning**
![Hindi response with safety warning and citations](AI-samples/language/1.png)

**2. Tamil (`ta-IN`) Safety & LOTO Response with Preserved Codes and Safety Warning**
![Tamil response with safety warning and citations](AI-samples/language/2.png)

---

## Project Structure

```text
├── AI-samples/                      # Application screenshots (answered, unanswered, language)
├── backend/
│   ├── app/
│   │   ├── core/                    # Settings (.env), database engines, JWT/bcrypt, logging, rate limit
│   │   ├── shared/ai/               # Gemini client (retry/timeouts, structured schema) & embeddings
│   │   └── features/
│   │       ├── auth/                # Login, signup, current user endpoints
│   │       ├── chat/                # Classifier, retrieval, evidence check, answer generator, guardrails
│   │       ├── conversations/       # Chat history and message persistence
│   │       ├── documents/           # Document & chunk models, pgvector repository
│   │       └── ingestion/           # PyMuPDF extractor, OCR fallback, cleaner, chunker, processor
│   ├── scripts/                     # init_db.py, seed_demo_user.py, ingest_documents.py
│   ├── storage/documents/           # 4 plant PDFs + manifest.json
│   └── tests/                       # Unit tests for chunker, retrieval, guardrails, and pipeline
└── frontend/
    └── src/
        ├── app/                     # Next.js App Router pages (/login, /signup, /chat)
        ├── features/                # Auth, chat, conversations, and Web Speech voice modules
        └── shared/                  # Typed API client, icons, header, modals, error boundaries
```

---

## Running Tests & Checks

**Backend Unit Tests:**
```bash
pytest backend/tests
```

**Frontend Type Check:**
```bash
cd frontend
npm run lint
```
