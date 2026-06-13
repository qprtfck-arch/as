// Dependency-free model implementations: ridge regression (closed form) and
// multinomial logistic regression / softmax (batch gradient descent).
// Inputs are expected to be already standardized; a bias term is added internally.
import { gramMatrix, matTvec, solve } from './linalg.mjs';

const withBias = (X) => X.map((row) => [1, ...row]);

/**
 * Fit ridge regression: w = (XᵀX + λR)⁻¹ Xᵀy, where R does not penalize the bias.
 * @returns {number[]} weights, index 0 is the intercept.
 */
export function ridgeFit(X, y, lambda = 1.0) {
  const Xb = withBias(X);
  const G = gramMatrix(Xb);
  for (let i = 1; i < G.length; i++) G[i][i] += lambda; // skip intercept
  const b = matTvec(Xb, y);
  return solve(G, b);
}

/** Predict a single ridge-regression value for a standardized feature row. */
export function ridgePredict(w, x) {
  let s = w[0];
  for (let j = 0; j < x.length; j++) s += w[j + 1] * x[j];
  return s;
}

function softmax(logits) {
  let max = -Infinity;
  for (const v of logits) if (v > max) max = v;
  let sum = 0;
  const out = logits.map((v) => { const e = Math.exp(v - max); sum += e; return e; });
  for (let i = 0; i < out.length; i++) out[i] /= sum;
  return out;
}

/**
 * Fit multinomial logistic regression with L2 regularization via batch gradient descent.
 * @returns {{ W: number[][], history: number[] }} W is [K x (F+1)], index 0 of each row is bias.
 */
export function softmaxFit(X, y, K, { lr = 0.5, epochs = 200, l2 = 1e-3, log } = {}) {
  const Xb = withBias(X);
  const m = Xb.length;
  const F = Xb[0].length;
  const W = Array.from({ length: K }, () => new Float64Array(F));
  const history = [];

  for (let ep = 0; ep < epochs; ep++) {
    const grad = Array.from({ length: K }, () => new Float64Array(F));
    let loss = 0;
    for (let i = 0; i < m; i++) {
      const row = Xb[i];
      const logits = new Array(K);
      for (let k = 0; k < K; k++) {
        let s = 0; const Wk = W[k];
        for (let j = 0; j < F; j++) s += Wk[j] * row[j];
        logits[k] = s;
      }
      const p = softmax(logits);
      loss -= Math.log(Math.max(p[y[i]], 1e-12));
      for (let k = 0; k < K; k++) {
        const diff = p[k] - (y[i] === k ? 1 : 0);
        const gk = grad[k];
        for (let j = 0; j < F; j++) gk[j] += diff * row[j];
      }
    }
    for (let k = 0; k < K; k++) {
      const Wk = W[k], gk = grad[k];
      for (let j = 0; j < F; j++) {
        let g = gk[j] / m;
        if (j > 0) g += l2 * Wk[j]; // do not regularize bias
        Wk[j] -= lr * g;
      }
    }
    const avg = loss / m;
    history.push(avg);
    if (log && (ep % 25 === 0 || ep === epochs - 1)) log(`  epoch ${ep}  loss=${avg.toFixed(4)}`);
  }
  return { W: W.map((r) => Array.from(r)), history };
}

/** Class-probability vector for a standardized feature row. */
export function softmaxProba(W, x) {
  const row = [1, ...x];
  const logits = W.map((Wk) => {
    let s = 0;
    for (let j = 0; j < row.length; j++) s += Wk[j] * row[j];
    return s;
  });
  return softmax(logits);
}

/** Argmax class for a standardized feature row. */
export function softmaxPredict(W, x) {
  const p = softmaxProba(W, x);
  let best = 0;
  for (let k = 1; k < p.length; k++) if (p[k] > p[best]) best = k;
  return best;
}
