import json
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .models import (
    Analysis,
    IncidentInput,
    Latitude,
    Longitude,
    Mode,
    Place,
    RouteOption,
    RouteRequest,
)
from .providers import Providers, Settings

bearer = HTTPBearer(auto_error=False)


def get_providers(request: Request) -> Providers:
    return request.app.state.providers


Provider = Annotated[Providers, Depends(get_providers)]


async def current_user(
    providers: Provider,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> UUID:
    if credentials is None:
        raise HTTPException(401, "Sign in to continue.", {"WWW-Authenticate": "Bearer"})
    return await providers.user_id(credentials.credentials)


UserId = Annotated[UUID, Depends(current_user)]


async def analyze(
    request: RouteRequest, routes: list[RouteOption], providers: Providers
) -> Analysis:
    available = await providers.route_incidents(routes)

    def order(route: RouteOption):
        count = len(route.incidents or [])
        if request.mode == Mode.SAFEST:
            return count, route.duration_s
        if request.mode == Mode.BALANCED:
            return route.duration_s + 180 * count, route.duration_s
        return route.duration_s, route.distance_m

    note = (
        "Comparison uses recent community-confirmed reports within 100 m of each route. "
        "Report coverage varies. Lighting and crowd data are unavailable."
        if available
        else "Incident data is unavailable. Routes are ordered by walking time."
    )
    return Analysis(
        mode=request.mode,
        routes=sorted(routes, key=order),
        incident_data_available=available,
        note=note,
    )


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def create_app(
    settings: Settings | None = None, transport: httpx.AsyncBaseTransport | None = None
):
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with httpx.AsyncClient(
            timeout=15, transport=transport, trust_env=False
        ) as client:
            app.state.providers = Providers(client, settings)
            yield

    app = FastAPI(title="SafeRoutes API", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health")
    async def health():
        return {
            "status": "ok",
            "routing_configured": bool(settings.ors_api_key.get_secret_value()),
            "geocoding_configured": bool(settings.geoapify_api_key.get_secret_value()),
            "incident_db_configured": bool(
                settings.supabase_url
                and settings.supabase_secret_key.get_secret_value()
            ),
        }

    @app.get("/v1/geocode/search", response_model=list[Place])
    async def geocode(
        q: Annotated[str, Query(min_length=3, max_length=160)], providers: Provider
    ):
        if len(q.strip()) < 3:
            raise HTTPException(422, "Enter at least three address characters.")
        return await providers.places(q.strip())

    @app.post("/v1/routes/analyze", response_model=Analysis)
    async def route_analysis(request: RouteRequest, providers: Provider):
        return await analyze(
            request, await providers.walking_routes(request), providers
        )

    @app.post("/v1/routes/analyze/stream")
    async def route_stream(request: RouteRequest, providers: Provider):
        async def events():
            yield sse("progress", {"stage": "finding_walking_routes"})
            try:
                routes = await providers.walking_routes(request)
                yield sse("progress", {"stage": "checking_community_incidents"})
                result = await analyze(request, routes, providers)
            except HTTPException as exc:
                yield sse("error", {"status": exc.status_code, "detail": exc.detail})
                return
            yield sse("result", result.model_dump(mode="json"))

        return StreamingResponse(
            events(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @app.get("/v1/incidents/nearby")
    async def nearby(
        lat: Latitude,
        lon: Longitude,
        providers: Provider,
        radius_m: Annotated[int, Query(ge=50, le=3000)] = 500,
    ):
        return await providers.incident_rpc(
            "saferoutes_nearby_incidents",
            {"p_lat": lat, "p_lon": lon, "p_radius_m": radius_m},
        )

    @app.post("/v1/incidents", status_code=201)
    async def create_incident(
        incident: IncidentInput, providers: Provider, user_id: UserId
    ):
        return await providers.incident_rpc(
            "saferoutes_report_incident",
            {
                **{
                    f"p_{key}": value
                    for key, value in incident.model_dump(mode="json").items()
                },
                "p_reporter": str(user_id),
            },
        )

    @app.post("/v1/incidents/{incident_id}/confirm", status_code=204)
    async def confirm_incident(incident_id: UUID, providers: Provider, user_id: UserId):
        result = await providers.incident_rpc(
            "saferoutes_confirm_incident",
            {"p_incident": str(incident_id), "p_user": str(user_id)},
        )
        if result == "missing":
            raise HTTPException(404, "Active incident not found.")
        if result == "own_report":
            raise HTTPException(409, "You cannot confirm your own report.")
        return Response(status_code=204)

    return app


app = create_app()
