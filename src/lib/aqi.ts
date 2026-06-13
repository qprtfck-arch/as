// US EPA PM2.5 → AQI logic, category metadata and health guidance.
// Mirrors ml/lib/aqi.mjs so the website and the training pipeline agree exactly.

export const CATEGORIES = [
  'Good',
  'Moderate',
  'Unhealthy for Sensitive Groups',
  'Unhealthy',
  'Very Unhealthy',
  'Hazardous',
] as const;

export const SHORT = ['Good', 'Moderate', 'Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];

/** CSS custom-property colour per category index. */
export const COLOR = ['var(--aqi-0)', 'var(--aqi-1)', 'var(--aqi-2)', 'var(--aqi-3)', 'var(--aqi-4)', 'var(--aqi-5)'];

interface Breakpoint { cLow: number; cHigh: number; aLow: number; aHigh: number; cat: number; }
const PM_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0.0, cHigh: 12.0, aLow: 0, aHigh: 50, cat: 0 },
  { cLow: 12.1, cHigh: 35.4, aLow: 51, aHigh: 100, cat: 1 },
  { cLow: 35.5, cHigh: 55.4, aLow: 101, aHigh: 150, cat: 2 },
  { cLow: 55.5, cHigh: 150.4, aLow: 151, aHigh: 200, cat: 3 },
  { cLow: 150.5, cHigh: 250.4, aLow: 201, aHigh: 300, cat: 4 },
  { cLow: 250.5, cHigh: 500.4, aLow: 301, aHigh: 500, cat: 5 },
];

/** Lower edges of each category bin (µg/m³), used for probability integration. */
export const BIN_EDGES = [-Infinity, 12.05, 35.45, 55.45, 150.45, 250.45, Infinity];

export function pm25ToCategory(pm: number): number {
  for (const b of PM_BREAKPOINTS) if (pm <= b.cHigh) return b.cat;
  return 5;
}

export function pm25ToAqi(pm: number): number {
  const p = Math.max(0, pm);
  for (const b of PM_BREAKPOINTS) {
    if (p <= b.cHigh) return Math.round(((b.aHigh - b.aLow) / (b.cHigh - b.cLow)) * (p - b.cLow) + b.aLow);
  }
  return 500;
}

export interface HealthAdvice {
  headline: string;
  general: string[];
  sensitive: string[];
}

const ADVICE: HealthAdvice[] = [
  {
    headline: 'Air quality is satisfactory and poses little or no risk.',
    general: ['Enjoy outdoor activities as usual.', 'Great conditions for exercise and ventilation.'],
    sensitive: ['No precautions needed for sensitive groups.'],
  },
  {
    headline: 'Acceptable air quality; a minor concern for unusually sensitive people.',
    general: ['Outdoor activity is fine for the general population.'],
    sensitive: ['Unusually sensitive individuals should consider limiting prolonged exertion outdoors.'],
  },
  {
    headline: 'Sensitive groups may experience health effects.',
    general: ['The general public is unlikely to be affected.'],
    sensitive: ['People with asthma, heart/lung disease, children and older adults should reduce prolonged outdoor exertion.', 'Keep quick-relief medication handy.'],
  },
  {
    headline: 'Everyone may begin to experience health effects.',
    general: ['Reduce prolonged or heavy outdoor exertion.', 'Take more breaks during outdoor activity.'],
    sensitive: ['Avoid prolonged outdoor exertion.', 'Move activities indoors and keep windows closed.'],
  },
  {
    headline: 'Health alert: the risk of effects is increased for everyone.',
    general: ['Avoid prolonged outdoor exertion.', 'Run an air purifier and keep windows closed.'],
    sensitive: ['Remain indoors and keep activity levels low.', 'Use an N95 mask if going outside is unavoidable.'],
  },
  {
    headline: 'Emergency conditions: everyone is more likely to be affected.',
    general: ['Avoid all outdoor physical activity.', 'Stay indoors with filtered air.'],
    sensitive: ['Remain indoors, minimise exertion and follow medical guidance.', 'Wear an N95 respirator outdoors; seek medical help if symptoms appear.'],
  },
];

export function adviceFor(category: number): HealthAdvice {
  return ADVICE[Math.max(0, Math.min(5, category))];
}
