// src/views/01-Finance/LoanProjectionStudio.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Download,
  FileText,
  HelpCircle,
  RefreshCcw,
  Save,
  TrendingUp,
  Truck,
  WalletCards,
} from 'lucide-react';
import {
  calculateLoanScenario,
  getLoanReadiness,
  getManagementAccounts,
  saveLoanScenario,
  listLoanScenarios,
} from '../../api/loanReadinessService';

const fmt = (v) => new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(Number(v || 0));
const fmt2 = (v) => new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(Number(v || 0));
const money = (v) => `₦${fmt(v)}`;

const defaultAssumptions = {
  scenarioName: '₦60m truck loan - refinery supply economics',
  loanAmount: 60000000,
  annualInterestRate: 15,
  tenorMonths: 48,
  moratoriumMonths: 0,
  repaymentType: 'REDUCING_BALANCE',
  fees: 0,
  marginUpliftPerKg: 100,
  truckMonthlyOperatingCost: 800000,
  expectedVolumeGrowthPct: 0,
  downtimePct: 5,
  currentBuyingCostPerKg: '',
  newBuyingCostPerKg: '',
};

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-xl ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon ? <Icon size={18} className="text-blue-300" /> : null}
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, hint, tone = 'default' }) {
  const toneClass = tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-red-300' : tone === 'warn' ? 'text-amber-300' : 'text-white';
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-slate-400 flex items-center gap-1">{label}{hint ? <HelpCircle size={12} title={hint} /> : null}</div>
      <div className={`text-xl font-bold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'number', hint }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">{label}{hint ? <HelpCircle size={12} title={hint} /> : null}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
      />
    </label>
  );
}

export default function LoanProjectionStudio() {
  const [assumptions, setAssumptions] = useState(defaultAssumptions);
  const [accounts, setAccounts] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const setField = (field, value) => setAssumptions((prev) => ({ ...prev, [field]: value }));

  const payload = useMemo(() => ({
    ...assumptions,
    loanAmount: Number(assumptions.loanAmount || 0),
    annualInterestRate: Number(assumptions.annualInterestRate || 0),
    tenorMonths: Number(assumptions.tenorMonths || 0),
    moratoriumMonths: Number(assumptions.moratoriumMonths || 0),
    fees: Number(assumptions.fees || 0),
    marginUpliftPerKg: Number(assumptions.marginUpliftPerKg || 0),
    truckMonthlyOperatingCost: Number(assumptions.truckMonthlyOperatingCost || 0),
    expectedVolumeGrowthPct: Number(assumptions.expectedVolumeGrowthPct || 0),
    downtimePct: Number(assumptions.downtimePct || 0),
    currentBuyingCostPerKg: assumptions.currentBuyingCostPerKg === '' ? undefined : Number(assumptions.currentBuyingCostPerKg),
    newBuyingCostPerKg: assumptions.newBuyingCostPerKg === '' ? undefined : Number(assumptions.newBuyingCostPerKg),
  }), [assumptions]);

  const load = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [accountsRes, readinessRes, scenarioRes, savedRes] = await Promise.all([
        getManagementAccounts(),
        getLoanReadiness({ loanAmount: payload.loanAmount, tenorMonths: payload.tenorMonths, annualInterestRate: payload.annualInterestRate }),
        calculateLoanScenario(payload),
        listLoanScenarios(),
      ]);
      setAccounts(accountsRes.accounts);
      setReadiness(readinessRes.readiness);
      setScenario(scenarioRes.scenario);
      setSavedScenarios(savedRes.scenarios || []);
    } catch (error) {
      setMessage(error?.response?.data?.message || error.message || 'Unable to load loan projection studio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveScenario = async () => {
    setLoading(true);
    setMessage('');
    try {
      await saveLoanScenario(payload);
      setMessage('Scenario saved successfully.');
      await load();
    } catch (error) {
      setMessage(error?.response?.data?.message || error.message || 'Unable to save scenario.');
    } finally {
      setLoading(false);
    }
  };

  const out = scenario?.outputs || {};
  const baseDscr = Number(out.dscrBase || 0);
  const conservativeDscr = Number(out.dscrConservative || 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Truck className="text-blue-300" /> Loan & Projection Studio</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-4xl">
            Use this page to prepare management accounts, model truck/refinery-supply economics, calculate repayments, test DSCR, and produce lender-ready assumptions for development-bank funding.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm flex items-center gap-2"><RefreshCcw size={16} /> Refresh</button>
          <button onClick={saveScenario} disabled={loading} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm flex items-center gap-2"><Save size={16} /> Save Scenario</button>
        </div>
      </div>

      {message ? <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 text-sm">{message}</div> : null}

      <Card title="Management Accounts Readiness Guide" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat label="Readiness Score" value={`${readiness?.score ?? 0}%`} tone={(readiness?.score || 0) >= 75 ? 'good' : (readiness?.score || 0) >= 50 ? 'warn' : 'bad'} />
          <Stat label="Current Monthly Kg Sold" value={`${fmt2(accounts?.monthly?.kgSold)} kg`} />
          <Stat label="Current Monthly Gross Profit" value={money(accounts?.monthly?.grossProfit)} />
          <Stat label="Cash Available for Debt Service" value={money(accounts?.monthly?.cashAvailableForDebtService)} tone={(accounts?.monthly?.cashAvailableForDebtService || 0) > 0 ? 'good' : 'bad'} />
        </div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {(readiness?.checklist || []).map((item) => (
            <div key={item.key} className="rounded-xl bg-slate-950 border border-white/10 p-3">
              <div className="flex justify-between gap-3">
                <span className="text-sm font-semibold text-white">{item.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : item.status === 'WARN' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>{item.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{item.recommendation}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Loan Assumptions" icon={Calculator}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
            <Input label="Scenario Name" type="text" value={assumptions.scenarioName} onChange={(v) => setField('scenarioName', v)} />
            <Input label="Loan Amount" value={assumptions.loanAmount} onChange={(v) => setField('loanAmount', v)} />
            <Input label="Annual Interest Rate (%)" value={assumptions.annualInterestRate} onChange={(v) => setField('annualInterestRate', v)} />
            <Input label="Tenor (Months)" value={assumptions.tenorMonths} onChange={(v) => setField('tenorMonths', v)} />
            <Input label="Moratorium (Months)" value={assumptions.moratoriumMonths} onChange={(v) => setField('moratoriumMonths', v)} />
            <Input label="Loan Fees" value={assumptions.fees} onChange={(v) => setField('fees', v)} />
          </div>
        </Card>

        <Card title="Truck / Refinery Supply Economics" icon={Truck}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
            <Input label="Margin Uplift / Kg" value={assumptions.marginUpliftPerKg} onChange={(v) => setField('marginUpliftPerKg', v)} hint="Example: if refinery buying saves ₦100/kg, enter 100." />
            <Input label="Truck Monthly Operating Cost" value={assumptions.truckMonthlyOperatingCost} onChange={(v) => setField('truckMonthlyOperatingCost', v)} hint="Driver, diesel, maintenance, tyres, insurance, permits and downtime allowance." />
            <Input label="Expected Volume Growth (%)" value={assumptions.expectedVolumeGrowthPct} onChange={(v) => setField('expectedVolumeGrowthPct', v)} />
            <Input label="Truck Downtime (%)" value={assumptions.downtimePct} onChange={(v) => setField('downtimePct', v)} />
            <Input label="Current Buying Cost / Kg" value={assumptions.currentBuyingCostPerKg} onChange={(v) => setField('currentBuyingCostPerKg', v)} />
            <Input label="New Refinery Buying Cost / Kg" value={assumptions.newBuyingCostPerKg} onChange={(v) => setField('newBuyingCostPerKg', v)} />
          </div>
        </Card>

        <Card title="Repayment Capacity" icon={WalletCards}>
          <div className="grid grid-cols-1 gap-3">
            <Stat label="Monthly Repayment" value={money(out.monthlyRepayment)} />
            <Stat label="Total Repayment" value={money(out.totalRepayment)} />
            <Stat label="Total Interest" value={money(out.totalInterest)} />
            <Stat label="Base DSCR" value={`${fmt2(baseDscr)}x`} tone={baseDscr >= 1.25 ? 'good' : baseDscr >= 1 ? 'warn' : 'bad'} hint="Debt Service Coverage Ratio. Target at least 1.25x for lender comfort." />
            <Stat label="Conservative DSCR" value={`${fmt2(conservativeDscr)}x`} tone={conservativeDscr >= 1 ? 'good' : 'warn'} />
          </div>
        </Card>
      </div>

      <Card title="Break-even Volume and Sensitivity" icon={TrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat label="Kg Needed from Uplift Only" value={`${fmt2(out.breakEvenKgFromUpliftOnly)} kg/month`} />
          <Stat label="Kg Needed Including Truck OPEX" value={`${fmt2(out.breakEvenKgIncludingTruckOpex)} kg/month`} />
          <Stat label="Repayment Headroom" value={money(out.repaymentHeadroom)} tone={Number(out.repaymentHeadroom || 0) > 0 ? 'good' : 'bad'} />
          <Stat label="Funding Pack Score" value={`${out.readinessScore || readiness?.score || 0}%`} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {['conservative', 'base', 'growth'].map((key) => {
            const row = scenario?.sensitivity?.[key] || {};
            return (
              <div key={key} className="rounded-xl bg-slate-950 border border-white/10 p-4">
                <div className="text-sm font-bold text-white capitalize">{key} case</div>
                <div className="text-xs text-slate-400">{row.label}</div>
                <div className="mt-3 text-sm text-slate-300">Cash for debt service: <b>{money(row.cashAvailableForDebtService)}</b></div>
                <div className="text-sm text-slate-300">DSCR: <b>{fmt2(row.dscr)}x</b></div>
                <div className="text-sm text-slate-300">After repayment: <b>{money(row.netCashAfterDebtService)}</b></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="48-Month Repayment and Cash Flow Schedule" icon={FileText}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-white/10">
              <tr>
                <th className="text-left py-2">Month</th>
                <th className="text-right py-2">Repayment</th>
                <th className="text-right py-2">Interest</th>
                <th className="text-right py-2">Principal</th>
                <th className="text-right py-2">Closing Principal</th>
                <th className="text-right py-2">Projected Kg</th>
                <th className="text-right py-2">Cash for Debt</th>
                <th className="text-right py-2">DSCR</th>
                <th className="text-right py-2">Net After Debt</th>
              </tr>
            </thead>
            <tbody>
              {(scenario?.schedule || []).slice(0, 12).map((m) => (
                <tr key={m.month} className="border-b border-white/5 text-slate-300">
                  <td className="py-2">{m.month}</td>
                  <td className="text-right">{money(m.repayment)}</td>
                  <td className="text-right">{money(m.interest)}</td>
                  <td className="text-right">{money(m.principal)}</td>
                  <td className="text-right">{money(m.closingPrincipal)}</td>
                  <td className="text-right">{fmt2(m.projectedKg)}</td>
                  <td className="text-right">{money(m.cashAvailableForDebtService)}</td>
                  <td className="text-right">{fmt2(m.dscr)}x</td>
                  <td className="text-right">{money(m.netCashAfterDebtService)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-3">Showing first 12 months. Backend export contains the full schedule.</p>
        </div>
      </Card>

      <Card title="Saved Scenarios and Export Guidance" icon={Download}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Saved scenarios</h4>
            <div className="space-y-2 max-h-60 overflow-auto">
              {savedScenarios.length === 0 ? <p className="text-sm text-slate-400">No saved scenario yet.</p> : savedScenarios.map((s) => (
                <div key={s.id} className="rounded-xl bg-slate-950 border border-white/10 p-3">
                  <div className="text-sm font-semibold text-white">{s.scenarioName}</div>
                  <div className="text-xs text-slate-400">Loan: {money(s.loan?.amount)} | Repayment: {money(s.outputs?.monthlyRepayment)} | DSCR: {fmt2(s.outputs?.dscrBase)}x</div>
                  <a className="text-xs text-blue-300 hover:text-blue-200" href={`/api/v2/loan-readiness/loan-scenarios/${s.id}/export`} target="_blank" rel="noreferrer">Download repayment CSV</a>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-100">
            <h4 className="font-bold text-white mb-2">Funding pack checklist</h4>
            <p>Before submitting to a development bank or lender, attach management accounts, bank/POS settlement evidence, inventory valuation, loan schedule, DSCR analysis, assumptions, and the truck business case.</p>
            <a className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white" href="/api/v2/loan-readiness/funding-pack/export" target="_blank" rel="noreferrer"><Download size={16} /> Download funding-pack summary CSV</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
