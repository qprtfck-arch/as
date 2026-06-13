import { Card, SectionTitle, Stat } from './ui';
import { Donut, ImportanceBars } from './charts';
import { SHORT, COLOR, CATEGORIES } from '../lib/aqi';
import type { AppData } from '../lib/data';

function Confusion({ matrix }: { matrix: number[][] }) {
  const rowSums = matrix.map((r) => r.reduce((a, b) => a + b, 0) || 1);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data" style={{ minWidth: 460 }}>
        <thead>
          <tr><th>actual ＼ pred</th>{SHORT.map((s) => <th key={s}>{s}</th>)}</tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td style={{ color: COLOR[i], fontWeight: 600 }}>{SHORT[i]}</td>
              {row.map((v, j) => {
                const a = v / rowSums[i];
                return (
                  <td key={j} className="mono" style={{
                    background: i === j ? `rgba(52,211,153,${0.12 + a * 0.5})` : `rgba(56,189,248,${a * 0.45})`,
                    color: a > 0.5 ? '#06121f' : 'var(--text-dim)', textAlign: 'center', borderRadius: 4,
                  }}>{v}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ModelInsights({ data }: { data: AppData }) {
  const { metrics } = data;
  const f = metrics.forecastModel;
  const ds = metrics.dataset;

  return (
    <>
      <SectionTitle title="Dataset & methodology" hint="reproducible — run npm run train" />
      <Card className="pad-lg">
        <div className="grid cols-4" style={{ gap: 14 }}>
          <Stat label="Source" value={<a href={ds.url} target="_blank" rel="noreferrer" style={{ fontSize: 18 }}>UCI · Beijing PM2.5</a>} sub={ds.station} />
          <Stat label="Coverage" value={`${(ds.totalRows / 1000).toFixed(0)}k h`} sub={ds.period} />
          <Stat label="Usable rows" value={`${(ds.usedRows / 1000).toFixed(1)}k`} sub={`${(ds.trainRows / 1000).toFixed(0)}k train · ${(ds.testRows / 1000).toFixed(0)}k test`} />
          <Stat label="Features" value={ds.features.length} sub="lags · weather · temporal · wind" />
        </div>
        <p className="note" style={{ marginTop: 14 }}>
          Split: {ds.split}. Two interpretable <strong>ridge-regression</strong> models predict next-hour PM2.5;
          AQI categories are derived from the predicted concentration via EPA breakpoints, with confidence from a
          Gaussian residual model. Everything runs client-side from exported weights.
        </p>
      </Card>

      <SectionTitle title="Forecast model — held-out performance" hint="vs. naïve baselines" />
      <div className="grid cols-4">
        <Card><Stat label="R²" value={f.r2.toFixed(3)} sub={`persistence ${f.baselinePersistenceR2.toFixed(3)}`} accent="var(--brand)" /></Card>
        <Card><Stat label="MAE / RMSE" value={`${f.mae.toFixed(1)}`} sub={`RMSE ${f.rmse.toFixed(1)} µg/m³`} /></Card>
        <Card><Stat label="AQI accuracy" value={`${(f.accuracy * 100).toFixed(1)}%`} sub={`persistence ${(f.baselinePersistenceAcc * 100).toFixed(1)}% · majority ${(f.baselineMajorityAcc * 100).toFixed(1)}%`} accent="var(--aqi-0)" /></Card>
        <Card><Stat label="Macro-F1" value={f.macroF1.toFixed(3)} sub="balanced across 6 classes" accent="var(--brand-2)" /></Card>
      </div>

      <div className="grid cols-2" style={{ marginTop: 18 }}>
        <Card className="pad-lg">
          <div className="card-head"><h3>Confusion matrix</h3><span className="hint">derived AQI categories</span></div>
          <Confusion matrix={f.confusion} />
        </Card>
        <Card className="pad-lg">
          <div className="card-head"><h3>Per-class metrics</h3><span className="hint">precision · recall · F1</span></div>
          <table className="data">
            <thead><tr><th>Category</th><th>Prec.</th><th>Recall</th><th>F1</th><th>n</th></tr></thead>
            <tbody>
              {f.perClass.map((c) => (
                <tr key={c.class}>
                  <td style={{ color: COLOR[c.class] }}>{SHORT[c.class]}</td>
                  <td className="mono">{c.precision.toFixed(2)}</td>
                  <td className="mono">{c.recall.toFixed(2)}</td>
                  <td className="mono">{c.f1.toFixed(2)}</td>
                  <td className="mono">{c.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid cols-2" style={{ marginTop: 18 }}>
        <Card className="pad-lg">
          <div className="card-head"><h3>Feature importance</h3><span className="hint">standardized ridge coefficients</span></div>
          <ImportanceBars items={metrics.featureImportance.forecast.slice(0, 9)} />
          <p className="note" style={{ marginTop: 12 }}>
            <span style={{ color: 'var(--aqi-3)' }}>Warm</span> raises pollution, <span style={{ color: 'var(--brand)' }}>cool</span> lowers it.
            Recent readings dominate; a NW wind clears the air — consistent with Beijing's meteorology.
          </p>
        </Card>
        <Card className="pad-lg">
          <div className="card-head"><h3>Class distribution</h3><span className="hint">full dataset</span></div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <Donut counts={metrics.classDistribution} />
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CATEGORIES.map((c, k) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--text-dim)' }}><span className="dot" style={{ color: COLOR[k], display: 'inline-block', marginRight: 6 }} />{c}</span>
                  <span className="mono" style={{ color: 'var(--text-faint)' }}>{(metrics.classDistribution[k] / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
