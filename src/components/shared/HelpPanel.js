// src/components/shared/HelpPanel.js
import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function HelpPanel({ title = 'How this works', items = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!rows.length) return null;

  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 print:hidden">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
          <BookOpen size={16} /> {title}
        </div>
        {open ? <ChevronUp size={16} className="text-sky-200" /> : <ChevronDown size={16} className="text-sky-200" />}
      </button>
      {open ? (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {rows.map((item) => (
            <div key={item.key || item.label} className="rounded-xl bg-black/20 border border-white/10 p-3">
              <div className="text-xs font-bold text-white">{item.label}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-300">{item.help || item.text}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
