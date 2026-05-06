// File: src/views/03-Sales/CorporateClientManager.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import HelpPanel from '../../components/shared/HelpPanel';
import { getPlants } from '../../api/operationsService';
import {
  getCorporateDashboard,
  getCorporateFulfilmentControl,
  getCorporateClients,
  createCorporateClient,
  updateCorporateClient,
  addCorporateActivity,
  createCorporateFulfilment,
  updateCorporateFulfilmentStatus,
  getRelationshipManagers,
} from '../../api/corporateClientService';
import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  PackageCheck,
  PhoneCall,
  RefreshCw,
  Save,
  Search,
  TimerReset,
  Truck,
  UserRound,
} from 'lucide-react';

const emptyClient = {
  companyName: '',
  contactPerson: '',
  contactRole: '',
  phone: '',
  email: '',
  industry: '',
  source: 'FIELD_SALES',
  stage: 'LEAD',
  expectedMonthlyKg: '',
  agreedPricePerKg: '',
  paymentTerms: 'PAY_ON_DELIVERY',
  creditLimit: '',
  slaExpectation: '',
  address: '',
  city: '',
  state: 'Lagos',
  assignedBranchId: '',
  assignedBranchName: '',
  relationshipManagerId: '',
  relationshipManagerName: '',
  whatsappPhone: '',
  anniversaryDate: '',
  nextFollowUpDate: '',
  notes: '',
};

const emptyFulfilment = {
  orderType: 'BULK_REFILL',
  priority: 'NORMAL',
  requestedKg: '',
  deliveredKg: '',
  sellingPricePerKg: '',
  costPerKg: '',
  deliveryCost: '',
  amountPaid: '',
  invoiceNumber: '',
  paymentDueDate: '',
  promisedAt: '',
  scheduledAt: '',
  actualDeliveredAt: '',
  status: 'REQUESTED',
  vehicleType: 'NOT_ASSIGNED',
  truckName: '',
  truckTripId: '',
  vanId: '',
  vanName: '',
  driverName: '',
  branchId: '',
  branchName: '',
  deliverySiteName: '',
  deliveryAddress: '',
  requestSource: 'RELATIONSHIP_MANAGER',
  requestReference: '',
  stockInReference: '',
  customerConfirmed: false,
  delayReason: '',
  serviceNotes: '',
};

const emptyActivity = {
  type: 'FOLLOW_UP',
  title: '',
  note: '',
  outcome: '',
  nextFollowUpDate: '',
};

const num = (v) => Number(v || 0);
const fmt = (v) => num(v).toLocaleString();
const money = (v) => `₦${fmt(Math.round(num(v)))}`;
const kg = (v) => `${fmt(Math.round(num(v)))}kg`;
const date = (v) => (v ? new Date(v).toLocaleDateString() : '—');
const dateTime = (v) => (v ? new Date(v).toLocaleString() : '—');
const hours = (mins) => {
  const m = Math.round(num(mins));
  if (!m) return '—';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
const toIso = (v) => (v ? new Date(v).toISOString() : undefined);
const vehicleName = (item = {}) => item.truckName || item.vanName || item.vehicleType || 'Unassigned';

const stageTone = (stage = '') => {
  if (stage === 'ACTIVE' || stage === 'DELIVERED' || stage === 'ON_TIME' || stage === 'PAID') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
  if (stage === 'ONBOARDING' || stage === 'SCHEDULED' || stage === 'IN_TRANSIT' || stage === 'AT_RISK') return 'bg-blue-500/15 text-blue-300 border-blue-500/20';
  if (stage === 'PROSPECT' || stage === 'REQUESTED' || stage === 'PART_PAID') return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
  if (stage === 'LOST' || stage === 'DORMANT' || stage === 'DELAYED' || stage === 'FAILED' || stage === 'CANCELLED' || stage === 'LATE' || stage === 'MISSED') return 'bg-red-500/15 text-red-300 border-red-500/20';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/20';
};

const Pill = ({ children, tone = '' }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{children}</span>
);

const MetricCard = ({ icon: Icon, label, value, hint }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-500/10 p-3 text-blue-300"><Icon size={20} /></div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  </Card>
);

const SmallMetric = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold text-white">{value}</p>
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-blue-400';

export default function CorporateClientManager() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dashboard, setDashboard] = useState({ metrics: {}, dueFollowUps: [], recentFulfilments: [] });
  const [fulfilmentControl, setFulfilmentControl] = useState({ metrics: {}, pipeline: {}, latestFulfilments: [], overdueFulfilments: [], atRiskFulfilments: [], byClient: [], byRelationshipManager: [], byVehicle: [] });
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [clientForm, setClientForm] = useState(emptyClient);
  const [fulfilmentForm, setFulfilmentForm] = useState(emptyFulfilment);
  const [activityForm, setActivityForm] = useState(emptyActivity);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0] || null,
    [clients, selectedClientId]
  );

  const resetFormsFromClient = (client) => {
    if (!client) {
      setClientForm(emptyClient);
      return;
    }
    setClientForm({
      ...emptyClient,
      ...client,
      expectedMonthlyKg: client.expectedMonthlyKg || '',
      agreedPricePerKg: client.agreedPricePerKg || '',
      creditLimit: client.creditLimit || '',
      anniversaryDate: client.anniversaryDate ? String(client.anniversaryDate).slice(0, 10) : '',
      nextFollowUpDate: client.nextFollowUpDate ? String(client.nextFollowUpDate).slice(0, 10) : '',
    });
    setFulfilmentForm({
      ...emptyFulfilment,
      sellingPricePerKg: client.agreedPricePerKg || '',
      branchId: client.assignedBranchId || '',
      branchName: client.assignedBranchName || '',
      deliveryAddress: client.address || '',
    });
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, control, clientRows, rms, plantRows] = await Promise.all([
        getCorporateDashboard(),
        getCorporateFulfilmentControl().catch(() => ({ metrics: {}, pipeline: {}, latestFulfilments: [] })),
        getCorporateClients({ search, stage: stageFilter }),
        getRelationshipManagers().catch(() => ({ rows: [] })),
        getPlants().catch(() => []),
      ]);
      const rows = clientRows?.rows || [];
      setDashboard(dash || {});
      setFulfilmentControl(control || {});
      setClients(rows);
      setManagers(rms?.rows || []);
      setBranches(Array.isArray(plantRows) ? plantRows : []);
      if (rows.length && !rows.some((c) => c.id === selectedClientId)) {
        setSelectedClientId(rows[0].id);
        resetFormsFromClient(rows[0]);
      }
      if (!rows.length) {
        setSelectedClientId('');
        setClientForm(emptyClient);
      }
    } catch (err) {
      setError(err.message || 'Failed to load corporate client manager.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selectedClient) resetFormsFromClient(selectedClient);
  }, [selectedClientId]);

  const updateClientField = (field, value) => {
    const next = { ...clientForm, [field]: value };
    if (field === 'relationshipManagerId') {
      const rm = managers.find((m) => m.id === value);
      next.relationshipManagerName = rm?.name || '';
    }
    if (field === 'assignedBranchId') {
      const branch = branches.find((b) => String(b.id || b._id || b.name) === String(value));
      next.assignedBranchName = branch?.name || branch?.branchName || '';
    }
    setClientForm(next);
  };

  const updateFulfilmentField = (field, value) => {
    const next = { ...fulfilmentForm, [field]: value };
    if (field === 'branchId') {
      const branch = branches.find((b) => String(b.id || b._id || b.name) === String(value));
      next.branchName = branch?.name || branch?.branchName || '';
    }
    setFulfilmentForm(next);
  };

  const saveClient = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...clientForm };
      const response = payload.id ? await updateCorporateClient(payload.id, payload) : await createCorporateClient(payload);
      setMessage(payload.id ? 'Corporate client updated.' : 'Corporate client created.');
      const saved = response.client;
      await load();
      if (saved?.id) setSelectedClientId(saved.id);
    } catch (err) {
      setError(err.message || 'Unable to save corporate client.');
    } finally {
      setSaving(false);
    }
  };

  const createNewClient = () => {
    setSelectedClientId('');
    setClientForm(emptyClient);
    setFulfilmentForm(emptyFulfilment);
    setActivityForm(emptyActivity);
  };

  const logFulfilment = async () => {
    if (!selectedClient?.id) {
      setError('Select or create a corporate client before logging fulfilment.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...fulfilmentForm,
        requestedAt: new Date().toISOString(),
        promisedAt: toIso(fulfilmentForm.promisedAt),
        scheduledAt: toIso(fulfilmentForm.scheduledAt),
        actualDeliveredAt: toIso(fulfilmentForm.actualDeliveredAt),
        paymentDueDate: fulfilmentForm.paymentDueDate || undefined,
      };
      await createCorporateFulfilment(selectedClient.id, payload);
      setMessage('Corporate fulfilment logged into the B2B control tower.');
      setFulfilmentForm({
        ...emptyFulfilment,
        sellingPricePerKg: selectedClient.agreedPricePerKg || '',
        branchId: selectedClient.assignedBranchId || '',
        branchName: selectedClient.assignedBranchName || '',
        deliveryAddress: selectedClient.address || '',
      });
      await load();
    } catch (err) {
      setError(err.message || 'Unable to log fulfilment.');
    } finally {
      setSaving(false);
    }
  };

  const addActivity = async () => {
    if (!selectedClient?.id) {
      setError('Select or create a corporate client before adding activity.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await addCorporateActivity(selectedClient.id, activityForm);
      setMessage('Relationship activity added.');
      setActivityForm(emptyActivity);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to add relationship activity.');
    } finally {
      setSaving(false);
    }
  };

  const quickStatus = async (fulfilment, status) => {
    setStatusUpdating(fulfilment.id);
    setError('');
    setMessage('');
    try {
      await updateCorporateFulfilmentStatus(fulfilment.id, {
        status,
        actualDeliveredAt: status === 'DELIVERED' ? new Date().toISOString() : undefined,
        customerConfirmed: status === 'DELIVERED' ? true : undefined,
        note: `Marked ${status} from Corporate Fulfilment Control`,
      });
      setMessage(`Fulfilment ${fulfilment.orderCode || fulfilment.id} marked ${status}.`);
      await load();
    } catch (err) {
      setError(err.message || 'Unable to update fulfilment status.');
    } finally {
      setStatusUpdating('');
    }
  };

  const metrics = dashboard?.metrics || {};
  const controlMetrics = fulfilmentControl?.metrics || {};
  const recentFulfilments = fulfilmentControl?.latestFulfilments || dashboard?.recentFulfilments || [];
  const dueFollowUps = dashboard?.dueFollowUps || [];
  const overdue = fulfilmentControl?.overdueFulfilments || [];
  const atRisk = fulfilmentControl?.atRiskFulfilments || [];
  const pipeline = fulfilmentControl?.pipeline || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <PageTitle title="Corporate Client Manager" subtitle="B2B pipeline, onboarding, order fulfilment control, SLA tracking, WhatsApp linkage, relationship ownership and volume economics." />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Building2} onClick={createNewClient}>New Client</Button>
          <Button icon={RefreshCw} onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

      <HelpPanel
        title="Corporate client operating guide"
        items={[
          { label: 'Pipeline discipline', text: 'Move each company through Lead, Prospect, Onboarding and Active stages so no B2B opportunity is invisible.' },
          { label: 'Fulfilment control', text: 'Record requested KG, promised time, actual delivery, truck/van used and service delay reasons for every corporate order.' },
          { label: 'SLA control', text: 'The control tower flags overdue and at-risk orders so relationship managers and dispatch can intervene before customers complain.' },
          { label: 'Finance exposure', text: 'Amount paid, invoice number, payment due date and outstanding balance are tracked as operational references only; GL posting remains untouched.' },
          { label: 'WhatsApp layer', text: 'Capture WhatsApp phone/contact information now. Later waves can convert WhatsApp requests directly into corporate fulfilments.' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Corporate accounts" value={fmt(metrics.totalCorporateClients)} hint={`${fmt(metrics.leadsAndProspects)} leads/prospects`} />
        <MetricCard icon={ClipboardCheck} label="Active / onboarding" value={`${fmt(metrics.activeCorporateClients)} / ${fmt(metrics.onboarding)}`} hint={`${fmt(metrics.followUpsDue)} follow-ups due`} />
        <MetricCard icon={PackageCheck} label="Delivered volume" value={kg(metrics.deliveredKg)} hint={`${kg(metrics.requestedKg)} requested`} />
        <MetricCard icon={DollarSign} label="B2B revenue" value={money(metrics.fulfilmentRevenue)} hint={`${money(metrics.grossMargin)} gross margin`} />
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">B2B Fulfilment Control Tower</h3>
            <p className="text-sm text-slate-400">Operational command view for corporate requests, promised delivery times, SLA exceptions, payment exposure and vehicle assignment.</p>
          </div>
          <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20"><TimerReset size={13} className="mr-1" /> Avg TAT {hours(controlMetrics.averageTurnaroundMinutes)}</Pill>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <SmallMetric label="Open orders" value={fmt(controlMetrics.openFulfilments)} hint={`${fmt(pipeline.REQUESTED?.count)} requested`} />
          <SmallMetric label="Overdue" value={fmt(controlMetrics.overdueFulfilments)} hint={`${fmt(controlMetrics.atRiskFulfilments)} at risk`} />
          <SmallMetric label="On-time rate" value={`${fmt(controlMetrics.onTimeDeliveryRate)}%`} hint="Delivered orders" />
          <SmallMetric label="Outstanding" value={money(controlMetrics.outstandingAmount)} hint="Reference only" />
          <SmallMetric label="In transit" value={fmt(pipeline.IN_TRANSIT?.count)} hint={kg(pipeline.IN_TRANSIT?.requestedKg)} />
          <SmallMetric label="Delivered" value={fmt(controlMetrics.deliveredFulfilments)} hint={kg(controlMetrics.deliveredKg)} />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><AlertTriangle size={16} className="text-red-300" /> SLA Watchlist</h4>
            <div className="space-y-2">
              {[...overdue.slice(0, 4), ...atRisk.slice(0, 2)].slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white">{item.clientName}</div>
                      <div className="text-xs text-slate-500">{item.orderCode || item.requestReference || 'No order code'} · Promise: {dateTime(item.promisedAt)}</div>
                    </div>
                    <Pill tone={stageTone(item.slaStatus)}>{item.slaStatus || item.status}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => quickStatus(item, 'IN_TRANSIT')} disabled={statusUpdating === item.id}>Mark In Transit</Button>
                    <Button className="px-3 py-1.5 text-xs" onClick={() => quickStatus(item, 'DELIVERED')} disabled={statusUpdating === item.id}>Mark Delivered</Button>
                  </div>
                </div>
              ))}
              {!overdue.length && !atRisk.length && <p className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-500">No overdue or at-risk corporate fulfilments.</p>}
            </div>
          </div>
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Clock size={16} className="text-blue-300" /> Latest Corporate Orders</h4>
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {recentFulfilments.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-white">{item.clientName}</div>
                    <Pill tone={stageTone(item.status)}>{item.status}</Pill>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span><PackageCheck size={13} className="mr-1 inline" />{kg(item.deliveredKg || item.requestedKg)}</span>
                    <span><DollarSign size={13} className="mr-1 inline" />{money(item.revenue)}</span>
                    <span><Truck size={13} className="mr-1 inline" />{vehicleName(item)}</span>
                    <span><FileText size={13} className="mr-1 inline" />{item.invoiceNumber || item.orderCode || 'No invoice'}</span>
                    <span><Clock size={13} className="mr-1 inline" />{hours(item.turnaroundMinutes)}</span>
                    <span><AlertTriangle size={13} className="mr-1 inline" />{item.slaStatus || '—'}</span>
                  </div>
                  {!['DELIVERED', 'FAILED', 'CANCELLED'].includes(item.status) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => quickStatus(item, 'SCHEDULED')} disabled={statusUpdating === item.id}>Schedule</Button>
                      <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => quickStatus(item, 'IN_TRANSIT')} disabled={statusUpdating === item.id}>In Transit</Button>
                      <Button className="px-3 py-1.5 text-xs" onClick={() => quickStatus(item, 'DELIVERED')} disabled={statusUpdating === item.id}>Delivered</Button>
                    </div>
                  )}
                </div>
              ))}
              {!recentFulfilments.length && <p className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-500">Corporate fulfilments will appear here.</p>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Pipeline</h3>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{clients.length} shown</Pill>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input className={`${inputClass} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, phone, RM…" />
            </div>
            <select className={inputClass} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {['LEAD', 'PROSPECT', 'ONBOARDING', 'ACTIVE', 'RETENTION', 'DORMANT', 'LOST'].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <Button variant="secondary" icon={Search} onClick={load}>Apply Filter</Button>
          </div>
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedClient?.id === client.id ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-white">{client.companyName}</div>
                    <div className="text-xs text-slate-500">{client.contactPerson || 'No contact'} · {client.phone || client.whatsappPhone || 'No phone'}</div>
                  </div>
                  <Pill tone={stageTone(client.stage)}>{client.stage}</Pill>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Expected: <b className="text-white">{kg(client.expectedMonthlyKg)}</b></span>
                  <span>Delivered: <b className="text-white">{kg(client.lifetimeDeliveredKg)}</b></span>
                  <span>Revenue: <b className="text-white">{money(client.lifetimeRevenue)}</b></span>
                  <span>Outstanding: <b className="text-white">{money(client.outstandingBalance)}</b></span>
                  <span>RM: <b className="text-white">{client.relationshipManagerName || '—'}</b></span>
                  <span>Next: <b className="text-white">{date(client.nextFollowUpDate)}</b></span>
                </div>
              </button>
            ))}
            {!clients.length && <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No corporate clients yet. Create the first B2B lead.</div>}
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Client Setup & Onboarding</h3>
            <Pill tone={stageTone(clientForm.stage)}>{clientForm.id ? clientForm.stage : 'NEW'}</Pill>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs text-slate-400 xl:col-span-2">Company name<input className={inputClass} value={clientForm.companyName} onChange={(e) => updateClientField('companyName', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Stage<select className={inputClass} value={clientForm.stage} onChange={(e) => updateClientField('stage', e.target.value)}>{['LEAD','PROSPECT','ONBOARDING','ACTIVE','RETENTION','DORMANT','LOST'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Contact person<input className={inputClass} value={clientForm.contactPerson} onChange={(e) => updateClientField('contactPerson', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Role/title<input className={inputClass} value={clientForm.contactRole} onChange={(e) => updateClientField('contactRole', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Industry<input className={inputClass} value={clientForm.industry} onChange={(e) => updateClientField('industry', e.target.value)} placeholder="Hotel, estate, restaurant, factory…" /></label>
            <label className="text-xs text-slate-400">Phone<input className={inputClass} value={clientForm.phone} onChange={(e) => updateClientField('phone', e.target.value)} /></label>
            <label className="text-xs text-slate-400">WhatsApp phone<input className={inputClass} value={clientForm.whatsappPhone} onChange={(e) => updateClientField('whatsappPhone', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Email<input className={inputClass} value={clientForm.email} onChange={(e) => updateClientField('email', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Expected monthly KG<input type="number" className={inputClass} value={clientForm.expectedMonthlyKg} onChange={(e) => updateClientField('expectedMonthlyKg', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Agreed ₦/KG<input type="number" className={inputClass} value={clientForm.agreedPricePerKg} onChange={(e) => updateClientField('agreedPricePerKg', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Credit limit<input type="number" className={inputClass} value={clientForm.creditLimit} onChange={(e) => updateClientField('creditLimit', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Payment terms<select className={inputClass} value={clientForm.paymentTerms} onChange={(e) => updateClientField('paymentTerms', e.target.value)}>{['PAY_ON_DELIVERY','PREPAID','CREDIT_7_DAYS','CREDIT_14_DAYS','CREDIT_30_DAYS','CUSTOM'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Relationship manager<select className={inputClass} value={clientForm.relationshipManagerId} onChange={(e) => updateClientField('relationshipManagerId', e.target.value)}><option value="">Unassigned</option>{managers.map((m) => <option key={m.id || m.email} value={m.id}>{m.name || m.email}</option>)}</select></label>
            <label className="text-xs text-slate-400">Assigned branch<select className={inputClass} value={clientForm.assignedBranchId} onChange={(e) => updateClientField('assignedBranchId', e.target.value)}><option value="">Unassigned</option>{branches.map((b) => <option key={b.id || b._id || b.name} value={b.id || b._id || b.name}>{b.name || b.branchName}</option>)}</select></label>
            <label className="text-xs text-slate-400 xl:col-span-3">Address<input className={inputClass} value={clientForm.address} onChange={(e) => updateClientField('address', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Anniversary<input type="date" className={inputClass} value={clientForm.anniversaryDate} onChange={(e) => updateClientField('anniversaryDate', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Next follow-up<input type="date" className={inputClass} value={clientForm.nextFollowUpDate} onChange={(e) => updateClientField('nextFollowUpDate', e.target.value)} /></label>
            <label className="text-xs text-slate-400 md:col-span-2">SLA expectation<input className={inputClass} value={clientForm.slaExpectation} onChange={(e) => updateClientField('slaExpectation', e.target.value)} placeholder="e.g. same-day supply, 4-hour response, assigned truck for bulk orders" /></label>
            <label className="text-xs text-slate-400 xl:col-span-3">Notes<textarea rows="3" className={inputClass} value={clientForm.notes} onChange={(e) => updateClientField('notes', e.target.value)} /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button icon={Save} onClick={saveClient} disabled={saving || !clientForm.companyName}>{saving ? 'Saving…' : 'Save Client'}</Button>
            {clientForm.whatsappPhone && <Pill tone="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"><MessageSquare size={13} className="mr-1" /> WhatsApp ready</Pill>}
            {clientForm.id && <Pill tone="bg-slate-500/10 text-slate-300 border-slate-500/20">Outstanding {money(clientForm.outstandingBalance)}</Pill>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Corporate Order & Fulfilment Capture</h3>
            <Pill tone="bg-slate-500/10 text-slate-300 border-slate-500/20">{selectedClient?.companyName || 'Select account'}</Pill>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-xs text-slate-400">Order type<select className={inputClass} value={fulfilmentForm.orderType} onChange={(e) => updateFulfilmentField('orderType', e.target.value)}>{['BULK_REFILL','CYLINDER_REFILL','CYLINDER_EXCHANGE','EQUIPMENT_SUPPLY','OTHER'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Priority<select className={inputClass} value={fulfilmentForm.priority} onChange={(e) => updateFulfilmentField('priority', e.target.value)}>{['NORMAL','HIGH','URGENT','SCHEDULED_CONTRACT'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Request source<select className={inputClass} value={fulfilmentForm.requestSource} onChange={(e) => updateFulfilmentField('requestSource', e.target.value)}>{['WHATSAPP','RELATIONSHIP_MANAGER','PHONE_CALL','EMAIL','WALK_IN','ADMIN_ENTRY','OTHER'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Requested KG<input type="number" className={inputClass} value={fulfilmentForm.requestedKg} onChange={(e) => updateFulfilmentField('requestedKg', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Delivered KG<input type="number" className={inputClass} value={fulfilmentForm.deliveredKg} onChange={(e) => updateFulfilmentField('deliveredKg', e.target.value)} placeholder="Defaults to requested" /></label>
            <label className="text-xs text-slate-400">Selling ₦/KG<input type="number" className={inputClass} value={fulfilmentForm.sellingPricePerKg} onChange={(e) => updateFulfilmentField('sellingPricePerKg', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Cost ₦/KG<input type="number" className={inputClass} value={fulfilmentForm.costPerKg} onChange={(e) => updateFulfilmentField('costPerKg', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Delivery cost<input type="number" className={inputClass} value={fulfilmentForm.deliveryCost} onChange={(e) => updateFulfilmentField('deliveryCost', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Amount paid<input type="number" className={inputClass} value={fulfilmentForm.amountPaid} onChange={(e) => updateFulfilmentField('amountPaid', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Invoice number<input className={inputClass} value={fulfilmentForm.invoiceNumber} onChange={(e) => updateFulfilmentField('invoiceNumber', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Payment due date<input type="date" className={inputClass} value={fulfilmentForm.paymentDueDate} onChange={(e) => updateFulfilmentField('paymentDueDate', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Promised date/time<input type="datetime-local" className={inputClass} value={fulfilmentForm.promisedAt} onChange={(e) => updateFulfilmentField('promisedAt', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Scheduled date/time<input type="datetime-local" className={inputClass} value={fulfilmentForm.scheduledAt} onChange={(e) => updateFulfilmentField('scheduledAt', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Actual delivered<input type="datetime-local" className={inputClass} value={fulfilmentForm.actualDeliveredAt} onChange={(e) => updateFulfilmentField('actualDeliveredAt', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Status<select className={inputClass} value={fulfilmentForm.status} onChange={(e) => updateFulfilmentField('status', e.target.value)}>{['REQUESTED','SCHEDULED','IN_TRANSIT','DELIVERED','DELAYED','CANCELLED','FAILED'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Vehicle type<select className={inputClass} value={fulfilmentForm.vehicleType} onChange={(e) => updateFulfilmentField('vehicleType', e.target.value)}>{['NOT_ASSIGNED','TRUCK','VAN','THIRD_PARTY'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Truck / Van name<input className={inputClass} value={fulfilmentForm.vehicleType === 'VAN' ? fulfilmentForm.vanName : fulfilmentForm.truckName} onChange={(e) => { updateFulfilmentField(fulfilmentForm.vehicleType === 'VAN' ? 'vanName' : 'truckName', e.target.value); }} placeholder="Truck 001 / Van 002" /></label>
            <label className="text-xs text-slate-400">Truck trip ref<input className={inputClass} value={fulfilmentForm.truckTripId} onChange={(e) => updateFulfilmentField('truckTripId', e.target.value)} placeholder="Optional Wave 2 trip ID" /></label>
            <label className="text-xs text-slate-400">Driver<input className={inputClass} value={fulfilmentForm.driverName} onChange={(e) => updateFulfilmentField('driverName', e.target.value)} /></label>
            <label className="text-xs text-slate-400">Branch<select className={inputClass} value={fulfilmentForm.branchId} onChange={(e) => updateFulfilmentField('branchId', e.target.value)}><option value="">Use account branch</option>{branches.map((b) => <option key={b.id || b._id || b.name} value={b.id || b._id || b.name}>{b.name || b.branchName}</option>)}</select></label>
            <label className="text-xs text-slate-400">Delivery site name<input className={inputClass} value={fulfilmentForm.deliverySiteName} onChange={(e) => updateFulfilmentField('deliverySiteName', e.target.value)} placeholder="Hotel kitchen, estate plant room…" /></label>
            <label className="text-xs text-slate-400">Stock-in reference<input className={inputClass} value={fulfilmentForm.stockInReference} onChange={(e) => updateFulfilmentField('stockInReference', e.target.value)} placeholder="Reference only" /></label>
            <label className="text-xs text-slate-400 md:col-span-3">Delivery address<input className={inputClass} value={fulfilmentForm.deliveryAddress} onChange={(e) => updateFulfilmentField('deliveryAddress', e.target.value)} /></label>
            <label className="text-xs text-slate-400 md:col-span-3">Delay reason<input className={inputClass} value={fulfilmentForm.delayReason} onChange={(e) => updateFulfilmentField('delayReason', e.target.value)} /></label>
            <label className="text-xs text-slate-400 md:col-span-3">Service notes<textarea rows="2" className={inputClass} value={fulfilmentForm.serviceNotes} onChange={(e) => updateFulfilmentField('serviceNotes', e.target.value)} /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button icon={Truck} onClick={logFulfilment} disabled={saving || !selectedClient?.id || !fulfilmentForm.requestedKg}>{saving ? 'Saving…' : 'Log Fulfilment'}</Button>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">Estimated revenue {money(num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.sellingPricePerKg))}</Pill>
            <Pill tone="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Estimated margin {money((num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.sellingPricePerKg)) - (num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.costPerKg)) - num(fulfilmentForm.deliveryCost))}</Pill>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Relationship Activity</h3>
          <div className="space-y-3">
            <label className="text-xs text-slate-400">Type<select className={inputClass} value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>{['FOLLOW_UP','CALL','WHATSAPP','EMAIL','VISIT','NOTE','SERVICE_ISSUE','STAGE_CHANGE'].map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
            <label className="text-xs text-slate-400">Title<input className={inputClass} value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} /></label>
            <label className="text-xs text-slate-400">Note<textarea rows="3" className={inputClass} value={activityForm.note} onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })} /></label>
            <label className="text-xs text-slate-400">Outcome<input className={inputClass} value={activityForm.outcome} onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })} /></label>
            <label className="text-xs text-slate-400">Next follow-up<input type="date" className={inputClass} value={activityForm.nextFollowUpDate} onChange={(e) => setActivityForm({ ...activityForm, nextFollowUpDate: e.target.value })} /></label>
            <Button icon={PhoneCall} onClick={addActivity} disabled={saving || !selectedClient?.id || !activityForm.note}>Add Activity</Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Due Follow-ups</h3>
          <div className="space-y-2">
            {dueFollowUps.slice(0, 8).map((client) => (
              <div key={client.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div><div className="font-semibold text-white">{client.companyName}</div><div className="text-xs text-slate-500">RM: {client.relationshipManagerName || 'Unassigned'} · {client.phone || client.whatsappPhone || 'No phone'}</div></div>
                <Pill tone="bg-amber-500/10 text-amber-300 border-amber-500/20">{date(client.nextFollowUpDate)}</Pill>
              </div>
            ))}
            {!dueFollowUps.length && <p className="text-sm text-slate-500">No due follow-ups yet.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Top Corporate Accounts</h3>
          <div className="space-y-2">
            {(fulfilmentControl.byClient || []).slice(0, 8).map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white">{item.label}</div><Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{kg(item.deliveredKg)}</Pill></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400"><span>Revenue {money(item.revenue)}</span><span>Outstanding {money(item.outstandingAmount)}</span></div>
              </div>
            ))}
            {!(fulfilmentControl.byClient || []).length && <p className="text-sm text-slate-500">Top accounts will appear after fulfilment records are logged.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Vehicle / RM Performance</h3>
          <div className="space-y-2">
            {(fulfilmentControl.byVehicle || []).slice(0, 4).map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white"><Truck size={14} className="mr-1 inline" />{item.label}</div><span className="text-xs text-slate-400">{kg(item.deliveredKg)}</span></div>
                <div className="mt-1 text-xs text-slate-400">Revenue {money(item.revenue)} · Margin {money(item.grossMargin)}</div>
              </div>
            ))}
            {(fulfilmentControl.byRelationshipManager || []).slice(0, 4).map((item) => (
              <div key={`rm-${item.label}`} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white"><UserRound size={14} className="mr-1 inline" />{item.label}</div><span className="text-xs text-slate-400">{item.count} orders</span></div>
                <div className="mt-1 text-xs text-slate-400">Revenue {money(item.revenue)} · Outstanding {money(item.outstandingAmount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
