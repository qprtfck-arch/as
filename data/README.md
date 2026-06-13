# Dataset card — Beijing PM2.5

| | |
|---|---|
| **File** | `beijing_pm25.csv` |
| **Source** | [UCI Machine Learning Repository — Beijing PM2.5 Data](https://archive.ics.uci.edu/ml/datasets/Beijing+PM2.5+Data) |
| **Original provider** | Song Xi Chen, Guanghua School of Management, Peking University |
| **Reference** | Liang, X. et al. (2015). *Assessing Beijing's PM2.5 pollution: severity, weather impact, APEC and winter heating.* Proc. R. Soc. A. |
| **Rows** | 43,824 hourly records (2010-01-01 → 2014-12-31) |
| **License** | UCI ML Repository terms — research & educational use |

## Columns

| Column | Description | Unit |
|---|---|---|
| `year`, `month`, `day`, `hour` | Timestamp components | — |
| `pm2.5` | PM2.5 concentration (target) — `NA` where missing | µg/m³ |
| `DEWP` | Dew point | °C |
| `TEMP` | Temperature | °C |
| `PRES` | Pressure | hPa |
| `cbwd` | Combined wind direction (`NW`, `NE`, `SE`, `cv` = calm/variable) | — |
| `Iws` | Cumulated wind speed | m/s |
| `Is` | Cumulated hours of snow | h |
| `Ir` | Cumulated hours of rain | h |

## Preprocessing applied (`ml/lib/preprocess.mjs`)

1. Rows with a missing `pm2.5` target are dropped (≈ 2,067 rows) → **41,757 usable** rows.
2. **Engineered features:** previous 1/2/3-hour readings + 3-hour rolling mean (forecast model),
   cyclical `hour`/`month` (sine & cosine), and one-hot wind direction.
3. **Chronological 80/20 split** (no shuffling) to prevent temporal leakage.
4. **Standardisation** (z-score) fit on the training partition only.

The same CSV is committed so the entire pipeline is reproducible offline with `npm run train`.
