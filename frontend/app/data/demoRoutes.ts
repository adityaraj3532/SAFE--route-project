export type Route = {
  id: number;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  lighting: number;
  crowdLevel: string;
  description: string;
  color: string;
};

export const demoRoutes: Route[] = [
  {
    id: 1,
    name: "Main Road Route",
    distance: "3.2 km",
    duration: "12 min",
    safetyScore: 92,
    lighting: 95,
    crowdLevel: "High",
    description: "Well-lit route with shops and regular traffic.",
    color: "#16a34a"
  },
  {
    id: 2,
    name: "Market Street Route",
    distance: "2.8 km",
    duration: "10 min",
    safetyScore: 84,
    lighting: 88,
    crowdLevel: "Medium",
    description: "Busy market area with good visibility.",
    color: "#22c55e"
  },
  {
    id: 3,
    name: "Park Road Route",
    distance: "2.4 km",
    duration: "9 min",
    safetyScore: 68,
    lighting: 61,
    crowdLevel: "Low",
    description: "Shorter route but has quieter sections.",
    color: "#f59e0b"
  }
];
