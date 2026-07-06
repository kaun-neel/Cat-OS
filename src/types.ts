// Shared domain types used across the app. These mirror the shapes returned
// by the backend API (server/index.js) — no mock data lives here anymore.

export type RiskStatus = "STABLE" | "MONITOR" | "ATTENTION";

export interface TimelineEntry {
  id: string;
  catId: string;
  date: string;
  type: "scan" | "behavior" | "feeding" | "vet";
  title: string;
  note: string;
  weight?: number;
  riskScore?: number;
  photo?: string;
}

export interface VaccineRecord {
  id: string;
  catId: string;
  vaccine: string;
  lastGiven: string;
  nextDue: string;
  status: "current" | "overdue" | "upcoming";
}

export interface VetVisit {
  id: string;
  catId: string;
  date: string;
  vet: string;
  reason: string;
  notes: string;
  attachment?: { name: string; url: string };
}

export interface FeedingEntry {
  id: string;
  catId: string;
  day: string;
  time: string;
  portion: string;
  food: string;
  notes: string;
  reminder: boolean;
}

export interface BehaviorLog {
  id: string;
  catId: string;
  date: string;
  tags: string[];
  interpretation: string;
  confidence: string;
  action: string;
}

export interface VetPlace {
  id: string;
  name: string;
  type: "vet" | "shelter";
  distance: string;
  rating: number | null;
  address: string;
  phone: string | null;
  website?: string | null;
  lat: number | null;
  lon: number | null;
}

export const behaviorTagOptions = [
  "Hiding",
  "Excessive grooming",
  "Vocalizing",
  "Appetite change",
  "Litter box changes",
  "Lethargy",
  "Aggression",
  "Restlessness",
];
