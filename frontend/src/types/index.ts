export interface Community {
  id: string;
  rank: number;
  name: string;
  district: string;
  municipality: string;
  lat: number;
  lon: number;
  population: number;
  elevation_m: number;
  distance_to_river_km: number;
  flood_exposure_pct: number;
  road_accessibility: number;
  accessibility_risk: number;
  wash_disruption_risk: number;
  num_wash_facilities: number;
  at_risk_facilities: number;
  facility_disruption_share: number;
  population_exposure: number;
  estimated_population_affected: number;
  vulnerability_score: number;
  vulnerability_factors: { factor: string; contribution_pct: number }[];
  isolation: number;
  response_zone: string;
  priority_score: number;
  priority_category: "CRITICAL" | "VERY HIGH" | "HIGH" | "MODERATE" | "LOW";
  recommendations: string[];
  why: string[];
}

export interface ResponseZone {
  zone: string;
  communities: string[];
  community_count: number;
  total_population_affected: number;
  avg_priority_score: number;
  centroid: Record<string, number>;
  sample_communities: string[];
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  facility_type_label: string;
  community_id: string;
  community_name?: string;
  district: string;
  municipality: string;
  lat: number;
  lon: number;
  flood_exposure_pct: number;
  road_accessibility: number;
  disruption_probability: number;
  status: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  model_confidence: number;
  top_factors: { factor: string; contribution_pct: number }[];
  priority_score: number;
}

export interface Overview {
  mode: string;
  affected_population: number;
  flooded_area_km2: number;
  at_risk_wash_facilities: number;
  total_wash_facilities: number;
  critical_communities: number;
  total_communities: number;
  average_wash_risk: number;
  accessibility_disruptions: number;
  priority_breakdown: Record<string, number>;
  alerts: { level: string; message: string }[];
}

export interface AgentTrace {
  intent: string;
  tool_used: string;
  retrieved_sources: { id: string; relevance: number; excerpt: string }[];
}

export interface AIResponse {
  answer: string;
  supporting_data: any[];
  confidence: number;
  recommendations: string[];
  agent_trace: AgentTrace;
}
