# HireBot Version 1 — Architecture [new]

This companion to [`README2.md`](./README2.md) summarises how the hiring management system aligns with Version 1 mandates from [`version1.md`](./version1.md).

```
┌─────────────┐   HTTPS/WSS ┌──────────────────┐
│  Recruiter   │ ─────────► │ Next.js Frontend │
│ / TAG Ops    │            │ • Zustand (auth)  │
└─────────────┘            │ • React Query     │
         ▲                  │ • Radix/Shad DNA  │
         │                  └───┬───────────────┘
         │                      │REST /api/v1
         │                  ┌───▼───────────────┐
         │                  │ FastAPI Backend   │
         │                  │ • JWT Guards      │
         │                  │ • Services        │
         │                  └───┬───────────────┘
         │ Uploads & metadata │
         │                  ┌─▼──────────────────┐
         └──────────────────│ PostgreSQL (+JSONB) │
                            └────────────────────┘
Resume binaries land on configurable disk/object storage reachable by ingestion workers.

```

---

## Frontend architecture (`frontend/`)

1. **`app/`** — Route segments follow Next.js conventions.
   - Public `login/` surface for JWT acquisition.
   - `(workspace)` group wraps authenticated pages with a **fixed sidebar + header** “Talent Console” shell (Version 1 keeps the nav drawer non-collapsible).
   - **Dashboard** (`/dashboard`): operational KPIs + **pipeline snapshot** (stage counts).
   - **Analytics** (`/analytics`): **stage distribution** + **TAG team performance** (does not duplicate the KPI card strip).
   - **Recruiters** (`/recruiters`): TAG leaderboard table only.
   - Candidates module: list (`/candidates`), **Upload resume** import (`/candidates/import`), detail (`/candidates/[id]`).
2. **`components/`**
   - `layout/admin-shell.tsx` — Teal/violet gradient sidebar, route-specific header titles, `min-w-0` / `overflow-x-hidden` on main to prevent wide tables from breaking layout.
   - `dashboard/dashboard-client.tsx` — `variant`: `dashboard` | `analytics` | `recruiters`; composes **AnalyticsCard** KPIs, **PipelineSnapshot** (bars), and the TAG performance table when applicable.
   - `dashboard/pipeline-snapshot.tsx` — Visualizes `/analytics/pipeline` data for Dashboard vs Analytics copy.
   - `candidates/*` — Table with **fixed column widths**, ellipsis + titles on overflow; **ResumeImportBoard** for multipart uploads.
3. **`lib/api.ts`** — Axios singleton that normalises `NEXT_PUBLIC_API_URL` onto `/api/v1`, injects bearer tokens, and reacts to HTTP 401 via Zustand.
4. **`store/auth-store.ts`** — Persists JWT + hydrated profile for guarded routes.
5. **`types/hirebot.ts`** — Mirrors FastAPI payloads (`PipelineStageRow`, metrics, candidates, etc.).

> **Theming:** `globals.css` uses mint/teal/violet background washes; the shell leans vibrant brand colors while keeping `prefers-color-scheme` tokens for dark mode.

---

## Backend architecture (`backend/app/`)

| Layer | Responsibility | Notes |
|-------|-----------------|-------|
| `api/` | HTTP routers under `/api/v1`: `auth`, `dashboard`, **`analytics`**, `candidates`, `recruiters`, `users`. | Secured routes use `get_current_user_optional` / role guards. |
| `core/` | `config`, `security` (hashing/JWT helpers). | Pydantic `Settings` centralises secrets + upload caps. |
| `database/` | Async SQLAlchemy engine/session + bootstrap seeding. | `init_db()` + `bootstrap()` on lifespan startup. |
| `models/` | Users, roles, candidates, resumes, assignments, notes, activity logs. | JSONB holds parsed segments; soft deletes via `deleted_at`. |
| `repositories/` | Async persistence + **`pipeline_stage_counts`** (stage funnel) and recruiter performance joins. |
| `services/` | `hirebot.py` — dashboard metrics, candidate visibility, assignments. |
| `workers/` | **`run_resume_extraction`** — reads stored file bytes, calls **`resume_text.pdf_to_text` / `docx_to_text`** (async → thread offload), then **`resume_parse.parse_resume`**, updates candidate + resume rows via `BackgroundTasks`. |
| `utils/` | **`resume_text.py`** — PDF/DOCX plain-text extraction; **`resume_parse.py`** — regex/heuristic structured fields (replaceable with NLP later). |

**RBAC synopsis**

| Role | Listing scope | Sensitive actions |
|------|---------------|-------------------|
| Admin | Entire funnel | Candidate assignment mutations |
| TAG | Only `assigned_tag_id == user.id` | Stage updates & notes on visible rows |

---

## REST surface & API conventions

All handlers live behind the `/api/v1` prefix (`main.py` → `settings.api_v1_prefix`). Errors use `{ "detail": ... }`.

| Area | Behaviour |
|------|-----------|
| Auth | Stateless JWT (HS256). |
| Dashboard | `GET /dashboard/metrics` — aggregated KPIs (totals, stages, HireBot pipeline count, etc.). |
| **Analytics** | **`GET /analytics/pipeline`** — ordered list of `{ stage, count }` plus **total** for funnel visuals. |
| Candidates | Pagination, search, RBAC filters; CSV export mirrors list filters. |
| Recruiters | TAG performance leaderboard; TAG users see only their slice where applicable. |

OpenAPI: `/docs`, `/openapi.json`.

---

## Data model highlights

| Entity | Traits |
|--------|--------|
| `roles` | `admin`, `tag_member` seeded idempotently. |
| `users` | bcrypt hashing; TAG specialization for leaderboard. |
| `candidates` | UUID + `HB-…` `public_id`, `current_stage`, JSONB for inferred skills/education/work, etc. |
| `resumes` | Filesystem path, MIME, `extraction_status`, optional `parsed_payload` / error message. |
| `recruiter_assignments` | Audit trail for staff assignment changes. |
| `interview_notes` & `activity_logs` | Notes + changelog. |

Migrations deferred for V1 scaffolding; models are Alembic-ready.

---

## Resume extraction workflow

```
Upload (≤50 files × 10MB, PDF/DOCX MIME allowlist)
    │ creates Candidate + Resume (extraction_status=pending)
    ▼
Background: run_resume_extraction(resume_id)
    │
    ├► PDF (resume_text.pdf_to_text)
    │    • PyMuPDF: page text + find_tables() row extraction (vector tables)
    │    • Fallback: pypdf text if PyMuPDF yields nothing
    │    • If text still “thin” (< ~50 chars): render pages → Tesseract OCR (requires system tesseract)
    │    • Dedupe: skip appending OCR when it repeats native text
    │
    ├► DOCX (resume_text.docx_to_text)
    │    • Document-order walk: body paragraphs + tables (nested tables flattened)
    │    • Header/footer paragraphs included
    │
    ├► resume_parse.parse_resume — regex/heuristics on full plain text
    │
    └► Update Candidate fields + Resume (extraction_status=completed, parsed_payload preview)
```

**Dependencies:** `pymupdf`, `pypdf`, `python-docx`, `Pillow`, `pytesseract`; **Dockerfile** installs **`tesseract-ocr`** / **`tesseract-ocr-eng`**. Native dev hosts need Tesseract installed for OCR.

Failures set `extraction_status=failed` and `error_message` for operators.

---

## Deployment topology (Docker Compose)

| Service | Image | Ports | Persistent state |
|---------|-------|-------|------------------|
| `db` | `postgres:16-alpine` | `5432` | `hirebot_pg` volume |
| `backend` | Build `./backend` | `8000` | `hirebot_uploads` + **Tesseract in image** for OCR |
| `frontend` | Build `./frontend` | `3000` | Stateless (Next standalone) |

`depends_on` / healthchecks align startup so bootstrap runs after Postgres is ready.

---

## Future-facing hooks (explicitly deferred)

Dedicated worker queues (Celery/RQ), LLM-based parsing, management/executive roles, and richer analytics remain out of scope for V1—the extraction and analytics layers are isolated so they can evolve without rewriting controllers.

Treat this document as living guidance—mirror production changes via PR summaries linked to architecture deltas.
