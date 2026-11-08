# SafeRoutes

The SafeRoutes API compares walking alternatives by travel time and recent community-confirmed reports. It connects to Geoapify for address suggestions, OpenRouteService for walking directions, and Supabase for accounts and incident data. The existing Next.js frontend still displays its sample routes. Use the API documentation to try the backend.

## Run in VS Code on Windows

Install Python 3.11 or newer, [uv](https://docs.astral.sh/uv/getting-started/installation/). Open the project root in VS Code.

### 1. Set up the database

1. Open the intended Supabase project's **SQL Editor**. Run the SQL file in `supabase/migrations/`. This creates the incident tables in a private schema, enables PostGIS, and restricts the API functions to the server role.
2. Enable the Data API for the project and keep `public` exposed so the backend can call the four functions. Leave `saferoutes` unexposed.
3. For incident reporting, enable email sign-in and email confirmation in Supabase Auth.

Alternatively, if the Supabase CLI v3 is installed and authenticated, run `supabase db push --remote=YOUR_PROJECT_REF` from the repository root. Use one migration method per database.

### 2. Run FastAPI

From the project root in PowerShell:

```powershell
Copy-Item .env.example .env
uv sync --locked
```

Open `.env` and fill in the variables below. The app can start with blank keys. Each live feature requires its own configuration.

| Variable | Source |
| --- | --- |
| `GEOAPIFY_API_KEY` | Geoapify project API key |
| `ORS_API_KEY` | OpenRouteService API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key for verifying user sessions |
| `SUPABASE_SECRET_KEY` | Supabase server secret key, or legacy `service_role` key |
| `FRONTEND_ORIGINS` | JSON array of permitted frontend origins |

Keep the Supabase secret and provider keys in the backend environment.

```powershell
uv run --locked uvicorn app.main:app --reload --port 8000
```

Open [FastAPI docs](http://localhost:8000/docs) or [health](http://localhost:8000/health). The health endpoint reports which integrations are configured.

## API

| Method and path | Use |
| --- | --- |
| `GET /health` | Check that the API is running and keys are configured |
| `GET /v1/geocode/search?q=...` | Find address suggestions and coordinates |
| `POST /v1/routes/analyze` | Get ranked routes and incident matches as JSON |
| `POST /v1/routes/analyze/stream` | Get `progress` events followed by a `result` or `error` event |
| `GET /v1/incidents/nearby?lat=...&lon=...&radius_m=500` | Browse recent reports and their confirmation counts |
| `POST /v1/incidents` | Submit a report with a verified Supabase Auth account |
| `POST /v1/incidents/{id}/confirm` | Confirm a report using a different verified account |

Example route request:

```json
{
  "start": { "lon": 75.7873, "lat": 26.9124 },
  "end": { "lon": 75.8237, "lat": 26.9239 },
  "mode": "balanced"
}
```

Incident submissions and confirmations use the Supabase Auth session's `access_token` as an HTTP bearer token. You can exercise them from Swagger after signing in through Supabase Auth. A submission body contains `lat`, `lon`, and a category of `poor_lighting`, `harassment`, `obstruction`, or `other`. Nearby results include pending reports so others can confirm them. A report needs two distinct confirmations from accounts other than the reporter to affect ranking. Repeating a confirmation leaves the count unchanged. Reports stop appearing in comparisons and nearby results after seven days.

## How ranking works

- **Fastest** sorts by walking time.
- **Balanced** adds a three-minute comparison penalty for each recent community-confirmed report within 100 metres. The API still returns the actual walking time.
- **Safest** puts routes with fewer known reports first, with walking time as the tiebreaker.

Each matched report includes its approximate position along the path as a segment from 1 to 10. Reporting coverage varies, and an empty result can mean nobody has reported a problem. The API uses walking time when incident data is unavailable.

## Checks

```powershell
uv sync --locked --extra dev
uv run --locked --extra dev python -m pytest -q
uv run --locked --extra dev ruff check app tests
```

The API tests use simulated provider responses and require no keys.
