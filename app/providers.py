from uuid import UUID

import httpx
from fastapi import HTTPException
from pydantic import SecretStr, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

from .models import IncidentMatch, Place, RouteOption, RouteRequest


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ors_api_key: SecretStr = SecretStr("")
    geoapify_api_key: SecretStr = SecretStr("")
    supabase_url: str = ""
    supabase_publishable_key: SecretStr = SecretStr("")
    supabase_secret_key: SecretStr = SecretStr("")
    frontend_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]


def checked_json(response: httpx.Response):
    response.raise_for_status()
    return response.json()


class Providers:
    def __init__(self, client: httpx.AsyncClient, settings: Settings):
        self.client = client
        self.settings = settings

    async def places(self, query: str) -> list[Place]:
        key = self.settings.geoapify_api_key.get_secret_value()
        if not key:
            raise HTTPException(503, "Address search is not configured.")
        try:
            response = await self.client.get(
                "https://api.geoapify.com/v1/geocode/autocomplete",
                params={"text": query, "limit": 5, "format": "json", "apiKey": key},
            )
            return [
                Place(label=row["formatted"], lon=row["lon"], lat=row["lat"])
                for row in checked_json(response)["results"]
            ]
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            raise HTTPException(
                502, "Address search is temporarily unavailable."
            ) from None

    async def walking_routes(self, request: RouteRequest) -> list[RouteOption]:
        key = self.settings.ors_api_key.get_secret_value()
        if not key:
            raise HTTPException(503, "Walking directions are not configured.")
        url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"
        headers = {"Authorization": key}
        coordinates = [request.start.position(), request.end.position()]
        try:
            response = await self.client.post(
                url,
                headers=headers,
                json={
                    "coordinates": coordinates,
                    "alternative_routes": {
                        "target_count": 3,
                        "share_factor": 0.6,
                        "weight_factor": 1.4,
                    },
                },
            )
            # ORS can reject alternatives for requests that allow a single route.
            if response.status_code == 400:
                response = await self.client.post(
                    url, headers=headers, json={"coordinates": coordinates}
                )
            if response.status_code == 404:
                raise HTTPException(
                    404, "No walking route found between these locations."
                )
            routes = [
                RouteOption(
                    id=index,
                    geometry=feature["geometry"],
                    distance_m=feature["properties"]["summary"]["distance"],
                    duration_s=feature["properties"]["summary"]["duration"],
                )
                for index, feature in enumerate(checked_json(response)["features"], 1)
            ]
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            raise HTTPException(
                502, "Walking directions are temporarily unavailable."
            ) from None
        if not routes:
            raise HTTPException(404, "No walking route found between these locations.")
        return routes

    async def user_id(self, token: str) -> UUID:
        key = self.settings.supabase_publishable_key.get_secret_value()
        if not self.settings.supabase_url or not key:
            raise HTTPException(503, "Incident sign-in is not configured.")
        try:
            response = await self.client.get(
                f"{self.settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={"apikey": key, "Authorization": f"Bearer {token}"},
            )
            if response.status_code in (401, 403):
                raise HTTPException(
                    401, "Sign in again to continue.", {"WWW-Authenticate": "Bearer"}
                )
            user = checked_json(response)
            if not user.get("email_confirmed_at") or user.get("is_anonymous"):
                raise HTTPException(403, "A verified email account is required.")
            return UUID(user["id"])
        except (httpx.HTTPError, KeyError, TypeError, ValueError):
            raise HTTPException(
                502, "Sign-in verification is temporarily unavailable."
            ) from None

    async def incident_rpc(self, name: str, params: dict):
        key = self.settings.supabase_secret_key.get_secret_value()
        if not self.settings.supabase_url or not key:
            raise HTTPException(503, "The incident database is not configured.")
        headers = {"apikey": key}
        # The gateway expects only apikey for new sb_secret_ keys.
        if key.startswith("eyJ"):
            headers["Authorization"] = f"Bearer {key}"
        try:
            response = await self.client.post(
                f"{self.settings.supabase_url.rstrip('/')}/rest/v1/rpc/{name}",
                headers=headers,
                json=params,
            )
            if response.status_code == 429:
                raise HTTPException(429, "Too many incident requests. Try again later.")
            return checked_json(response)
        except (httpx.HTTPError, ValueError):
            raise HTTPException(
                502, "The incident database is temporarily unavailable."
            ) from None

    async def route_incidents(self, routes: list[RouteOption]) -> bool:
        try:
            result = await self.incident_rpc(
                "saferoutes_route_incidents",
                {
                    "p_lines": [
                        route.geometry.model_dump(mode="json") for route in routes
                    ]
                },
            )
            if not isinstance(result, list) or len(result) != len(routes):
                return False
            matches = [
                [IncidentMatch.model_validate(item) for item in row] for row in result
            ]
        except (HTTPException, TypeError, ValidationError):
            return False

        for route, incidents in zip(routes, matches, strict=True):
            route.incidents = incidents
        return True
