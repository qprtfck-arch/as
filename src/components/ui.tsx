// Small presentational building blocks shared across screens.
import type { ReactNode } from 'react';
import { CATEGORIES, COLOR } from '../lib/aqi';

export function CategoryBadge({ category, label }: { category: number; label?: string }) {
  return (
    <span className="badge" style={{ color: COLOR[category] }}>
      <span className="dot" />
      {label ?? CATEGORIES[category]}
    </span>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="value" style={accent ? { color: accent } : undefined}>{value}</span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>;
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {hint && <span>{hint}</span>}
    </div>
  );
}

export function CategoryLegend() {
  return (
    <div className="legend">
      {CATEGORIES.map((c, k) => (
        <span className="item" key={k}><span className="dot" style={{ color: COLOR[k] }} />{c}</span>
      ))}
    </div>
  );
}
