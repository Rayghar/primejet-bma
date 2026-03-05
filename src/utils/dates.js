// File: src/utils/dates.js

export const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const startOfDay = (v) => {
  const d = toDate(v);
  if (!d) return null;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const endOfDay = (v) => {
  const d = toDate(v);
  if (!d) return null;
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const isoDate = (v) => {
  const d = toDate(v);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
};

export const monthKey = (v) => {
  const d = toDate(v);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};