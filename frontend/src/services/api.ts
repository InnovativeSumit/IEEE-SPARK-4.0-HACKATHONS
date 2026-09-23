const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} (${path})`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string; mode: string }>("/api/health"),
  overview: () => request<any>("/api/analytics/overview"),
  beforeAfter: () => request<any>("/api/analytics/before-after"),
  communities: (params: Record<string, string> = {}) =>
    request<{ count: number; results: any[] }>(`/api/communities?${new URLSearchParams(params)}`),
  communityRanking: (limit = 50) =>
    request<{ count: number; results: any[] }>(`/api/communities/ranking?limit=${limit}`),
  community: (id: string) => request<any>(`/api/communities/${id}`),
  facilities: (params: Record<string, string> = {}) =>
    request<{ count: number; results: any[] }>(`/api/wash/facilities?${new URLSearchParams(params)}`),
  washRisk: () => request<any>("/api/wash/risk"),
  floodGeojson: () => request<any>("/api/flood/geojson"),
  floodStatistics: () => request<any>("/api/flood/statistics"),
  priorityMap: () => request<any>("/api/priority/map"),
  priorityWeights: () => request<any>("/api/priority/weights"),
  dataSources: () => request<{ results: any[] }>("/api/data-sources"),
  reportSummary: () => request<any>("/api/reports/summary"),
  responseZones: () => request<{ zones: any[] }>("/api/analytics/clusters"),
  modelPerformance: () => request<any>("/api/models/performance"),
  ragIndex: () => request<any>("/api/models/rag-index"),
  aiQuery: (question: string) =>
    request<any>("/api/ai/query", { method: "POST", body: JSON.stringify({ question }) }),
  csvExportUrl: () => `${BASE_URL}/api/reports/communities.csv`,
};
