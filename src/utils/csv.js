// File: src/utils/csv.js

const esc = (v) => {
  const s = v == null ? '' : String(v);
  // wrap if contains comma, quote or newline
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const toCSV = (rows = [], columns = null) => {
  const arr = Array.isArray(rows) ? rows : [];
  if (!arr.length) return '';

  const cols = Array.isArray(columns) && columns.length
    ? columns
    : Object.keys(arr[0] || {});

  const header = cols.map(esc).join(',');
  const body = arr
    .map((r) => cols.map((c) => esc(r?.[c])).join(','))
    .join('\n');

  return `${header}\n${body}`;
};

export const downloadCSV = (filename, csvText) => {
  const blob = new Blob([csvText || ''], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};