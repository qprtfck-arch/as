// Dependency-free SVG charts. Inline SVG inherits the CSS custom properties
// (var(--aqi-*)) defined in styles.css, so categories stay colour-consistent.
import { useState } from 'react';
import { COLOR, SHORT } from '../lib/aqi';
import type { SeriesPoint } from '../lib/data';

const niceMax = (v: number): number => {
  const steps = [10, 20, 30, 50, 75, 100, 150, 200, 300, 400, 500, 600, 800, 1000];
  for (const s of steps) if (v <= s) return s;
  return Math.ceil(v / 200) * 200;
};
const fmtHour = (t: string) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ---------------------------------------------------------------------------
// Forecast time-series: real history + AI forecast + observed actuals overlay.
// ---------------------------------------------------------------------------
export function ForecastChart({ history, forecast }: { history: SeriesPoint[]; forecast: SeriesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = 300, m = { t: 16, r: 16, b: 28, l: 38 };
  const pts = [...history, ...forecast];
  const n = pts.length;
  const vmax = niceMax(Math.max(...pts.map((p) => Math.max(p.pm25, p.actual ?? 0))) * 1.08);
  const xAt = (i: number) => m.l + (W - m.l - m.r) * (i / (n - 1));
  const yAt = (v: number) => m.t + (H - m.t - m.b) * (1 - Math.min(v, vmax) / vmax);

  const bands = [0, 12, 35.4, 55.4, 150.4, 250.4, vmax];
  const line = (arr: { x: number; y: number }[]) => arr.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const histPath = line(history.map((p, i) => ({ x: xAt(i), y: yAt(p.pm25) })));
  const fcPath = line([{ x: xAt(history.length - 1), y: yAt(history[history.length - 1].pm25) },
    ...forecast.map((p, i) => ({ x: xAt(history.length + i), y: yAt(p.pm25) }))]);
  const actualPath = line(forecast.map((p, i) => ({ x: xAt(history.length + i), y: yAt(p.actual ?? p.pm25) })));
  const divX = xAt(history.length - 1);

  const hv = hover != null ? pts[hover] : null;
  const isForecast = hover != null && hover >= history.length;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const frac = (e.clientX - r.left) / r.width;
          setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
        }}
        onPointerLeave={() => setHover(null)}>
        {/* category bands */}
        {bands.slice(0, -1).map((lo, k) => {
          const hi = bands[k + 1];
          const y = yAt(hi), h = yAt(lo) - yAt(hi);
          return <rect key={k} x={m.l} y={y} width={W - m.l - m.r} height={h} fill={COLOR[k]} opacity={0.07} />;
        })}
        {/* gridlines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={m.l} x2={W - m.r} y1={yAt(vmax * f)} y2={yAt(vmax * f)} stroke="var(--border)" />
            <text x={m.l - 7} y={yAt(vmax * f) + 4} textAnchor="end" fontSize="10" fill="var(--text-faint)">{Math.round(vmax * f)}</text>
          </g>
        ))}
        {/* forecast region shading */}
        <rect x={divX} y={m.t} width={W - m.r - divX} height={H - m.t - m.b} fill="var(--brand-2)" opacity={0.05} />
        <line x1={divX} x2={divX} y1={m.t} y2={H - m.b} stroke="var(--border-strong)" strokeDasharray="4 4" />
        {/* observed actuals during forecast window */}
        <path d={actualPath} fill="none" stroke="var(--text-faint)" strokeWidth={1.5} strokeDasharray="2 3" />
        {/* history + forecast */}
        <path d={histPath} fill="none" stroke="var(--brand)" strokeWidth={2.4} />
        <path d={fcPath} fill="none" stroke="var(--brand-2)" strokeWidth={2.4} strokeDasharray="6 4" />
        {/* hover marker */}
        {hover != null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={m.t} y2={H - m.b} stroke="var(--border-strong)" />
            <circle cx={xAt(hover)} cy={yAt(hv!.pm25)} r={4} fill={isForecast ? 'var(--brand-2)' : 'var(--brand)'} stroke="#0b1020" strokeWidth={2} />
          </g>
        )}
        {/* x labels */}
        {[0, history.length - 1, n - 1].map((i) => (
          <text key={i} x={xAt(i)} y={H - 9} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--text-faint)">{fmtHour(pts[i].t)}</text>
        ))}
      </svg>
      {hv && (
        <div className="chart-tip" style={{ left: `${(xAt(hover!) / W) * 100}%` }}>
          <div className="t">{new Date(hv.t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div className="v mono">{hv.pm25.toFixed(0)} µg/m³ · AQI {hv.aqi}</div>
          {isForecast && hv.actual != null && <div className="a mono">actual {hv.actual.toFixed(0)} µg/m³</div>}
          <div className="k">{isForecast ? 'AI forecast' : 'observed'}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact sparkline of recent readings (overview trend).
// ---------------------------------------------------------------------------
export function Sparkline({ points }: { points: SeriesPoint[] }) {
  const W = 560, H = 90, pad = 6;
  const vmax = niceMax(Math.max(...points.map((p) => p.pm25)) * 1.1);
  const xAt = (i: number) => pad + (W - 2 * pad) * (i / (points.length - 1));
  const yAt = (v: number) => pad + (H - 2 * pad) * (1 - v / vmax);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(p.pm25).toFixed(1)}`).join(' ');
  const area = `${path} L${xAt(points.length - 1)} ${H - pad} L${xAt(0)} ${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth={2} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Ring gauge for a single AQI value.
// ---------------------------------------------------------------------------
export function RingGauge({ aqi, category, big }: { aqi: number; category: number; big: string }) {
  const r = 64, C = 2 * Math.PI * r, frac = Math.min(aqi / 500, 1);
  return (
    <div style={{ position: 'relative', width: 168, height: 168 }}>
      <svg viewBox="0 0 168 168" width="168" height="168" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="84" cy="84" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
        <circle cx="84" cy="84" r={r} fill="none" stroke={COLOR[category]} strokeWidth="13" strokeLinecap="round"
          strokeDasharray={`${C * frac} ${C}`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 38, fontWeight: 650, lineHeight: 1 }}>{aqi}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>AQI · {big}</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut for the dataset class distribution.
// ---------------------------------------------------------------------------
export function Donut({ counts }: { counts: number[] }) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const r = 58, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 150 150" width="150" height="150">
      <g transform="rotate(-90 75 75)">
        {counts.map((c, k) => {
          const len = (c / total) * C;
          const seg = <circle key={k} cx="75" cy="75" r={r} fill="none" stroke={COLOR[k]} strokeWidth="20"
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return seg;
        })}
      </g>
      <text x="75" y="72" textAnchor="middle" fontSize="20" fontWeight="650" fill="var(--text)" className="mono">{(total / 1000).toFixed(0)}k</text>
      <text x="75" y="90" textAnchor="middle" fontSize="9.5" fill="var(--text-faint)">hours</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bars for standardized feature importance (signed).
// ---------------------------------------------------------------------------
export function ImportanceBars({ items }: { items: { name: string; weight: number }[] }) {
  const max = Math.max(...items.map((i) => Math.abs(i.weight)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it) => {
        const w = (Math.abs(it.weight) / max) * 100;
        const pos = it.weight >= 0;
        return (
          <div key={it.name} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 52px', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }} className="mono">{it.name}</span>
            <span style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${w}%`, borderRadius: 999, background: pos ? 'var(--aqi-3)' : 'var(--brand)' }} />
            </span>
            <span className="mono" style={{ fontSize: 12, textAlign: 'right', color: pos ? 'var(--aqi-3)' : 'var(--brand)' }}>
              {pos ? '+' : ''}{it.weight.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category probability bars (used by the predictor).
// ---------------------------------------------------------------------------
export function ProbBars({ probabilities }: { probabilities: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {probabilities.map((p, k) => (
        <div key={k} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 38px', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{SHORT[k]}</span>
          <span style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.max(p * 100, 0.5)}%`, borderRadius: 999, background: COLOR[k], transition: 'width 0.3s' }} />
          </span>
          <span className="mono" style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-dim)' }}>{(p * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}
