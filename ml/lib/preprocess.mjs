// Feature engineering and train/test preparation for the Beijing PM2.5 dataset.
import { pm25ToCategory } from './aqi.mjs';

// Weather + temporal + wind features used by the "scenario" model (no recent reading).
export const SCENARIO_FEATURES = [
  'DEWP', 'TEMP', 'PRES', 'Iws', 'Is', 'Ir',
  'hour_sin', 'hour_cos', 'month_sin', 'month_cos',
  'wind_NW', 'wind_NE', 'wind_SE',
];
// The "forecast" model additionally uses the recent trajectory (autoregressive):
// the last three hourly readings plus their rolling mean.
export const FORECAST_FEATURES = ['pm25_lag1', 'pm25_lag2', 'pm25_lag3', 'pm25_roll3', ...SCENARIO_FEATURES];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Parse raw CSV rows into typed, chronologically ordered records with lag columns. */
export function parseRecords(rows) {
  const recs = [];
  let l1 = null, l2 = null, l3 = null; // previous 1/2/3 hourly readings
  for (const r of rows) {
    const pm = r['pm2.5'] === 'NA' ? null : num(r['pm2.5']);
    recs.push({
      year: num(r.year), month: num(r.month), day: num(r.day), hour: num(r.hour),
      pm,
      prevPm: l1, prevPm2: l2, prevPm3: l3,
      DEWP: num(r.DEWP), TEMP: num(r.TEMP), PRES: num(r.PRES),
      cbwd: r.cbwd, Iws: num(r.Iws), Is: num(r.Is), Ir: num(r.Ir),
    });
    l3 = l2; l2 = l1; l1 = pm; // slide the window (gaps propagate as null)
  }
  return recs;
}

/** Build the engineered feature vector for one record. */
export function featurize(rec, withLag) {
  const hourRad = (2 * Math.PI * rec.hour) / 24;
  const monthRad = (2 * Math.PI * (rec.month - 1)) / 12;
  const base = [
    rec.DEWP, rec.TEMP, rec.PRES, rec.Iws, rec.Is, rec.Ir,
    Math.sin(hourRad), Math.cos(hourRad),
    Math.sin(monthRad), Math.cos(monthRad),
    rec.cbwd === 'NW' ? 1 : 0,
    rec.cbwd === 'NE' ? 1 : 0,
    rec.cbwd === 'SE' ? 1 : 0,
  ];
  if (!withLag) return base;
  const roll3 = (rec.prevPm + rec.prevPm2 + rec.prevPm3) / 3;
  return [rec.prevPm, rec.prevPm2, rec.prevPm3, roll3, ...base];
}

/** Column-wise mean and standard deviation over a matrix (population std, floored). */
export function standardizer(X) {
  const n = X[0].length;
  const mean = new Array(n).fill(0);
  const std = new Array(n).fill(0);
  for (const row of X) for (let j = 0; j < n; j++) mean[j] += row[j];
  for (let j = 0; j < n; j++) mean[j] /= X.length;
  for (const row of X) for (let j = 0; j < n; j++) { const d = row[j] - mean[j]; std[j] += d * d; }
  for (let j = 0; j < n; j++) std[j] = Math.sqrt(std[j] / X.length) || 1;
  return { mean, std };
}

/** Apply a standardizer to a matrix, returning a new standardized matrix. */
export function applyStandardizer(X, { mean, std }) {
  return X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]));
}

/**
 * Build a complete modelling dataset (features, regression target, class target)
 * from records, using a chronological train/test split.
 */
export function buildDataset(recs, { withLag, trainFrac = 0.8 }) {
  const X = [], yReg = [], yCls = [], meta = [];
  for (const r of recs) {
    if (r.pm === null) continue;
    if (withLag && (r.prevPm === null || r.prevPm2 === null || r.prevPm3 === null)) continue;
    if ([r.DEWP, r.TEMP, r.PRES, r.Iws, r.Is, r.Ir].some((v) => v === null)) continue;
    X.push(featurize(r, withLag));
    yReg.push(r.pm);
    yCls.push(pm25ToCategory(r.pm));
    meta.push(r);
  }
  const cut = Math.floor(X.length * trainFrac);
  const scaler = standardizer(X.slice(0, cut));
  const Xs = applyStandardizer(X, scaler);
  return {
    features: withLag ? FORECAST_FEATURES : SCENARIO_FEATURES,
    scaler,
    train: { X: Xs.slice(0, cut), yReg: yReg.slice(0, cut), yCls: yCls.slice(0, cut), meta: meta.slice(0, cut) },
    test: { X: Xs.slice(cut), yReg: yReg.slice(cut), yCls: yCls.slice(cut), meta: meta.slice(cut) },
    rawX: X,
  };
}
