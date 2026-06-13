// Typed loaders for the artifacts produced by ml/train.mjs (served from /public).
import type { ModelBundle } from './model';

export interface PerClass { class: number; precision: number; recall: number; f1: number; support: number; }
export interface Metrics {
  generatedAt: string;
  categories: string[];
  dataset: {
    name: string; url: string; station: string; period: string;
    totalRows: number; usedRows: number; trainRows: number; testRows: number;
    split: string; features: string[];
  };
  forecastModel: {
    r2: number; mae: number; rmse: number; accuracy: number; macroF1: number;
    perClass: PerClass[]; confusion: number[][];
    baselinePersistenceR2: number; baselinePersistenceAcc: number; baselineMajorityAcc: number;
  };
  scenarioModel: { r2: number; mae: number; rmse: number; accuracy: number; macroF1: number };
  featureImportance: { forecast: { name: string; weight: number }[]; scenario: { name: string; weight: number }[] };
  classDistribution: number[];
}

export interface SeriesPoint { t: string; pm25: number; aqi: number; actual?: number; }
export interface District { name: string; factor: number; pm25: number; aqi: number; category: number; }
export interface City {
  city: string; station: string; pollutant: string; note: string; updated: string;
  latest: {
    pm25: number; aqi: number; category: number;
    weather: { temp: number; dewp: number; pressure: number; windSpeed: number; wind: 'NW' | 'NE' | 'SE' | 'cv'; snowHours?: number; rainHours?: number };
  };
  history: SeriesPoint[];
  forecast: SeriesPoint[];
  districts: District[];
}

export interface AppData { model: ModelBundle; metrics: Metrics; city: City; }

const base = import.meta.env.BASE_URL;

export async function loadData(): Promise<AppData> {
  const [model, metrics, city] = await Promise.all([
    fetch(`${base}model.json`).then((r) => r.json() as Promise<ModelBundle>),
    fetch(`${base}metrics.json`).then((r) => r.json() as Promise<Metrics>),
    fetch(`${base}city.json`).then((r) => r.json() as Promise<City>),
  ]);
  return { model, metrics, city };
}
