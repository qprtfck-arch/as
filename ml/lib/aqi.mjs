// US EPA PM2.5 -> AQI conversion and category breakpoints.
// Shared logic mirrored in the frontend (src/lib/aqi.ts) so that the
// training pipeline and the website agree on every threshold.

// Category order is fixed: index === model class label.
export const CATEGORIES = [
  'Good',
  'Moderate',
  'Unhealthy for Sensitive Groups',
  'Unhealthy',
  'Very Unhealthy',
  'Hazardous',
];

// PM2.5 concentration breakpoints (µg/m³) -> [AQI low, AQI high] (US EPA, 2024 update simplified).
const PM_BREAKPOINTS = [
  { cLow: 0.0, cHigh: 12.0, aLow: 0, aHigh: 50, cat: 0 },
  { cLow: 12.1, cHigh: 35.4, aLow: 51, aHigh: 100, cat: 1 },
  { cLow: 35.5, cHigh: 55.4, aLow: 101, aHigh: 150, cat: 2 },
  { cLow: 55.5, cHigh: 150.4, aLow: 151, aHigh: 200, cat: 3 },
  { cLow: 150.5, cHigh: 250.4, aLow: 201, aHigh: 300, cat: 4 },
  { cLow: 250.5, cHigh: 500.4, aLow: 301, aHigh: 500, cat: 5 },
];

/** Map a PM2.5 concentration (µg/m³) to its AQI category index (0..5). */
export function pm25ToCategory(pm) {
  for (let i = 0; i < PM_BREAKPOINTS.length; i++) {
    if (pm <= PM_BREAKPOINTS[i].cHigh) return PM_BREAKPOINTS[i].cat;
  }
  return 5; // beyond the scale -> Hazardous
}

/** Map a PM2.5 concentration to a numeric AQI value (0..500) via EPA piecewise-linear formula. */
export function pm25ToAqi(pm) {
  const p = Math.max(0, pm);
  for (const b of PM_BREAKPOINTS) {
    if (p <= b.cHigh) {
      return Math.round(((b.aHigh - b.aLow) / (b.cHigh - b.cLow)) * (p - b.cLow) + b.aLow);
    }
  }
  return 500;
}
