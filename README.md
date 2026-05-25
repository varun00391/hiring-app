# HireBot — AI-Powered ATS

Production-ready Applicant Tracking System that parses resumes with Groq LLM, scores candidates, and gives recruiters a dashboard to manage pipeline status, email outreach, interview scheduling, and activity timelines.

## Features

- **Resume parsing** — Extract structured candidate data from PDF, DOC, and DOCX files
- **Resume scoring** — Heuristic quality score (0–100) from parsed completeness and content
- **Candidate management** — Upload, search, filter, sort, status updates, and recruiter notes
- **Dashboard analytics** — Upload metrics, parsing success/failure, pipeline charts, recent activity
- **Email communication** — Send outbound emails via SMTP; poll inbox via IMAP for candidate replies
- **Interview scheduling** — Schedule interviews with calendar invites and automated confirmation emails
- **Activity timeline** — Unified audit trail of uploads, status changes, emails, and interviews

## Architecture

```
hirebot/
├── backend/          # FastAPI (Python)
│   └── app/
│       ├── api/          # Routes & dependencies
│       ├── services/     # Business logic (pipeline, candidates, email, interviews)
│       ├── repositories/ # JSON-backed persistence layer
│       ├── models/       # Pydantic schemas
│       ├── utils/        # File detection, logging, field helpers
│       └── exceptions/   # Structured error handling
├── frontend/         # React + Tailwind ATS dashboard (Vite)
│   └── src/
│       ├── components/   # Sidebar, charts, table, drawer, communication, etc.
│       ├── pages/        # Dashboard, Candidate Details
│       ├── services/     # Axios API layer
│       ├── layouts/      # App shell with fixed sidebar
│       └── utils/        # Constants, formatters
└── docker-compose.yml
```

### Resume Processing Pipeline

1. Upload resume (single parse or bulk candidate upload)
2. Detect file type (PDF / DOC / DOCX)
3. Extract text (pdfplumber → PyMuPDF fallback, python-docx, LibreOffice for `.doc`)
4. Clean & preprocess text (OCR noise hints, normalization)
5. Parse with Groq LLM into structured JSON
6. Normalize into standard company resume template
7. Compute resume score and persist candidate record

### Data Storage

Candidate, communication, interview, and activity records are persisted as JSON files under `DATA_DIR` (default: `/tmp/hirebot/data`). Uploaded resume files are stored separately under the upload temp directory.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- [Groq API key](https://console.groq.com/)

### Run with Docker

```bash
cp .env.example .env
# Set GROQ_API_KEY in .env

docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/v1/docs

### Local Development

**Backend**

```bash
cp .env.example .env   # from repo root; configure GROQ_API_KEY and optional SMTP/IMAP

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev   # reads VITE_API_BASE_URL from ../.env
```

Frontend dev server: http://localhost:5173

## Frontend

Modern ATS-style dashboard with:

- **Fixed sidebar** — Dashboard & Candidates navigation
- **Dashboard** — Metric cards, bar/pie charts, recent uploads, status distribution
- **Candidates** — Multi-file upload, searchable/sortable table, status management
- **Candidate drawer** — Profile, skills, resume score, parsed JSON, recruiter notes
- **Communication panel** — Email history, communication status, compose modal
- **Interview scheduler** — Schedule interviews with meeting mode and datetime
- **Activity timeline** — Chronological events for each candidate

Stack: React, React Router, Tailwind CSS, Axios, Recharts, Lucide icons.

## API

### Resume parsing

#### `POST /api/v1/resumes/parse`

Upload a resume file as `multipart/form-data` with field name `file`.

### Candidates

#### `GET /api/v1/candidates`

List candidates with pagination, search, status/role filters, and sorting.

#### `GET /api/v1/candidates/{id}`

Get full candidate details including parsed resume, resume score, and timeline.

#### `POST /api/v1/candidates/upload`

Multi-file upload (`files` field). Optional form fields: `position_applied`, `recruiter_name`.

#### `PATCH /api/v1/candidates/{id}/status`

Update interview status and append timeline entry.

#### `PATCH /api/v1/candidates/{id}/notes`

Update recruiter notes.

#### `GET /api/v1/candidates/{id}/resume/download`

Download original resume file.

### Dashboard

#### `GET /api/v1/dashboard/metrics`

Hiring analytics: upload counts, parsing success/failure, pipeline status, chart data.

### Email

#### `POST /api/v1/emails/send`

Send an email to a candidate. Requires `candidate_id`, `subject`, and `body`.

#### `GET /api/v1/emails/candidate/{candidate_id}`

List email history for a candidate.

#### `PATCH /api/v1/emails/candidate/{candidate_id}/communication-status`

Update communication status (e.g. `no_communication`, `email_sent`, `awaiting_reply`, `confirmed`).

### Interviews & Timeline

#### `POST /api/v1/interviews/schedule`

Schedule an interview. Sends confirmation email when SMTP is enabled.

#### `GET /api/v1/interviews/candidate/{candidate_id}`

List scheduled interviews for a candidate.

#### `GET /api/v1/timeline/candidate/{candidate_id}`

Get unified activity timeline for a candidate.

### Health

#### `GET /api/v1/health`

Health check endpoint.

**Parse response fields:**

- `parsed_resume` — Normalized schema (name, contact, skills, experience, education, etc.)
- `standard_format` — Company-standard resume template
- `metadata` — Extraction method, timing, warnings

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key | required |
| `GROQ_MODEL` | LLM model | `llama-3.3-70b-versatile` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size | `10` |
| `DATA_DIR` | JSON data storage path | `/tmp/hirebot/data` |
| `CORS_ORIGINS` | Allowed frontend origins | localhost ports |
| `SMTP_ENABLED` | Enable outbound email | `false` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USERNAME` | SMTP username | — |
| `SMTP_PASSWORD` | SMTP password / app password | — |
| `SMTP_FROM_EMAIL` | Sender address | — |
| `IMAP_ENABLED` | Enable inbox polling for replies | `false` |
| `IMAP_HOST` | IMAP server host | `imap.gmail.com` |
| `IMAP_PORT` | IMAP server port | `993` |
| `IMAP_USERNAME` | IMAP username | — |
| `IMAP_PASSWORD` | IMAP password / app password | — |
| `INBOX_POLL_INTERVAL_SECONDS` | Reply polling interval | `120` |
| `COMPANY_NAME` | Company name in emails | `HireBot` |
| `RECRUITER_SIGNATURE` | Email signature block | default recruiter |

When `SMTP_ENABLED=false`, emails are logged but not sent. When `IMAP_ENABLED=true`, the backend polls the inbox on startup and at the configured interval to detect candidate replies and update communication status.

## Error Handling

The API returns structured errors for:

- Unsupported file types (`415`)
- File too large (`413`)
- Corrupted files (`422`)
- Extraction failures (`422`)
- LLM parsing failures (`502`)
- Candidate not found (`404`)
- Email send failures (`502`)

## Extending

Key extension points:

- `ResumePipelineService` — Resume parsing orchestration
- `CandidateService` — Upload, listing, status, and notes
- `CommunicationService` — Email send/receive and status tracking
- `InterviewService` — Scheduling and confirmation flow
- `TimelineService` — Activity event aggregation
- `JsonRepository` — Swap JSON persistence for a database-backed repository
- `ParsedResume` schema — Shared data contract across services

## License

MIT
