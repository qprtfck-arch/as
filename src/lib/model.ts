// In-browser inference engine.
//
// Loads the ridge-regression weights exported by ml/train.mjs and reproduces the
// exact training-time preprocessing (standardisation → linear model). AQI category
// confidence is obtained by integrating a Gaussian residual model over EPA bins —
// the same residual std the model achieved on the held-out test set.
import { BIN_EDGES, pm25ToAqi, pm25ToCategory } from './aqi';

export interface Regressor {
  features: string[];
  mean: number[];
  std: number[];
  weights: number[]; // index 0 is the intercept
  residualStd: number;
}
export interface ModelBundle {
  generatedAt: string;
  categories: string[];
  forecastRegressor: Regressor;
  scenarioRegressor: Regressor;
}

/** Standardise a raw feature vector and apply the linear model. */
export function predictLinear(reg: Regressor, raw: number[]): number {
  let y = reg.weights[0];
  for (let j = 0; j < raw.length; j++) {
    const xs = (raw[j] - reg.mean[j]) / reg.std[j];
    y += reg.weights[j + 1] * xs;
  }
  return y;
}

// --- Gaussian helpers for category confidence -------------------------------
function erf(x: number): number {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
function normalCdf(x: number): number {
  if (x === Infinity) return 1;
  if (x === -Infinity) return 0;
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Probability mass over the six AQI categories for a prediction with uncertainty σ. */
export function categoryProbabilities(pred: number, sigma: number): number[] {
  const s = Math.max(sigma, 1e-6);
  const probs: number[] = [];
  for (let k = 0; k < 6; k++) {
    probs.push(normalCdf((BIN_EDGES[k + 1] - pred) / s) - normalCdf((BIN_EDGES[k] - pred) / s));
  }
  const total = probs.reduce((a, b) => a + b, 0) || 1;
  return probs.map((p) => p / total);
}

// --- Feature builders (order must match ml/lib/preprocess.mjs) ---------------
export interface ScenarioInputs {
  dewp: number; temp: number; pres: number; windSpeed: number;
  snowHours: number; rainHours: number; hour: number; month: number;
  wind: 'NW' | 'NE' | 'SE' | 'cv';
}

function temporalAndWind(i: { hour: number; month: number; wind: string }): number[] {
  const hr = (2 * Math.PI * i.hour) / 24;
  const mo = (2 * Math.PI * (i.month - 1)) / 12;
  return [
    Math.sin(hr), Math.cos(hr), Math.sin(mo), Math.cos(mo),
    i.wind === 'NW' ? 1 : 0, i.wind === 'NE' ? 1 : 0, i.wind === 'SE' ? 1 : 0,
  ];
}

export interface Prediction {
  pm25: number; aqi: number; category: number; probabilities: number[];
}

/** Scenario model: predict PM2.5 from weather + time only (the interactive what-if). */
export function predictScenario(model: ModelBundle, i: ScenarioInputs): Prediction {
  const raw = [i.dewp, i.temp, i.pres, i.windSpeed, i.snowHours, i.rainHours, ...temporalAndWind(i)];
  const pm = Math.max(0, predictLinear(model.scenarioRegressor, raw));
  return {
    pm25: pm, aqi: pm25ToAqi(pm), category: pm25ToCategory(pm),
    probabilities: categoryProbabilities(pm, model.scenarioRegressor.residualStd),
  };
}

export interface ForecastInputs {
  lag1: number; lag2: number; lag3: number;
  dewp: number; temp: number; pres: number; windSpeed: number;
  snowHours: number; rainHours: number; hour: number; month: number;
  wind: 'NW' | 'NE' | 'SE' | 'cv';
}

/** Forecast model: next-hour nowcast from the recent trajectory + weather + time. */
export function predictForecast(model: ModelBundle, i: ForecastInputs): Prediction {
  const roll3 = (i.lag1 + i.lag2 + i.lag3) / 3;
  const raw = [i.lag1, i.lag2, i.lag3, roll3, i.dewp, i.temp, i.pres, i.windSpeed, i.snowHours, i.rainHours, ...temporalAndWind(i)];
  const pm = Math.max(0, predictLinear(model.forecastRegressor, raw));
  return {
    pm25: pm, aqi: pm25ToAqi(pm), category: pm25ToCategory(pm),
    probabilities: categoryProbabilities(pm, model.forecastRegressor.residualStd),
  };
}
