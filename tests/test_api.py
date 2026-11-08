import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.providers import Settings

USER_ID = "00000000-0000-4000-8000-000000000001"
INCIDENT_ID = "00000000-0000-4000-8000-000000000002"
TRIP = {"start": {"lon": 75.8, "lat": 26.9}, "end": {"lon": 75.81, "lat": 26.9}}
LINE = {"type": "LineString", "coordinates": [[75.8, 26.9], [75.81, 26.9]]}
REPORT = {"lat": 26.9, "lon": 75.8, "category": "obstruction"}


def upstream(request: httpx.Request):
    if request.url.host == "api.geoapify.com":
        assert request.url.params["text"] == "Jaipur"
        return httpx.Response(
            200, json={"results": [{"formatted": "Jaipur", "lat": 26.9, "lon": 75.8}]}
        )
    if request.url.host == "api.openrouteservice.org":
        assert request.url.path.endswith("/foot-walking/geojson")
        assert json.loads(request.content)["coordinates"][0] == [75.8, 26.9]
        return httpx.Response(
            200,
            json={
                "features": [
                    {
                        "geometry": LINE,
                        "properties": {
                            "summary": {"distance": 1200, "duration": duration}
                        },
                    }
                    for duration in (600, 720)
                ]
            },
        )
    if request.url.path == "/auth/v1/user":
        assert request.headers["apikey"] == "sb_publishable_test"
        if request.headers["Authorization"] != "Bearer good-session":
            return httpx.Response(401)
        return httpx.Response(
            200, json={"id": USER_ID, "email_confirmed_at": "2026-11-08"}
        )
    assert request.headers["apikey"] == "sb_secret_test"
    assert "authorization" not in request.headers
    params = json.loads(request.content)
    if request.url.path.endswith("/saferoutes_route_incidents"):
        assert params == {"p_lines": [LINE, LINE]}
        return httpx.Response(
            200,
            json=[
                [{"id": INCIDENT_ID, "category": "obstruction", "segment": 2}],
                [],
            ],
        )
    if request.url.path.endswith("/saferoutes_report_incident"):
        assert params["p_reporter"] == USER_ID
        return httpx.Response(200, json={"id": INCIDENT_ID, **REPORT})
    if request.url.path.endswith("/saferoutes_confirm_incident"):
        assert params == {"p_incident": INCIDENT_ID, "p_user": USER_ID}
        return httpx.Response(200, json="own_report")
    if request.url.path.endswith("/saferoutes_nearby_incidents"):
        assert params == {"p_lat": 26.9, "p_lon": 75.8, "p_radius_m": 500}
        return httpx.Response(200, json=[])
    pytest.fail(f"Unexpected upstream request to {request.url.host}{request.url.path}")


@pytest.fixture
def client():
    settings = Settings(
        _env_file=None,
        ors_api_key="ors-test",
        geoapify_api_key="geoapify-test",
        supabase_url="https://example.supabase.co",
        supabase_publishable_key="sb_publishable_test",
        supabase_secret_key="sb_secret_test",
    )
    with TestClient(create_app(settings, httpx.MockTransport(upstream))) as test_client:
        yield test_client


def test_health_and_geocoding(client):
    assert client.get("/health").json()["routing_configured"]
    assert client.get("/v1/geocode/search", params={"q": "Jaipur"}).json() == [
        {"label": "Jaipur", "lat": 26.9, "lon": 75.8}
    ]


@pytest.mark.parametrize(
    ("mode", "first"), [("fastest", 1), ("balanced", 2), ("safest", 2)]
)
def test_route_order(client, mode, first):
    response = client.post("/v1/routes/analyze", json={**TRIP, "mode": mode})
    assert response.status_code == 200
    result = response.json()
    assert result["incident_data_available"]
    assert result["routes"][0]["id"] == first
    assert result["routes"][0]["geometry"] == LINE


def test_stream(client):
    response = client.post("/v1/routes/analyze/stream", json=TRIP)
    assert response.headers["content-type"].startswith("text/event-stream")
    assert response.text.count("event: progress") == 2
    assert "event: result" in response.text


def test_route_validation(client):
    assert (
        client.post(
            "/v1/routes/analyze", json={**TRIP, "end": TRIP["start"]}
        ).status_code
        == 422
    )
    assert client.get("/v1/incidents/nearby?lat=100&lon=75").status_code == 422


def test_incident_endpoints(client):
    path = "/v1/incidents"
    auth = {"Authorization": "Bearer good-session"}
    assert client.post(path, json=REPORT).status_code == 401
    assert (
        client.post(
            path, json=REPORT, headers={"Authorization": "Bearer invalid"}
        ).status_code
        == 401
    )
    report = client.post(
        path, json={**REPORT, "reporter_id": INCIDENT_ID}, headers=auth
    )
    assert report.status_code == 201
    assert report.json()["id"] == INCIDENT_ID
    assert client.post(f"{path}/{INCIDENT_ID}/confirm", headers=auth).status_code == 409
    assert client.get(f"{path}/nearby?lat=26.9&lon=75.8").json() == []


def test_route_falls_back_to_time_when_database_is_down():
    settings = Settings(
        _env_file=None,
        ors_api_key="ors-test",
        supabase_url="https://example.supabase.co",
        supabase_secret_key="sb_secret_test",
    )

    def unavailable(request):
        if request.url.path.endswith("/saferoutes_route_incidents"):
            return httpx.Response(500)
        return upstream(request)

    with TestClient(create_app(settings, httpx.MockTransport(unavailable))) as client:
        response = client.post("/v1/routes/analyze", json={**TRIP, "mode": "safest"})
    result = response.json()
    assert response.status_code == 200
    assert not result["incident_data_available"]
    assert result["routes"][0]["id"] == 1
    assert result["routes"][0]["incidents"] is None
