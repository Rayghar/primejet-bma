// src/components/shared/HelpTooltip.js
import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpTooltip({ text, label = 'More info', className = '' }) {
  if (!text) return null;
  return (
    <span className={`relative inline-flex items-center group ${className}`} tabIndex={0} aria-label={label}>
      <HelpCircle size={14} className="text-sky-300/80 hover:text-sky-200 cursor-help" />
      <span className="pointer-events-none absolute z-50 hidden group-hover:block group-focus:block left-1/2 -translate-x-1/2 top-6 w-72 rounded-xl border border-white/10 bg-slate-950/95 p-3 text-[11px] leading-relaxed text-slate-100 shadow-2xl backdrop-blur">
        {text}
      </span>
    </span>
  );
}

export function HelpLabel({ children, text, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{children}</span>
      <HelpTooltip text={text} />
    </span>
  );
}
