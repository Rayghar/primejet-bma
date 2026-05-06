// src/views/01-Finance/OpeningBalanceWizard.js
import React, { useEffect, useMemo, useState } from 'react';
import { Save, Send, CheckCircle, RefreshCw } from 'lucide-react';
import HelpPanel from '../../components/shared/HelpPanel';
import { HelpLabel } from '../../components/shared/HelpTooltip';
import { getOpeningBalances, getOpeningBalanceReadiness, saveOpeningBalanceDraft, submitOpeningBalance, postOpeningBalance } from '../../api/inventoryService';

const input = 'w-full rounded-xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400';
const button = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
const card = 'rounded-2xl border border-white/10 bg-white/[0.04] p-4';
const n = (v) => Number(v || 0) || 0;

export default function OpeningBalanceWizard() {
  const [form, setForm] = useState({ branchId: '', businessDate: new Date().toISOString().slice(0, 10), cashOnHand: '', bankTransfers: '', bankPOS: '', inventoryQuantityKg: '', inventoryCostPerKg: '', accountsReceivable: '', accountsPayable: '', openingEquity: '', notes: '' });
  const [rows, setRows] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [current, setCurrent] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const inventoryValue = n(form.inventoryQuantityKg) * n(form.inventoryCostPerKg);
  const debits = n(form.cashOnHand) + n(form.bankTransfers) + n(form.bankPOS) + inventoryValue + n(form.accountsReceivable);
  const autoEquity = Math.max(0, debits - n(form.accountsPayable));
  const credits = n(form.accountsPayable) + n(form.openingEquity || autoEquity);
  const variance = debits - credits;

  const guide = useMemo(() => [
    { key: 'purpose', label: 'Purpose', help: 'Use this wizard once per plant/branch to seed opening cash, bank, stock, receivables, payables and equity before relying on finance reports.' },
    { key: 'inventory', label: 'Inventory rule', help: 'Opening LPG inventory must include quantity and cost/kg. It creates opening stock and anchors WAC/COGS.' },
    { key: 'balance', label: 'Balancing rule', help: 'The opening entry must balance. The wizard can derive Opening Balance Equity from debits less payables.' },
    { key: 'posting', label: 'Posting rule', help: 'Posting creates the GL opening balance and loads stock/cylinder balances. It does not require maker-checker enforcement in this wave.' },
  ], []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    const [list, ready] = await Promise.all([getOpeningBalances({ branchId: form.branchId || undefined }), getOpeningBalanceReadiness({ branchId: form.branchId || undefined })]);
    setRows(list.items || []);
    setReadiness(ready);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const payload = () => ({ ...form, inventoryValue, openingEquity: n(form.openingEquity || autoEquity) });

  const run = async (fn) => {
    setBusy(true); setMessage('');
    try { const res = await fn(); setMessage('Action completed successfully.'); if (res?.openingBalance) setCurrent(res.openingBalance); await load(); }
    catch (e) { setMessage(e.message || 'Action failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Opening Balance Wizard</h1>
        <p className="text-sm text-slate-400">Seed opening cash, bank, inventory, receivables, payables and equity without changing login/authentication or bank integrations.</p>
      </div>
      <HelpPanel title="Opening Balance Operations Guide" items={guide} defaultOpen />

      {message ? <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3 text-sm text-sky-100">{message}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2 space-y-4`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1"><HelpLabel text="Plant/branch is required because opening cash, stock and financial position must be scoped correctly.">Branch / Plant ID</HelpLabel><input className={input} value={form.branchId} onChange={(e) => set('branchId', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="The opening date determines the fiscal period and prevents duplicate opening entries for the same branch/date.">Opening date</HelpLabel><input type="date" className={input} value={form.businessDate} onChange={(e) => set('businessDate', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Physical cash available at the plant/cashier at opening.">Opening cash</HelpLabel><input className={input} value={form.cashOnHand} onChange={(e) => set('cashOnHand', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Bank transfer balance to seed bank/cash movement reports.">Opening bank transfer</HelpLabel><input className={input} value={form.bankTransfers} onChange={(e) => set('bankTransfers', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="POS settlement balance expected from card/POS channels.">Opening POS settlement</HelpLabel><input className={input} value={form.bankPOS} onChange={(e) => set('bankPOS', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Receivables owed to the business at opening.">Receivables</HelpLabel><input className={input} value={form.accountsReceivable} onChange={(e) => set('accountsReceivable', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Payables owed by the business at opening.">Payables</HelpLabel><input className={input} value={form.accountsPayable} onChange={(e) => set('accountsPayable', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Opening LPG quantity. Required before POS sales can be logged for the plant.">Opening LPG kg</HelpLabel><input className={input} value={form.inventoryQuantityKg} onChange={(e) => set('inventoryQuantityKg', e.target.value)} /></label>
            <label className="space-y-1"><HelpLabel text="Cost per kg used to value opening stock and derive WAC.">Inventory cost/kg</HelpLabel><input className={input} value={form.inventoryCostPerKg} onChange={(e) => set('inventoryCostPerKg', e.target.value)} /></label>
          </div>
          <label className="space-y-1 block"><HelpLabel text="Optional narrative for finance/audit review.">Notes</HelpLabel><textarea className={input} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || Math.abs(variance) > 0.01} className={`${button} bg-sky-600 hover:bg-sky-500`} onClick={() => run(() => saveOpeningBalanceDraft(payload()))}><Save size={16}/> Save Draft</button>
            <button disabled={busy || !current} className={`${button} bg-indigo-600 hover:bg-indigo-500`} onClick={() => run(() => submitOpeningBalance(current.id || current._id))}><Send size={16}/> Submit</button>
            <button disabled={busy || !current} className={`${button} bg-emerald-600 hover:bg-emerald-500`} onClick={() => run(() => postOpeningBalance(current.id || current._id))}><CheckCircle size={16}/> Post Opening Balance</button>
            <button disabled={busy} className={`${button} bg-slate-700 hover:bg-slate-600`} onClick={() => run(load)}><RefreshCw size={16}/> Refresh</button>
          </div>
        </div>
        <div className={card}>
          <h3 className="font-semibold mb-3">Balance Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Debits</span><b>₦{debits.toLocaleString()}</b></div>
            <div className="flex justify-between"><span>Opening equity</span><b>₦{n(form.openingEquity || autoEquity).toLocaleString()}</b></div>
            <div className="flex justify-between"><span>Credits</span><b>₦{credits.toLocaleString()}</b></div>
            <div className={`flex justify-between ${Math.abs(variance) > 0.01 ? 'text-red-300' : 'text-emerald-300'}`}><span>Variance</span><b>₦{variance.toLocaleString()}</b></div>
            <div className="flex justify-between"><span>Inventory value</span><b>₦{inventoryValue.toLocaleString()}</b></div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Readiness: {readiness?.hasPostedOpeningBalance ? 'Posted opening balance exists.' : 'No posted opening balance confirmed yet.'}</div>
        </div>
      </div>

      <div className={card}>
        <h3 className="font-semibold mb-3">Recent Opening Balances</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr><th className="text-left p-2">Date</th><th className="text-left p-2">Branch</th><th className="text-left p-2">Status</th><th className="text-right p-2">Inventory</th><th className="text-right p-2">Cash</th></tr></thead><tbody>{rows.map((r) => <tr key={r._id || r.id} className="border-t border-white/5"><td className="p-2">{String(r.businessDate || '').slice(0,10)}</td><td className="p-2">{r.branchId}</td><td className="p-2">{r.status || r.posting?.status}</td><td className="p-2 text-right">₦{n(r.inventoryValue).toLocaleString()}</td><td className="p-2 text-right">₦{n(r.cashOnHand).toLocaleString()}</td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}
