// File: src/components/layout/Sidebar.js

import React, { useMemo } from 'react';
import {
  LayoutDashboard,
  Truck,
  Wallet,
  FileText,
  Scale,
  Activity,
  ShieldAlert,
  Building2,
  Package,
  Factory,
  Users,
  BarChart3,
  Map,
  Headphones,
  ClipboardCheck,
  History,
  Settings,
  Shield,
  ScrollText,
  TerminalSquare,
  ChevronRight,
} from 'lucide-react';

/**
 * GL-FIRST SIDEBAR
 *
 * IMPORTANT:
 * - We keep "DailyLog" viewId for backward compatibility.
 * - UI label changes to "Close Workspace" (GL-first).
 *
 * New finance views:
 * - TrialBalance
 * - GLHealth
 */

const NavSection = ({ title, children }) => (
  <div className="mb-5">
    <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{title}</div>
    <div className="space-y-1">{children}</div>
  </div>
);

const NavItem = ({ icon: Icon, label, viewId, activeView, setActiveView, badge }) => {
  const active = activeView === viewId;

  return (
    <button
      onClick={() => setActiveView(viewId)}
      className={[
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all',
        active
          ? 'bg-blue-600/15 border-blue-500/30 text-white'
          : 'bg-white/0 border-white/0 hover:bg-white/5 hover:border-white/10 text-slate-300',
      ].join(' ')}
    >
      <div
        className={[
          'p-2 rounded-lg border',
          active ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/10 text-slate-300',
        ].join(' ')}
      >
        <Icon size={18} />
      </div>

      <div className="flex-1 text-left">
        <div className="text-sm font-semibold">{label}</div>
      </div>

      {badge ? (
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
          {badge}
        </span>
      ) : null}

      <ChevronRight size={14} className={active ? 'text-blue-300' : 'text-slate-600'} />
    </button>
  );
};

export default function Sidebar({ activeView, setActiveView }) {
  const nav = useMemo(
    () => [
      {
        title: 'Command Center',
        items: [
          { viewId: 'Dashboard', label: 'Command Center', icon: LayoutDashboard },
          { viewId: 'Logistics', label: 'Logistics', icon: Truck },
        ],
      },
      {
        title: 'Finance',
        items: [
          { viewId: 'FinancialStatements', label: 'Management Accounts', icon: FileText, badge: 'GL' },
          { viewId: 'TrialBalance', label: 'Trial Balance', icon: Scale, badge: 'GL' },
          { viewId: 'GLHealth', label: 'GL Health', icon: Activity, badge: 'GL' },
          { viewId: 'RevenueAssurance', label: 'Revenue Assurance', icon: ShieldAlert },
          { viewId: 'TaxCompliance', label: 'Tax Compliance', icon: ScrollText },
          { viewId: 'AssetAndLoan', label: 'Assets & Loans', icon: Building2 },
          { viewId: 'PlantProfitability', label: 'Plant Profitability', icon: Wallet },
        ],
      },
      {
        title: 'Operations',
        items: [
          { viewId: 'Inventory', label: 'Inventory', icon: Package },
          { viewId: 'PlantStatus', label: 'Plant Status', icon: Factory },
        ],
      },
      {
        title: 'Performance',
        items: [{ viewId: 'DriverScorecards', label: 'Driver Scorecards', icon: Users }],
      },
      {
        title: 'Intelligence',
        items: [
          { viewId: 'BusinessAnalytics', label: 'Business Analytics', icon: BarChart3 },
          { viewId: 'DeliveryHeatmap', label: 'Delivery Heatmap', icon: Map },
        ],
      },
      {
        title: 'Sales & Support',
        items: [
          { viewId: 'SalesAnalytics', label: 'Sales Analytics', icon: BarChart3 },
          { viewId: 'CustomerHub', label: 'Customer Hub', icon: Users },
          { viewId: 'SupportDesk', label: 'Support Desk', icon: Headphones },
        ],
      },
      {
        title: 'Data Entry',
        items: [
          // ✅ GL-first rename, legacy viewId remains DailyLog
          { viewId: 'DailyLog', label: 'Close Workspace', icon: ClipboardCheck, badge: 'GL' },
          { viewId: 'ApprovalQueue', label: 'Approval Queue', icon: Shield },
          { viewId: 'TransactionHistory', label: 'Transaction History', icon: History },
        ],
      },
      {
        title: 'Admin',
        items: [
          { viewId: 'UserManagement', label: 'User Management', icon: Users },
          { viewId: 'Configuration', label: 'Configuration', icon: Settings },
          { viewId: 'AuditLog', label: 'Audit Log', icon: ScrollText },
          { viewId: 'AppLogViewer', label: 'App Logs', icon: TerminalSquare },
        ],
      },
    ],
    []
  );

  return (
    <aside className="w-[280px] shrink-0 border-r border-white/10 bg-[#0b1224] flex flex-col">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="text-white font-extrabold tracking-wide">PrimeJet HQ</div>
        <div className="text-[11px] text-slate-500 mt-1">GL-first Ops & Finance Console</div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto px-2 py-4">
        {nav.map((sec) => (
          <NavSection key={sec.title} title={sec.title}>
            {sec.items.map((it) => (
              <NavItem
                key={it.viewId}
                icon={it.icon}
                label={it.label}
                viewId={it.viewId}
                badge={it.badge}
                activeView={activeView}
                setActiveView={setActiveView}
              />
            ))}
          </NavSection>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 text-[10px] text-slate-600">
        <div className="flex items-center justify-between">
          <span>System Mode</span>
          <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
            GL-ONLY
          </span>
        </div>
      </div>
    </aside>
  );
}