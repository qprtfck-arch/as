import { Card, SectionTitle } from './ui';
import type { AppData } from '../lib/data';

const PIPELINE = [
  ['Real data', '41k+ hourly records from a city air-quality station (UCI Beijing PM2.5).'],
  ['Feature engineering', 'Recent-reading lags, rolling mean, weather, cyclical time, wind direction.'],
  ['Ridge regression', 'Two interpretable models — autoregressive forecast + weather-only scenario.'],
  ['EPA categorisation', 'Predicted PM2.5 → AQI category, with Gaussian-residual confidence.'],
  ['Browser inference', 'Exported weights run client-side — no backend, no API keys, instant.'],
];

export default function About({ data }: { data: AppData }) {
  return (
    <>
      <SectionTitle title="The problem & our solution" hint="SmartScape Track 2 — Ecology & Urban Environment" />
      <div className="grid cols-2">
        <Card className="pad-lg">
          <h3 style={{ marginBottom: 10 }}>Cities react to pollution after it has already harmed people.</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5 }}>
            Air pollution causes an estimated <strong>7 million premature deaths a year</strong> (WHO), and fine
            particulate matter (PM2.5) is the single most damaging component. Yet most municipal dashboards only
            show the air quality <em>right now</em>. Schools, commuters and vulnerable residents learn that the air
            was dangerous only once they are already breathing it.
          </p>
        </Card>
        <Card className="pad-lg">
          <h3 style={{ marginBottom: 10 }}>AeroSense gives cities a 12-hour head start.</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: 14.5 }}>
            By forecasting PM2.5 hour-by-hour and translating it into clear health guidance, AeroSense lets
            authorities act <strong>before</strong> a pollution peak — issuing alerts, adjusting traffic, or
            protecting sensitive groups — and lets residents plan their day around clean-air windows.
          </p>
        </Card>
      </div>

      <SectionTitle title="How it works" hint="end-to-end, fully reproducible" />
      <Card className="pad-lg">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {PIPELINE.map(([t, d], i) => (
            <div key={t} style={{ position: 'relative' }}>
              <div className="mono" style={{ color: 'var(--brand)', fontSize: 13 }}>0{i + 1}</div>
              <div style={{ fontWeight: 600, fontSize: 14, margin: '4px 0 6px' }}>{t}</div>
              <p className="note">{d}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid cols-3" style={{ marginTop: 18 }}>
        <Card className="pad-lg">
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Practical applicability</h3>
          <p className="note" style={{ fontSize: 13.5 }}>
            The model only needs a station's recent readings + weather — data every city already collects. Inference
            is client-side, so it deploys as a static site on a kiosk, a municipal portal, or a public dashboard with
            near-zero infrastructure cost.
          </p>
        </Card>
        <Card className="pad-lg">
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Why it's trustworthy</h3>
          <p className="note" style={{ fontSize: 13.5 }}>
            Chronological train/test split (no leakage), comparison against persistence &amp; majority baselines,
            interpretable coefficients, and honest reporting of where the weather-only model is weak. R²
            {' '}{data.metrics.forecastModel.r2.toFixed(3)} on unseen data.
          </p>
        </Card>
        <Card className="pad-lg">
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Roadmap</h3>
          <p className="note" style={{ fontSize: 13.5 }}>
            Multi-station spatial maps, gradient-boosted trees for sharper peaks, live sensor + satellite (Copernicus)
            ingestion, and push notifications for sensitive-group users.
          </p>
        </Card>
      </div>

      <SectionTitle title="Built with" hint="lean, dependency-light, transparent" />
      <Card className="pad-lg">
        <div className="kpi-row">
          {['React 18', 'TypeScript', 'Vite', 'Custom ML in Node (no ML libs)', 'Hand-rolled SVG charts', 'UCI Beijing PM2.5'].map((t) => (
            <span className="chip" key={t}>{t}</span>
          ))}
        </div>
        <p className="note" style={{ marginTop: 14 }}>
          The entire machine-learning pipeline — CSV parsing, standardisation, ridge regression and evaluation — is
          implemented from scratch in plain JavaScript (<span className="mono">ml/</span>), so the maths is fully
          auditable. A mirrored Python notebook documents the same methodology.
        </p>
      </Card>
    </>
  );
}
