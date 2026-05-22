# HireBot — AI Resume Parser

Production-ready resume parsing application that extracts structured candidate data from PDF, DOC, and DOCX files using text extraction and Groq LLM.

## Architecture

```
hirebot/
├── backend/          # FastAPI (Python)
│   └── app/
│       ├── api/          # Routes & dependencies
│       ├── services/     # Pipeline, extraction, LLM, normalization
│       ├── models/       # Pydantic schemas
│       ├── utils/        # File detection, logging
│       └── exceptions/   # Error handling
├── frontend/         # React + Tailwind (Vite)
└── docker-compose.yml
```

### Processing Pipeline

1. Upload resume
2. Detect file type (PDF / DOC / DOCX)
3. Extract text (pdfplumber → PyMuPDF fallback, python-docx, LibreOffice for .doc)
4. Clean & preprocess text (OCR noise hints, normalization)
5. Parse with Groq LLM into structured JSON
6. Normalize into standard company resume template
7. Return API response

## Quick Start

### Prerequisites

- Docker & Docker Compose
- [Groq API key](https://console.groq.com/)

### Run with Docker

```bash
cp backend/.env.example backend/.env
# Set GROQ_API_KEY in backend/.env

docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/v1/docs

### Local Development

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: http://localhost:5173

## API

### `POST /api/v1/resumes/parse`

Upload a resume file as `multipart/form-data` with field name `file`.

**Response fields:**

- `parsed_resume` — normalized schema (name, contact, skills, experience, education, etc.)
- `standard_format` — company-standard resume template
- `metadata` — extraction method, timing, warnings

### `GET /api/v1/health`

Health check endpoint.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key | required |
| `GROQ_MODEL` | LLM model | `llama-3.3-70b-versatile` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size | `10` |
| `CORS_ORIGINS` | Allowed frontend origins | localhost ports |

## Error Handling

The API returns structured errors for:

- Unsupported file types (`415`)
- File too large (`413`)
- Corrupted files (`422`)
- Extraction failures (`422`)
- LLM parsing failures (`502`)

## Extending

Future ATS features can plug into:

- `ResumePipelineService` — orchestration
- `ResumeNormalizer` — output mapping
- `ParsedResume` schema — shared data contract

## License

MIT
