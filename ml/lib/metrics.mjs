// Evaluation metrics for classification and regression (dependency-free).

export function accuracy(yTrue, yPred) {
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) if (yTrue[i] === yPred[i]) correct++;
  return correct / yTrue.length;
}

export function confusionMatrix(yTrue, yPred, K) {
  const M = Array.from({ length: K }, () => new Array(K).fill(0));
  for (let i = 0; i < yTrue.length; i++) M[yTrue[i]][yPred[i]]++;
  return M;
}

/** Per-class precision / recall / F1 plus the macro-averaged F1. */
export function classReport(yTrue, yPred, K) {
  const M = confusionMatrix(yTrue, yPred, K);
  const perClass = [];
  let macroF1 = 0, counted = 0;
  for (let k = 0; k < K; k++) {
    let tp = M[k][k], fp = 0, fn = 0, support = 0;
    for (let i = 0; i < K; i++) { if (i !== k) { fp += M[i][k]; fn += M[k][i]; } support += M[k][i]; }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    perClass.push({ class: k, precision, recall, f1, support });
    if (support > 0) { macroF1 += f1; counted++; }
  }
  return { perClass, macroF1: counted ? macroF1 / counted : 0, confusion: M };
}

export function r2(yTrue, yPred) {
  const mean = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < yTrue.length; i++) {
    ssRes += (yTrue[i] - yPred[i]) ** 2;
    ssTot += (yTrue[i] - mean) ** 2;
  }
  return 1 - ssRes / ssTot;
}

export function mae(yTrue, yPred) {
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) s += Math.abs(yTrue[i] - yPred[i]);
  return s / yTrue.length;
}

export function rmse(yTrue, yPred) {
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) s += (yTrue[i] - yPred[i]) ** 2;
  return Math.sqrt(s / yTrue.length);
}
