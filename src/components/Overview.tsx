import { Card, CategoryBadge, Stat, SectionTitle, CategoryLegend } from './ui';
import { RingGauge, Sparkline } from './charts';
import { adviceFor, COLOR } from '../lib/aqi';
import type { AppData } from '../lib/data';
import type { Tab } from '../App';

const fmtDate = (t: string) => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function Overview({ data, go }: { data: AppData; go: (t: Tab) => void }) {
  const { city, metrics } = data;
  const cur = city.latest;
  const w = cur.weather;
  const advice = adviceFor(cur.category);

  return (
    <>
      <section className="hero">
        <span className="eyebrow">◆ SmartScape 2026 · Track 2 — Ecology &amp; Urban Environment</span>
        <h1>Breathe with <span className="grad">foresight</span>, not hindsight.</h1>
        <p className="lead">
          AeroSense turns a city's air-quality sensors into a 12-hour <strong>AI forecast</strong> and
          personalised health guidance — so residents and authorities can act <em>before</em> pollution peaks,
          not after. Trained on 41,000+ hours of real monitoring data.
        </p>
        <div className="cta">
          <button className="btn primary" onClick={() => go('forecast')}>View live forecast →</button>
          <button className="btn" onClick={() => go('predict')}>Try the AI predictor</button>
        </div>
      </section>

      <SectionTitle title="Live city snapshot" hint={`${city.city} · ${city.station} station`} />
      <div className="grid cols-2">
        <Card className="pad-lg" style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
          <RingGauge aqi={cur.aqi} category={cur.category} big={data.metrics.categories[cur.category].split(' ')[0]} />
          <div style={{ minWidth: 180, flex: 1 }}>
            <CategoryBadge category={cur.category} />
            <div className="mono" style={{ fontSize: 30, fontWeight: 650, marginTop: 10 }}>
              {cur.pm25}<span style={{ fontSize: 14, color: 'var(--text-faint)' }}> µg/m³ PM2.5</span>
            </div>
            <p className="note" style={{ marginTop: 8 }}>{advice.headline}</p>
            <p className="note" style={{ marginTop: 10, color: 'var(--text-faint)' }}>Updated {fmtDate(city.updated)}</p>
          </div>
        </Card>

        <Card className="pad-lg">
          <div className="card-head"><h3>Conditions &amp; 48-hour trend</h3><span className="hint">PM2.5 µg/m³</span></div>
          <Sparkline points={city.history} />
          <div className="kpi-row" style={{ marginTop: 14 }}>
            <span className="chip">🌡 {w.temp}°C</span>
            <span className="chip">💧 dew {w.dewp}°C</span>
            <span className="chip">⏲ {w.pressure} hPa</span>
            <span className="chip">🧭 wind {w.wind} · {w.windSpeed} m/s</span>
          </div>
        </Card>
      </div>

      <SectionTitle title="District air-quality map" hint="illustrative spatial breakdown around the monitored value" />
      <div className="districts">
        {city.districts.map((d) => (
          <div key={d.name} className="district" style={{ borderColor: COLOR[d.category] + '55' }}>
            <span className="glow" style={{ background: COLOR[d.category] }} />
            <div className="name">{d.name}</div>
            <div className="pm" style={{ color: COLOR[d.category] }}>{d.pm25}<span className="unit"> µg/m³</span></div>
            <div style={{ marginTop: 8 }}><CategoryBadge category={d.category} label={`AQI ${d.aqi}`} /></div>
          </div>
        ))}
      </div>
      <CategoryLegend />

      <SectionTitle title="Model performance at a glance" hint="held-out chronological test set" />
      <div className="grid cols-4">
        <Card><Stat label="Forecast R²" value={metrics.forecastModel.r2.toFixed(3)} sub="next-hour PM2.5" accent="var(--brand)" /></Card>
        <Card><Stat label="Mean abs. error" value={`${metrics.forecastModel.mae.toFixed(1)}`} sub="µg/m³" /></Card>
        <Card><Stat label="AQI accuracy" value={`${(metrics.forecastModel.accuracy * 100).toFixed(0)}%`} sub={`macro-F1 ${metrics.forecastModel.macroF1.toFixed(2)}`} accent="var(--aqi-0)" /></Card>
        <Card><Stat label="Training data" value={`${(metrics.dataset.usedRows / 1000).toFixed(0)}k`} sub="real hourly records" /></Card>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={() => go('model')}>See full methodology &amp; metrics →</button>
      </div>
    </>
  );
}
