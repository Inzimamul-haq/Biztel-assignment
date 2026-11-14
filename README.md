# Shop-Floor Supervisor AI Copilot

An AI copilot for manufacturing supervisors at a fictional plant (**Kaveri Precision Components, Hosur**). A supervisor logs in, types or speaks a question in **English, Tamil or Hindi**, and gets a short answer taken only from the plant's PDFs, with the **document, revision, page and section** it came from. If the documents don't contain the answer, the app says so instead of guessing.

The four documents it covers: `SAF-SOP-003` (Lockout/Tagout), `QC-SOP-014` Rev 04 (Incoming Material Inspection), `QC-SOP-014` Rev 03 (superseded, excluded from search) and `MNT-MAN-CNC-02` (TX-200 CNC Preventive Maintenance).

---

## How it answers a question

1. The question is checked by Gemini: prompt injection is blocked, greetings and general-knowledge questions get a short reply, and plant questions continue.
2. For Tamil and Hindi, the question is translated into English search keywords, because the PDFs are in English.
3. `pgvector` searches only the **active** documents.
4. If the best match is below the similarity threshold (`MIN_SIMILARITY`, 0.8), the app replies that it couldn't find the information.
5. Otherwise Gemini writes the answer in the selected language, with safety warnings and citations. Document numbers, machine names, alarm codes and measurements stay in English.

**Tech stack:** Next.js 15 + TypeScript, FastAPI, PostgreSQL with `pgvector` (Neon), Google Gemini (`gemini-2.5-flash`, `gemini-embedding-001`).

---

## Setup and installation

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- PostgreSQL 16+ with the `pgvector` extension (for example a free [Neon](https://neon.tech) database)
- A Google Gemini API key from Google AI Studio

### 1. Clone the repository

```bash
git clone https://github.com/Inzimamul-haq/Biztel-assignment.git
cd Biztel-assignment
```

### 2. Install dependencies

**Backend:**

```bash
python -m venv .venv
```

Activate it:

- Windows (PowerShell): `.\.venv\Scripts\Activate.ps1`
- macOS / Linux: `source .venv/bin/activate`

```bash
pip install -r backend/requirements.txt
```

**Frontend:**

```bash
cd frontend
npm install
cd ..
```

### 3. Configure environment variables

Never commit `.env` files or real API keys.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
DIRECT_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
GEMINI_CHAT_MODEL=gemini-3.5-flash
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

With Neon, use the pooled connection string for `DATABASE_URL` and the unpooled one for `DIRECT_URL`. For a local PostgreSQL, both can be the same.

`MIN_SIMILARITY` is the relevance threshold. Similarity scores depend on the embedding model and the wording of the query, so adjust it if your documents or languages need a looser or tighter setting.

Make sure `frontend/.env` points to the backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Seed the database and ingest the PDFs

Run these from the `backend/` folder with the virtual environment active:

```bash
cd backend

# Create the pgvector extension, tables and vector index
python -m scripts.init_db --verify

# Create the demo supervisor account (local demo only)
python -m scripts.seed_demo_user

# Extract, chunk, embed and store the 4 PDFs
python -m scripts.ingest_documents --spot-check
```

Re-running is safe: documents already ingested are skipped. Add `--reingest` to rebuild the chunks.

### 5. Start the app

**Terminal 1, backend (`http://localhost:8000`):**

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: `http://localhost:8000/api/health`

**Terminal 2, frontend (`http://localhost:3000`):**

```bash
cd frontend
npm run dev
```

### 6. Open it from your phone (same Wi-Fi)

On a phone, `localhost` means the phone itself, so the frontend and backend must use your laptop's LAN IP (for example `192.168.1.5`, found with `ipconfig` or `ifconfig`).

1. In `backend/.env`, allow the phone's origin:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://192.168.1.5:3000
   ```
2. In `frontend/.env`, point to the backend's LAN address:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://192.168.1.5:8000
   ```
3. Start the backend with `--host 0.0.0.0` (as above) and the frontend with:
   ```bash
   npm run dev -- -H 0.0.0.0 -p 3000
   ```
4. Allow ports `3000` and `8000` through your firewall.
5. On your phone, open `http://192.168.1.5:3000`.

Browsers only allow microphone access on HTTPS or `localhost`, so over plain HTTP on the LAN, typing and read-aloud work and the mic button is hidden.

### 7. Log in and start chatting

Open `http://localhost:3000` (or the LAN address on your phone), click **Use demo supervisor account** or sign in with `supervisor@shopfloor.local` / `Shopfloor123`, or register at `/signup`. Then type, speak or tap a suggested question.

> These demo credentials are for local evaluation only. Change them and rotate `JWT_SECRET` before any real deployment.

---

## Five questions I wrote and the app's answers

Three questions the documents can answer, one with a grounded "partly answered" result, and one they cannot answer.

### 1. Hydraulic hose replacement

**Question:** *The hydraulic hose on the TX-200 CNC machine needs replacement. What precautions must be taken before loosening the hose fittings, and what should be verified after installing the new hose?*

**Safety warning shown:** Never open the electrical cabinet or hydraulic circuit on a running or energised machine.

**Answer:**
> Before loosening the hydraulic hose fittings on the TX-200, isolate the machine per SAF-SOP-003, including releasing stored hydraulic pressure, and confirm the panel pressure gauge reads zero. Place a drip tray and loosen fittings slowly.
>
> After installation:
> 1. Fit a new hose of the same rating and tighten fittings.
> 2. Remove locks as per SAF-SOP-003.
> 3. Start the hydraulic unit and confirm pressure returns to 3.5 - 4.0 MPa with no leaks.

**Sources:** `MNT-MAN-CNC-02` Rev 02, Page 1, § 2. Safety First; `MNT-MAN-CNC-02` Rev 02, Page 2, § 7. Replacing a Hydraulic Hose

---

### 2. Hydraulic pressure range and instrument

**Question:** *During routine maintenance, what is the acceptable hydraulic pressure range for the TX-200, and which instrument should the operator use to check it?*

**Safety warning shown:** Never open the electrical cabinet or hydraulic circuit on a running or energised machine.

**Answer:**
> The acceptable hydraulic system pressure range for the TX-200 is 3.5 - 4.0 MPa (35 - 40 bar). The operator should use the panel pressure gauge to check it.

**Sources:** `MNT-MAN-CNC-02` Rev 02, Page 1, § 3. Normal Operating Parameters; `MNT-MAN-CNC-02` Rev 02, Page 1, § 2. Safety First

---

### 3. BH-220 bore inspection (honest about a gap)

**Question:** *For incoming BH-220 bearing housings, what inspection method is required for the bore diameter, and why can't a digital caliper be used for this measurement?*

**Answer:**
> For incoming BH-220 bearing housings, the bore diameter must be inspected using a **Coordinate Measuring Machine (CMM)**, as it is marked as a critical dimension. The available excerpts do not state why a digital caliper cannot be used, other than specifying that dimensions marked CMM must be checked on the CMM.

The app gave the required method and said the documents don't explain the "why," instead of making up a reason.

**Sources:** `QC-SOP-014` Rev 04, Page 2, § 6. Inspection Dimensions - BH-220 Bearing Housing; `QC-SOP-014` Rev 04, Page 2, § 5. Procedure

---

### 4. Machine alarm

**Question:** *The machine is showing alarm AL-104. What does it mean and what should the operator do?*

**Answer:**
> Alarm AL-104 means "Way lube oil level low". Operator action:
> 1. Top up with ISO VG 68 oil to the MAX mark.
> 2. Press RESET. The machine can continue after reset.

**Source:** `MNT-MAN-CNC-02` Rev 02, Page 2, § 6. Common Alarms

---

### 5. Not in the documents (unanswerable)

**Question:** *What is the use of BH-220?*

**Answer:**
> I couldn't find the requested information in the available documents. Please provide the relevant document or contact the concerned department.

**Sources:** none. The documents cover BH-220 incoming inspection, not what the part is used for, so the app doesn't invent an answer.

---

## Screenshots

### Answered questions with source citations

**1. Coolant concentration** (`MNT-MAN-CNC-02`, Page 1)
![Coolant concentration answer and source card](AI-samples/answered/1.png)

**2. Alarm AL-104** (`MNT-MAN-CNC-02`, Page 2)
![Alarm AL-104 answer and source card](AI-samples/answered/2.png)

**3. BH-220 tolerance** (`QC-SOP-014` Rev 04, Page 2)
![BH-220 tolerance answer and source card](AI-samples/answered/3.png)

### Questions the documents cannot answer

**1. Out-of-scope and missing information**
![Out-of-scope and insufficient evidence handling](AI-samples/unanswered/1.png)

**2. Another unanswered case**
![Additional unanswered case](AI-samples/unanswered/2.png)

---

## Language support

Supervisors can choose **English, Tamil or Hindi**, by typing or by voice. The PDFs stay in English: the question is translated into English keywords for the search, and the answer is written back in the chosen language. Document numbers, revisions, machine names, alarm codes and measurements (for example `SAF-SOP-003`, `Rev 04`, `AL-104`, `0 bar`) stay in English so nothing is lost in translation.

**Hindi** response with the safety warning and citations kept:
![Hindi response with safety warning and citations](AI-samples/language/1.png)

**Tamil** response with the safety warning and citations kept:
![Tamil response with safety warning and citations](AI-samples/language/2.png)

---
