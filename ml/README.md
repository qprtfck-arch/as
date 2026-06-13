# ML pipeline

A dependency-free machine-learning pipeline in plain Node.js. No `scikit-learn`, no `tensorflow` —
every step (CSV parsing, standardisation, ridge regression, evaluation) is implemented from scratch in
`lib/` so the maths is fully auditable.

```bash
node train.mjs        # or: npm run train  (from the repo root)
```

## What it does

1. Loads `../data/beijing_pm25.csv` (43,824 hourly records).
2. Builds two datasets — **forecast** (with recent-reading lags) and **scenario** (weather + time only).
3. Trains a **ridge regression** for each (closed-form normal equations with L2).
4. Evaluates on a held-out chronological test set: R², MAE, RMSE, derived AQI-category accuracy,
   macro-F1, confusion matrix, and naïve baselines (persistence & majority).
5. Exports artifacts to `../public/`:
   - `model.json` — weights, feature scalers, residual std (consumed by the browser inference engine).
   - `metrics.json` — the full evaluation report rendered on the **Model** screen.
   - `city.json` — a real elevated pollution episode + a 12-hour autoregressive forecast vs. actual.

## Files

| File | Responsibility |
|---|---|
| `lib/csv.mjs` | Minimal CSV parser |
| `lib/preprocess.mjs` | Feature engineering, lags, standardisation, train/test split |
| `lib/models.mjs` | Ridge regression (and a softmax implementation) |
| `lib/metrics.mjs` | Accuracy, F1, confusion matrix, R², MAE, RMSE |
| `lib/aqi.mjs` | EPA PM2.5 → AQI breakpoints (mirrored in `src/lib/aqi.ts`) |
| `lib/linalg.mjs` | Matrix helpers + Gauss–Jordan solver |
| `train.mjs` | Orchestrates the pipeline and writes artifacts |

The browser reproduces the exact same preprocessing (`src/lib/model.ts`) so predictions match training.
