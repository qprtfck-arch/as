import { useMemo } from 'react';
import { Card, CategoryBadge, SectionTitle, Stat } from './ui';
import { ForecastChart } from './charts';
import { predictForecast } from '../lib/model';
import { pm25ToCategory } from '../lib/aqi';
import type { AppData } from '../lib/data';

const fmt = (t: string) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Forecast({ data }: { data: AppData }) {
  const { city, model } = data;
  const h = city.history;
  const w = city.latest.weather;

  // Live in-browser nowcast for the next hour, computed from the exported weights.
  const nowcast = useMemo(() => {
    const d = new Date(city.updated);
    return predictForecast(model, {
      lag1: city.latest.pm25,
      lag2: h[h.length - 2].pm25,
      lag3: h[h.length - 3].pm25,
      dewp: w.dewp, temp: w.temp, pres: w.pressure, windSpeed: w.windSpeed,
      snowHours: w.snowHours ?? 0, rainHours: w.rainHours ?? 0,
      hour: (d.getUTCHours() + 1) % 24, month: d.getUTCMonth() + 1, wind: w.wind,
    });
  }, [city, model, h, w]);

  const mae = useMemo(() => {
    const e = city.forecast.filter((p) => p.actual != null).map((p) => Math.abs(p.pm25 - (p.actual as number)));
    return e.reduce((a, b) => a + b, 0) / (e.length || 1);
  }, [city]);

  return (
    <>
      <SectionTitle title="12-hour AI air-quality forecast" hint={`${city.city} · model-generated, replayed against real observations`} />
      <Card className="pad-lg">
        <ForecastChart history={city.history} forecast={city.forecast} />
        <div className="legend" style={{ marginTop: 14 }}>
          <span className="item"><span style={{ width: 18, height: 0, borderTop: '2.4px solid var(--brand)' }} /> Observed history</span>
          <span className="item"><span style={{ width: 18, height: 0, borderTop: '2.4px dashed var(--brand-2)' }} /> AI forecast</span>
          <span className="item"><span style={{ width: 18, height: 0, borderTop: '1.5px dotted var(--text-faint)' }} /> Actual (next 12h)</span>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          The forecast is produced autoregressively: each hour's prediction is fed back as the next input,
          so error compounds with horizon — exactly how an operational nowcast behaves. Mean absolute error
          over this window: <strong className="mono">{mae.toFixed(1)} µg/m³</strong>.
        </p>
      </Card>

      <div className="grid cols-2" style={{ marginTop: 18 }}>
        <Card className="pad-lg">
          <div className="card-head"><h3>Live next-hour nowcast</h3><span className="hint">computed in your browser</span></div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Stat label="Predicted PM2.5" value={`${nowcast.pm25.toFixed(0)}`} sub="µg/m³ · next hour" accent="var(--brand)" />
            <Stat label="AQI" value={nowcast.aqi} />
            <CategoryBadge category={nowcast.category} />
          </div>
          <p className="note" style={{ marginTop: 12 }}>
            Inference runs entirely client-side from the ridge-regression weights in <span className="mono">model.json</span> —
            no backend, no API calls. Seeded with the latest three readings and current weather.
          </p>
        </Card>

        <Card className="pad-lg">
          <div className="card-head"><h3>Forecast vs. observation</h3><span className="hint">hour-by-hour</span></div>
          <div style={{ maxHeight: 240, overflow: 'auto' }}>
            <table className="data">
              <thead><tr><th>Time</th><th>Forecast</th><th>Actual</th><th>Δ</th><th>Category</th></tr></thead>
              <tbody>
                {city.forecast.map((p) => {
                  const err = p.actual != null ? p.pm25 - p.actual : null;
                  return (
                    <tr key={p.t}>
                      <td>{fmt(p.t)}</td>
                      <td className="mono">{p.pm25.toFixed(0)}</td>
                      <td className="mono">{p.actual != null ? p.actual.toFixed(0) : '—'}</td>
                      <td className="mono" style={{ color: err != null && Math.abs(err) > 25 ? 'var(--aqi-3)' : 'var(--text-dim)' }}>
                        {err != null ? `${err > 0 ? '+' : ''}${err.toFixed(0)}` : '—'}
                      </td>
                      <td><CategoryBadge category={pm25ToCategory(p.pm25)} label="" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
