from enum import StrEnum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

Longitude = Annotated[float, Field(ge=-180, le=180)]
Latitude = Annotated[float, Field(ge=-90, le=90)]
Position = tuple[Longitude, Latitude]


class Mode(StrEnum):
    FASTEST = "fastest"
    BALANCED = "balanced"
    SAFEST = "safest"


class Coordinates(BaseModel):
    lon: Longitude
    lat: Latitude

    def position(self) -> Position:
        return self.lon, self.lat


class Place(Coordinates):
    label: str


class RouteRequest(BaseModel):
    start: Coordinates
    end: Coordinates
    mode: Mode = Mode.BALANCED

    @model_validator(mode="after")
    def distinct_points(self):
        if self.start == self.end:
            raise ValueError("Choose a destination different from the starting point.")
        return self


class LineString(BaseModel):
    type: Literal["LineString"]
    coordinates: Annotated[list[Position], Field(min_length=2)]


class IncidentCategory(StrEnum):
    POOR_LIGHTING = "poor_lighting"
    HARASSMENT = "harassment"
    OBSTRUCTION = "obstruction"
    OTHER = "other"


class IncidentInput(Coordinates):
    category: IncidentCategory


class IncidentMatch(BaseModel):
    id: UUID
    category: IncidentCategory
    segment: Annotated[int, Field(ge=1, le=10)]


class RouteOption(BaseModel):
    id: int
    geometry: LineString
    distance_m: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    duration_s: Annotated[float, Field(gt=0, allow_inf_nan=False)]
    incidents: list[IncidentMatch] | None = None


class Analysis(BaseModel):
    mode: Mode
    routes: list[RouteOption]
    incident_data_available: bool
    note: str
