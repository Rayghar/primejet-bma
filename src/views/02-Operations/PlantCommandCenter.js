// src/views/02-Operations/PlantCommandCenter.js
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Wrench, Activity, Database, Factory } from 'lucide-react';
import HelpPanel from '../../components/shared/HelpPanel';
import { HelpLabel } from '../../components/shared/HelpTooltip';
import { getPlants, getPlantCommandCenter, updatePlantStatus } from '../../api/operationsService';

const input = 'w-full rounded-xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400';
const button = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4';
const money = (v) => `₦${Number(v || 0).toLocaleString()}`;
const num = (v) => Number(v || 0).toLocaleString();

export default function PlantCommandCenter({ setActiveView }) {
  const [plants, setPlants] = useState([]);
  const [plantId, setPlantId] = useState('');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('Operational');
  const [reason, setReason] = useState('Routine status update');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const guide = useMemo(() => [
    { key: 'profile', label: 'Plant profile', help: 'Confirms plant identity, capacity, status and branch mapping before operational decisions.' },
    { key: 'stock', label: 'Stock health', help: 'Shows opening stock, stock-in/depletion movements and low-stock alerts. Sales should not proceed when stock is not initialized.' },
    { key: 'maintenance', label: 'Maintenance', help: 'Tracks open maintenance jobs, downtime risk and status changes that affect operational readiness.' },
    { key: 'profit', label: 'Profitability', help: 'Shows plant revenue, COGS, OPEX, gross profit and net profit from actual operational and GL-linked records.' },
  ], []);

  const loadPlants = async () => { const rows = await getPlants(); setPlants(rows || []); if (!plantId && rows?.[0]) setPlantId(rows[0].id || rows[0]._id); };
  const load = async (id = plantId) => { if (!id) return; setBusy(true); setMessage(''); try { const r = await getPlantCommandCenter(id); setData(r); setStatus(r?.plant?.status || 'Operational'); } catch (e) { setMessage(e.message || 'Failed to load plant command center.'); } finally { setBusy(false); } };
  useEffect(() => { loadPlants().catch(() => {}); }, []);
  useEffect(() => { if (plantId) load(plantId); }, [plantId]);
  const changeStatus = async () => { setBusy(true); setMessage(''); try { await updatePlantStatus(plantId, { status, reason }); setMessage('Plant status updated.'); await load(); } catch (e) { setMessage(e.message || 'Failed to update status.'); } finally { setBusy(false); } };

  const m = data?.metrics || {};
  const stock = data?.stock || {};
  return (
    <div className="space-y-6 text-slate-100">
      <div><h1 className="text-2xl font-bold">Plant Command Center</h1><p className="text-sm text-slate-400">Reimagined plant operations view for stock, maintenance, profitability, utilization and risk alerts.</p></div>
      <HelpPanel title="Plant Operations Guide" items={guide} defaultOpen />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Operations Overview', text: 'Daily plant status, stock health, utilization, profitability and operational alerts.', icon: Factory, target: 'PlantCommandCenter' },
          { title: 'Reliability & Safety', text: 'Open reliability, uptime, downtime, risk, safety checks and maintenance exposure.', icon: Activity, target: 'PlantReliabilityCommandCenter' },
          { title: 'Maintenance Logs', text: 'Log maintenance activity, costs, repairs and routine service checks for each plant.', icon: Database, target: 'PlantStatus' },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => item.target !== 'PlantCommandCenter' && setActiveView?.(item.target)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:bg-white/[0.08] transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-xl bg-sky-500/10 p-2 text-sky-300"><item.icon size={18} /></div>
              <h3 className="font-bold text-white">{item.title}</h3>
            </div>
            <p className="text-sm text-slate-400">{item.text}</p>
          </button>
        ))}
      </div>
      {message ? <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">{message}</div> : null}
      <div className={`${card} grid grid-cols-1 md:grid-cols-4 gap-3`}>
        <label className="space-y-1 md:col-span-2"><HelpLabel text="Choose the plant/branch to view its operational, stock, maintenance and profitability controls.">Plant</HelpLabel><select className={input} value={plantId} onChange={(e) => setPlantId(e.target.value)}>{plants.map((p) => <option key={p.id || p._id} value={p.id || p._id}>{p.name || p.id || p._id}</option>)}</select></label>
        <label className="space-y-1"><HelpLabel text="Status controls whether a plant is operational, under maintenance, offline or warning.">New status</HelpLabel><select className={input} value={status} onChange={(e) => setStatus(e.target.value)}><option>Operational</option><option>Maintenance</option><option>Offline</option><option>Warning</option></select></label>
        <div className="flex items-end gap-2"><button className={`${button} bg-sky-600 hover:bg-sky-500`} disabled={busy} onClick={() => load()}><RefreshCw size={16}/> Refresh</button></div>
        <label className="space-y-1 md:col-span-3"><HelpLabel text="Reason is required for plant status changes and should explain operational impact.">Status change reason</HelpLabel><input className={input} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div className="flex items-end"><button className={`${button} bg-indigo-600 hover:bg-indigo-500 w-full justify-center`} disabled={busy || !plantId} onClick={changeStatus}><Wrench size={16}/> Update Status</button></div>
      </div>

      {data ? <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={card}><div className="text-xs text-slate-400">Available LPG</div><div className="text-2xl font-bold">{num(stock.availableKg)}kg</div></div>
          <div className={card}><div className="text-xs text-slate-400">Revenue</div><div className="text-2xl font-bold">{money(m.revenue)}</div></div>
          <div className={card}><div className="text-xs text-slate-400">Gross Profit</div><div className="text-2xl font-bold">{money(m.grossProfit)}</div></div>
          <div className={card}><div className="text-xs text-slate-400">Net Profit</div><div className="text-2xl font-bold">{money(m.netProfit)}</div></div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className={card}><h3 className="font-semibold mb-3">Operational Alerts</h3><div className="space-y-2">{(data.alerts || []).length ? data.alerts.map((a, i) => <div key={i} className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100 flex gap-2"><AlertTriangle size={16}/>{a.message}</div>) : <div className="text-sm text-slate-400">No critical plant alerts.</div>}</div></div>
          <div className={card}><h3 className="font-semibold mb-3">Stock & Utilization</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Total stocked</span><b>{num(stock.totalStockedKg)}kg</b></div><div className="flex justify-between"><span>POS kg sold</span><b>{num(m.posKg)}kg</b></div><div className="flex justify-between"><span>Utilization</span><b>{Number(m.utilizationPct || 0).toFixed(1)}%</b></div><div className="flex justify-between"><span>COGS</span><b>{money(m.cogs)}</b></div></div></div>
          <div className={card}><h3 className="font-semibold mb-3">Maintenance</h3><div className="text-sm mb-2">Open items: <b>{m.maintenanceOpen || 0}</b></div><div className="space-y-2">{(data.maintenance || []).slice(0,4).map((row) => <div key={row._id || row.id} className="rounded-lg bg-slate-900/50 p-2 text-xs"><b>{row.type || 'Maintenance'}</b><div className="text-slate-400">{row.status} • {String(row.startDate || '').slice(0,10)}</div></div>)}</div></div>
        </div>
        <div className={card}><h3 className="font-semibold mb-3">Recent Stock Movements</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Type</th><th className="text-left p-2">Direction</th><th className="text-right p-2">Kg</th><th className="text-right p-2">Value</th></tr></thead><tbody>{(data.movements || []).map((r) => <tr key={r._id || r.movementId} className="border-t border-white/5"><td className="p-2">{String(r.movementDate || '').slice(0,10)}</td><td className="p-2">{r.movementType}</td><td className="p-2">{r.direction}</td><td className="p-2 text-right">{num(r.quantityKg)}</td><td className="p-2 text-right">{money(r.totalCost)}</td></tr>)}</tbody></table></div></div>
      </> : null}
    </div>
  );
}
