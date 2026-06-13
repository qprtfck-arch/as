// Tiny linear-algebra helpers (dependency-free) used by the training pipeline.

/** Matrix (m x n) times vector (n) -> vector (m). */
export function matVec(A, x) {
  const m = A.length;
  const out = new Array(m);
  for (let i = 0; i < m; i++) {
    const row = A[i];
    let s = 0;
    for (let j = 0; j < row.length; j++) s += row[j] * x[j];
    out[i] = s;
  }
  return out;
}

/** A^T * A for an (m x n) matrix -> (n x n). */
export function gramMatrix(A) {
  const m = A.length;
  const n = A[0].length;
  const G = Array.from({ length: n }, () => new Float64Array(n));
  for (let k = 0; k < m; k++) {
    const row = A[k];
    for (let i = 0; i < n; i++) {
      const ri = row[i];
      if (ri === 0) continue;
      const Gi = G[i];
      for (let j = i; j < n; j++) Gi[j] += ri * row[j];
    }
  }
  // mirror upper triangle to lower
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) G[i][j] = G[j][i];
  return G;
}

/** A^T * y for an (m x n) matrix and (m) vector -> (n). */
export function matTvec(A, y) {
  const m = A.length;
  const n = A[0].length;
  const out = new Float64Array(n);
  for (let k = 0; k < m; k++) {
    const row = A[k];
    const yk = y[k];
    for (let i = 0; i < n; i++) out[i] += row[i] * yk;
  }
  return Array.from(out);
}

/**
 * Solve the linear system A x = b for a square matrix A using
 * Gauss-Jordan elimination with partial pivoting. A is not modified.
 */
export function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    // partial pivot
    let pivot = col;
    let maxAbs = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > maxAbs) { maxAbs = v; pivot = r; }
    }
    if (pivot !== col) { const t = M[col]; M[col] = M[pivot]; M[pivot] = t; }
    const pv = M[col][col] || 1e-12;
    for (let j = col; j <= n; j++) M[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}
