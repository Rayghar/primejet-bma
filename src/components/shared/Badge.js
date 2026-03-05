// File: src/components/shared/Badge.js
import React from 'react';

const toneStyles = {
  neutral: 'bg-white/5 border-white/10 text-slate-200',
  good: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
  warn: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  bad: 'bg-red-500/10 border-red-500/20 text-red-300',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const s = toneStyles[tone] || toneStyles.neutral;
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold border',
        s,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}