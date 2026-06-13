import { useMemo, useState } from 'react';
import { Card, CategoryBadge, SectionTitle } from './ui';
import { RingGauge, ProbBars } from './charts';
import { predictScenario, type ScenarioInputs } from '../lib/model';
import { adviceFor } from '../lib/aqi';
import type { AppData } from '../lib/data';

const WINDS: ScenarioInputs['wind'][] = ['NW', 'NE', 'SE', 'cv'];

const PRESETS: { label: string; v: Partial<ScenarioInputs> }[] = [
  { label: 'Winter rush hour', v: { temp: -4, dewp: -10, pres: 1028, windSpeed: 3, hour: 8, month: 1, wind: 'cv' } },
  { label: 'Summer afternoon', v: { temp: 31, dewp: 22, pres: 1004, windSpeed: 6, hour: 15, month: 7, wind: 'SE' } },
  { label: 'Strong NW front', v: { temp: 2, dewp: -18, pres: 1035, windSpeed: 90, hour: 22, month: 11, wind: 'NW' } },
];

function Slider({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="control">
      <div className="row"><label>{label}</label><span className="val">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function Predictor({ data }: { data: AppData }) {
  const [s, setS] = useState<ScenarioInputs>({
    dewp: -8, temp: 2, pres: 1024, windSpeed: 5, snowHours: 0, rainHours: 0, hour: 8, month: 1, wind: 'cv',
  });
  const [sensitive, setSensitive] = useState(false);
  const set = (patch: Partial<ScenarioInputs>) => setS((p) => ({ ...p, ...patch }));

  const pred = useMemo(() => predictScenario(data.model, s), [data.model, s]);
  const advice = adviceFor(pred.category);
  const tips = sensitive ? advice.sensitive : advice.general;

  return (
    <>
      <SectionTitle title="AI scenario predictor" hint="explore how weather & time shape air quality" />
      <div className="grid cols-2">
        <Card className="pad-lg">
          <div className="card-head"><h3>Conditions</h3><span className="hint">drag to update instantly</span></div>
          <div className="kpi-row" style={{ marginBottom: 16 }}>
            {PRESETS.map((p) => (
              <button key={p.label} className="chip" style={{ cursor: 'pointer' }} onClick={() => set(p.v)}>{p.label}</button>
            ))}
          </div>
          <Slider label="Temperature" value={s.temp} min={-25} max={40} unit="°C" onChange={(v) => set({ temp: v })} />
          <Slider label="Dew point" value={s.dewp} min={-40} max={28} unit="°C" onChange={(v) => set({ dewp: v })} />
          <Slider label="Pressure" value={s.pres} min={990} max={1045} unit=" hPa" onChange={(v) => set({ pres: v })} />
          <Slider label="Wind (cumulative)" value={s.windSpeed} min={0} max={150} unit=" m/s" onChange={(v) => set({ windSpeed: v })} />
          <Slider label="Hour of day" value={s.hour} min={0} max={23} unit=":00" onChange={(v) => set({ hour: v })} />
          <Slider label="Month" value={s.month} min={1} max={12} onChange={(v) => set({ month: v })} />
          <div className="control">
            <div className="row"><label>Wind direction</label></div>
            <div className="seg">
              {WINDS.map((d) => (
                <button key={d} className={s.wind === d ? 'on' : ''} onClick={() => set({ wind: d })}>{d === 'cv' ? 'Calm' : d}</button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
          <Card className="pad-lg">
            <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
              <RingGauge aqi={pred.aqi} category={pred.category} big={data.model.categories[pred.category].split(' ')[0]} />
              <div style={{ flex: 1, minWidth: 160 }}>
                <CategoryBadge category={pred.category} />
                <div className="mono" style={{ fontSize: 30, fontWeight: 650, marginTop: 10 }}>
                  {pred.pm25.toFixed(0)}<span style={{ fontSize: 14, color: 'var(--text-faint)' }}> µg/m³</span>
                </div>
                <p className="note" style={{ marginTop: 8 }}>Predicted PM2.5 concentration</p>
              </div>
            </div>
            <div className="divider" />
            <div className="card-head" style={{ marginBottom: 10 }}><h3 style={{ fontSize: 14 }}>Category confidence</h3><span className="hint">Gaussian residual model</span></div>
            <ProbBars probabilities={pred.probabilities} />
          </Card>

          <Card className="pad-lg">
            <div className="card-head">
              <h3>Health guidance</h3>
              <span className={`switch ${sensitive ? 'on' : ''}`} onClick={() => setSensitive((v) => !v)} role="switch" aria-checked={sensitive}>
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Sensitive groups</span>
                <span className="track"><span className="knob" /></span>
              </span>
            </div>
            <p style={{ fontSize: 14, marginBottom: 12 }}>{advice.headline}</p>
            <ul className="health-list">
              {tips.map((t, i) => <li key={i}><span className="ic">{sensitive ? '♥' : '✓'}</span>{t}</li>)}
            </ul>
          </Card>
        </div>
      </div>
      <p className="note" style={{ marginTop: 16 }}>
        The scenario model uses <strong>weather &amp; time only</strong> (no recent sensor readings), so it reveals how
        conditions shift the city's baseline pollution rather than producing a precise value
        (test R² {data.metrics.scenarioModel.r2.toFixed(2)}). For accurate short-term values, see the autoregressive
        Forecast model (R² {data.metrics.forecastModel.r2.toFixed(2)}).
      </p>
    </>
  );
}
