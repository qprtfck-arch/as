import { useEffect, useState } from 'react';
import { loadData, type AppData } from './lib/data';
import Overview from './components/Overview';
import Forecast from './components/Forecast';
import Predictor from './components/Predictor';
import ModelInsights from './components/ModelInsights';
import About from './components/About';

export type Tab = 'overview' | 'forecast' | 'predict' | 'model' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'predict', label: 'Predict' },
  { id: 'model', label: 'Model' },
  { id: 'about', label: 'About' },
];

const REPO = 'https://github.com/qprtfck-arch/as';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    loadData().then(setData).catch((e) => setError(String(e)));
  }, []);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <span className="logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 13c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 17c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 9c3 0 3-2 6-2s3 2 6 2 3-2 6-2"
                  stroke="#06121f" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="name">AeroSense<span className="tag"> · air intelligence</span></span>
          </div>
          {data && (
            <nav className="tabs">
              {TABS.map((t) => (
                <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="shell">
        {error && (
          <div className="center-screen"><div>
            <p>Could not load model artifacts.</p>
            <p className="note">{error} — run <span className="mono">npm run train</span> first.</p>
          </div></div>
        )}
        {!error && !data && (
          <div className="center-screen"><div style={{ textAlign: 'center' }}>
            <div className="spinner" /> Loading air-quality intelligence…
          </div></div>
        )}
        {data && (
          <>
            {tab === 'overview' && <Overview data={data} go={setTab} />}
            {tab === 'forecast' && <Forecast data={data} />}
            {tab === 'predict' && <Predictor data={data} />}
            {tab === 'model' && <ModelInsights data={data} />}
            {tab === 'about' && <About data={data} />}

            <footer className="footer">
              <span>AeroSense — SmartScape Hackathon 2026 · Track 2 (Ecology &amp; Urban Environment)</span>
              <span>
                <a href={REPO} target="_blank" rel="noreferrer">GitHub</a> ·{' '}
                <a href={data.metrics.dataset.url} target="_blank" rel="noreferrer">Dataset</a> ·{' '}
                <span className="mono">model {new Date(data.model.generatedAt).toISOString().slice(0, 10)}</span>
              </span>
            </footer>
          </>
        )}
      </main>
    </>
  );
}
