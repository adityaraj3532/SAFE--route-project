# Damelyst - Where Safety Meets Direction

### Agentic AI model for Safer Routes, Smarter Journeys

Damelyst is a multi-agent GeoAI platform that helps women compare routes using safety signals such as lighting, public activity, visibility, main-road quality, emergency proximity and recent verified incidents.

Rather than selecting only the shortest route, Damelyst recommends the **safer available route** while clearly showing safety, confidence, risk and uncertainty.

## Features

* Fastest, Balanced and Safest route modes
* Multiple pedestrian route alternatives
* Segment-level safety analysis
* Real-time incident information
* Explainable route recommendations
* Address autocomplete
* Live multi-agent progress through SSE
* Community incident reporting and confirmation
* Confidence and missing-data warnings

## Tech Stack

* FastAPI and Python
* LangGraph
* OpenRouteService
* Geoapify
* OpenAI or Gemini
* Supabase PostgreSQL and PostGIS
* Supabase Auth, Realtime and Storage
* Next.js, TypeScript and MapLibre

## Run Locally

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Install dependencies:

```powershell
uv sync --extra dev
```

Start the backend:

```powershell
uv run uvicorn app.main:app --reload --port 8000
```

Open the API documentation:

```text
http://localhost:8000/docs
```

## API Endpoints

```text
GET  /health
GET  /v1/geocode/search
POST /v1/routes/analyze
POST /v1/routes/analyze/stream
POST /v1/incidents
POST /v1/incidents/{id}/confirm
GET  /v1/incidents/nearby
```

## Testing

```powershell
uv run pytest -q
uv run ruff check app tests
```
