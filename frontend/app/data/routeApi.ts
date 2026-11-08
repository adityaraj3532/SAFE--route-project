type Coordinates = { lon: number; lat: number };
export type Place = Coordinates & { label: string };

export type LineString = {
  type: "LineString";
  coordinates: [number, number][];
};

type Analysis = {
  note: string;
  routes: {
    id: number;
    geometry: LineString;
    distance_m: number;
    duration_s: number;
    incidents: { id: string }[] | null;
  }[];
};

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl + path, options);
  } catch {
    throw new Error("Could not reach the SafeRoutes backend.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      typeof error?.detail === "string" ? error.detail : "The route request could not be completed.",
    );
  }

  return response.json();
}

export function searchPlaces(address: string, signal: AbortSignal) {
  return request<Place[]>(`/v1/geocode/search?${new URLSearchParams({ q: address })}`, { signal });
}

async function resolvePlace(address: string | Place, field: string): Promise<Place> {
  if (typeof address !== "string") return address;
  const query = new URLSearchParams({ q: address });
  const places = await request<Place[]>(`/v1/geocode/search?${query}`);
  const place = places[0];
  if (!place) throw new Error(`Could not find the ${field}. Try adding the city or a landmark.`);
  return place;
}

export async function findWalkingRoutes(from: string | Place, to: string | Place) {
  const [start, end] = await Promise.all([
    resolvePlace(from, "starting location"),
    resolvePlace(to, "destination"),
  ]);

  if (start.lat === end.lat && start.lon === end.lon) {
    throw new Error("Choose a destination different from the starting location.");
  }

  const analysis = await request<Analysis>("/v1/routes/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start: { lat: start.lat, lon: start.lon },
      end: { lat: end.lat, lon: end.lon },
      mode: "balanced",
    }),
  });

  return { ...analysis, startLabel: start.label, endLabel: end.label };
}
