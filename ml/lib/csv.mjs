// Minimal, dependency-free CSV parser for the UCI Beijing PM2.5 dataset.
// The dataset contains no quoted fields, so a simple split is safe and fast.
import { readFileSync } from 'node:fs';

/**
 * Parse a CSV file into a header array and an array of row objects.
 * @param {string} path
 * @returns {{ header: string[], rows: Record<string,string>[] }}
 */
export function parseCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n');
  const header = lines[0].split(',').map((h) => h.trim());
  const rows = new Array(lines.length - 1);
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    const obj = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cells[j];
    rows[i - 1] = obj;
  }
  return { header, rows };
}
