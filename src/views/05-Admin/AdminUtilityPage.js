import React from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import HelpPanel from '../../components/shared/HelpPanel';
import Button from '../../components/shared/Button';
import { Settings, ShieldCheck, Database, FileText, Bell, Link, ClipboardCheck } from 'lucide-react';

const toneClass = {
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
  green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
  red: 'bg-red-500/10 border-red-500/20 text-red-200',
  slate: 'bg-white/5 border-white/10 text-slate-200',
};

const iconMap = { Settings, ShieldCheck, Database, FileText, Bell, Link, ClipboardCheck };

export default function AdminUtilityPage({ title, subtitle, guide = [], sections = [], actions = [], icon = 'Settings' }) {
  const Icon = iconMap[icon] || Settings;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle title={title} subtitle={subtitle} />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <Icon size={28} className="text-blue-300" />
        </div>
      </div>

      <HelpPanel title={`${title} Operations Guide`} items={guide} defaultOpen />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="bg-slate-900/60 border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{section.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{section.description}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full border ${toneClass[section.tone || 'slate']}`}>{section.status || 'Setup'}</span>
            </div>
            {Array.isArray(section.items) && section.items.length ? (
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {section.items.map((item) => <li key={item} className="flex gap-2"><span className="text-blue-300">•</span><span>{item}</span></li>)}
              </ul>
            ) : null}
          </Card>
        ))}
      </div>

      {actions.length ? (
        <Card className="bg-white/5 border-white/10">
          <h3 className="font-bold text-white mb-3">Recommended Actions</h3>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => <Button key={action} variant="secondary">{action}</Button>)}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
