// File: src/views/02-Performance/DriverScorecards.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import {
  getFleetDashboard,
  getTruckAssets,
  getTruckTrips,
  createTruckAsset,
  createTruckTrip,
  updateTruckTripStatus,
  addTruckTripCost,
  addTruckTripOffload,
  recalculateTruckTrip,
} from '../../api/fleetService';
import {
  Truck,
  Gauge,
  Fuel,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Route,
  Building2,
  Users,
  Calculator,
  ClipboardCheck,
} from 'lucide-react';

const money = (v) => `₦${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const kg = (v) => `${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}kg`;
const num = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const pct = (v) => `${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
const shortDate = (v) => (v ? new Date(v).toLocaleString() : '—');
const safeRows = (v) => (Array.isArray(v) ? v : []);

const emptyTruck = {
  name: '',
  plateNumber: '',
  capacityKg: 20000,
  ownershipType: 'FINANCED',
  acquisitionCost: '',
  loanAmount: '',
  monthlyRepayment: '',
  interestRatePct: '',
  loanTenorMonths: 48,
  usefulLifeYears: 5,
  insuranceAnnualCost: '',
  licensingAnnualCost: '',
  maintenanceReserveMonthly: '',
  expectedMonthlyTrips: 4,
  expectedMonthlyKg: 80000,
  targetGrossMarginPerKg: 150,
  defaultDriverName: '',
  defaultAssistantName: '',
};

const emptyTrip = {
  truckId: '',
  tripType: 'REFINERY_OFFTAKE',
  sourceType: 'SUPPLIER',
  sourceName: '',
  plannedDepartureAt: '',
  expectedKg: '',
  loadedKg: '',
  purchasePricePerKg: '',
  loadingTicketNumber: '',
  waybillNumber: '',
  driverName: '',
  assistantName: '',
  status: 'PLANNED',
};

const emptyCost = {
  category: 'DIESEL',
  description: '',
  amount: '',
  treatment: 'CAPITALISE',
  capitalisedRatioPct: 100,
  paymentMethod: 'Cash',
};

const emptyOffload = {
  destinationType: 'BRANCH',
  destinationName: '',
  branchName: '',
  corporateClientName: '',
  requestedKg: '',
  deliveredKg: '',
  receivedKg: '',
  sellingPricePerKg: '',
  deliveryCost: '',
  receiptStatus: 'PENDING',
  customerConfirmed: false,
  stockInReference: '',
  fulfilmentId: '',
  waybillReference: '',
  notes: '',
};

const Stat = ({ icon: Icon, label, value, sub, tone = 'text-blue-300' }) => (
  <div className="glass-card p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white mt-1">{value}</p>
        {sub ? <p className="text-[11px] text-gray-500 mt-1">{sub}</p> : null}
      </div>
      {Icon ? <Icon size={22} className={tone} /> : null}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-xs text-gray-400 mb-1">{label}</span>
    {children}
  </label>
);

const Input = (props) => <input {...props} className={`glass-input p-2 text-sm w-full ${props.className || ''}`} />;
const Select = (props) => <select {...props} className={`glass-input p-2 text-sm w-full bg-black/30 ${props.className || ''}`} />;

const MiniTable = ({ headers, rows, renderRow, empty = 'No records yet.' }) => (
  <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/10">
    <table className="min-w-full text-sm">
      <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wide">
        <tr>{headers.map((h) => <th key={h} className="text-left p-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td className="p-4 text-gray-500" colSpan={headers.length}>{empty}</td></tr>
        ) : rows.map(renderRow)}
      </tbody>
    </table>
  </div>
);

const StatusBadge = ({ value }) => {
  const map = {
    PLANNED: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    LOADING: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    LOADED: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    IN_TRANSIT: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    PARTIALLY_OFFLOADED: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    COMPLETED: 'bg-green-500/10 text-green-300 border-green-500/20',
    CLOSED: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
    UNDER_REVIEW: 'bg-red-500/10 text-red-300 border-red-500/20',
  };
  return <span className={`px-2 py-1 rounded-full border text-[11px] ${map[value] || 'bg-white/10 text-gray-300 border-white/10'}`}>{value || '—'}</span>;
};

export default function DriverScorecards() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState({ metrics: {}, trucks: [], activeTrips: [], recentTrips: [], byTruck: [], byDestination: [], mobileInventory: [] });
  const [trucks, setTrucks] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [truckForm, setTruckForm] = useState(emptyTruck);
  const [tripForm, setTripForm] = useState(emptyTrip);
  const [costForm, setCostForm] = useState(emptyCost);
  const [offloadForm, setOffloadForm] = useState(emptyOffload);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedTrip = useMemo(() => trips.find((t) => t.id === selectedTripId) || dashboard.recentTrips?.find((t) => t.id === selectedTripId), [trips, selectedTripId, dashboard.recentTrips]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, truckRes, tripRes] = await Promise.all([getFleetDashboard(), getTruckAssets(), getTruckTrips({ limit: 100 })]);
      setDashboard(dash || {});
      setTrucks(safeRows(truckRes?.rows));
      const rows = safeRows(tripRes?.rows);
      setTrips(rows);
      if (!selectedTripId && rows[0]) setSelectedTripId(rows[0].id);
    } catch (e) {
      setError(e.message || 'Unable to load fleet economics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateForm = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateTruck = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await createTruckAsset(truckForm);
      setTruckForm(emptyTruck);
      setMessage('Truck asset created.');
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const truck = trucks.find((t) => t.id === tripForm.truckId);
      const payload = { ...tripForm };
      if (truck) {
        payload.truckName = truck.name;
        payload.plateNumber = truck.plateNumber;
        payload.driverName = payload.driverName || truck.defaultDriverName;
        payload.assistantName = payload.assistantName || truck.defaultAssistantName;
      }
      const res = await createTruckTrip(payload);
      setTripForm(emptyTrip);
      setSelectedTripId(res?.trip?.id || '');
      setMessage('Truck trip created.');
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const handleAddCost = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return setError('Select a trip first.');
    setMessage(''); setError('');
    try {
      await addTruckTripCost(selectedTripId, costForm);
      setCostForm(emptyCost);
      setMessage('Trip cost added and landed cost recalculated.');
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const handleAddOffload = async (e) => {
    e.preventDefault();
    if (!selectedTripId) return setError('Select a trip first.');
    setMessage(''); setError('');
    try {
      const payload = { ...offloadForm };
      if (payload.destinationType === 'BRANCH') {
        payload.destinationName = payload.branchName || payload.destinationName;
      }
      if (payload.destinationType === 'CORPORATE_CLIENT') {
        payload.destinationName = payload.corporateClientName || payload.destinationName;
      }
      await addTruckTripOffload(selectedTripId, payload);
      setOffloadForm(emptyOffload);
      setMessage('Offload recorded. Truck inventory and trip economics recalculated.');
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const handleTripStatus = async (status) => {
    if (!selectedTripId) return;
    setMessage(''); setError('');
    try {
      await updateTruckTripStatus(selectedTripId, { status });
      setMessage(`Trip marked ${status}.`);
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const handleRecalculate = async () => {
    if (!selectedTripId) return;
    setMessage(''); setError('');
    try {
      await recalculateTruckTrip(selectedTripId);
      setMessage('Trip economics recalculated.');
      await loadAll();
    } catch (err) { setError(err.message); }
  };

  const metrics = dashboard.metrics || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageTitle title="Fleet & Truck Economics" subtitle="Advanced truck profit centre, LPG-in-transit and multi-drop offtake economics" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadAll} className="glass-button px-3 py-2 text-sm flex items-center gap-2" disabled={loading}><RefreshCw size={15} /> Refresh</button>
          {['dashboard', 'trucks', 'trips', 'inventory'].map((x) => (
            <button key={x} onClick={() => setTab(x)} className={`px-3 py-2 rounded-lg text-sm ${tab === x ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
              {x === 'dashboard' ? 'Control Tower' : x === 'trucks' ? 'Truck Assets' : x === 'trips' ? 'Trips & Offloads' : 'Mobile Inventory'}
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">{message}</div> : null}
      {error ? <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div> : null}

      <div className="glass-card p-4 border-l-4 border-blue-500/60">
        <div className="flex items-start gap-3">
          <Calculator className="text-blue-300 mt-1" size={22} />
          <div>
            <h3 className="font-bold text-white">Wave C scope control</h3>
            <p className="text-sm text-gray-400 mt-1">
              This module calculates truck economics, landed cost/kg, LPG in transit, trip profit, group contribution, utilization and offload references. It does not automatically post stock or GL yet; branch receipt, StockIn creation and GL posting remain the next controlled bridge.
            </p>
          </div>
        </div>
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat icon={Truck} label="Truck Assets" value={metrics.truckCount || 0} sub={`${metrics.activeTruckCount || 0} active/idle/in-transit`} />
            <Stat icon={Route} label="Active Trips" value={metrics.activeTrips || 0} sub={`${metrics.completedTrips || 0} completed/closed`} tone="text-purple-300" />
            <Stat icon={PackageCheck} label="KG Delivered" value={kg(metrics.deliveredKg)} sub={`${kg(metrics.internalDeliveredKg)} internal / ${kg(metrics.externalDeliveredKg)} external`} tone="text-green-300" />
            <Stat icon={AlertTriangle} label="Variance / Loss" value={kg(metrics.varianceKg)} sub="Loaded less offloaded balance" tone="text-yellow-300" />
            <Stat icon={Fuel} label="Avg Landed Cost" value={money(metrics.landedCostPerKg)} sub="per kg across truck trips" tone="text-cyan-300" />
            <Stat icon={TrendingUp} label="External Revenue" value={money(metrics.externalRevenue)} sub={`Gross profit: ${money(metrics.externalGrossProfit)}`} tone="text-green-300" />
            <Stat icon={Gauge} label="Cost/KG Transported" value={money(metrics.avgCostPerKgTransported)} sub={`Trip costs: ${money(metrics.totalTripCost)}`} tone="text-blue-300" />
            <Stat icon={Calculator} label="Net Truck Contribution" value={money(metrics.netContributionAfterFixedCost)} sub={`Direct truck profit: ${money(metrics.directTruckProfit)}`} tone="text-emerald-300" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-bold text-white mb-4">Truck profitability</h3>
              <MiniTable
                headers={['Truck', 'Trips', 'Delivered', 'External Rev.', 'Direct Profit', 'Net Contribution']}
                rows={safeRows(dashboard.byTruck)}
                renderRow={(r) => (
                  <tr key={r.label} className="border-t border-white/5">
                    <td className="p-3 text-white">{r.label}</td>
                    <td className="p-3 text-gray-300">{r.count}</td>
                    <td className="p-3 text-gray-300">{kg(r.deliveredKg)}</td>
                    <td className="p-3 text-green-300">{money(r.externalRevenue)}</td>
                    <td className="p-3 text-blue-300">{money(r.directTruckProfit)}</td>
                    <td className="p-3 text-emerald-300">{money(r.netContributionAfterFixedCost)}</td>
                  </tr>
                )}
              />
            </div>
            <div className="glass-card p-5">
              <h3 className="font-bold text-white mb-4">Destination contribution</h3>
              <MiniTable
                headers={['Destination', 'Drops', 'Delivered', 'Transfer Value', 'External Revenue']}
                rows={safeRows(dashboard.byDestination)}
                renderRow={(r) => (
                  <tr key={r.label} className="border-t border-white/5">
                    <td className="p-3 text-white">{r.label}</td>
                    <td className="p-3 text-gray-300">{r.count}</td>
                    <td className="p-3 text-gray-300">{kg(r.deliveredKg)}</td>
                    <td className="p-3 text-cyan-300">{money(r.transferValue)}</td>
                    <td className="p-3 text-green-300">{money(r.revenue)}</td>
                  </tr>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'trucks' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <form onSubmit={handleCreateTruck} className="glass-card p-5 space-y-3 xl:col-span-1">
            <h3 className="font-bold text-white flex items-center gap-2"><Plus size={16} /> Create truck asset</h3>
            <Field label="Truck name"><Input name="name" value={truckForm.name} onChange={updateForm(setTruckForm)} placeholder="PrimeJet Truck 001" required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plate number"><Input name="plateNumber" value={truckForm.plateNumber} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Capacity KG"><Input type="number" name="capacityKg" value={truckForm.capacityKg} onChange={updateForm(setTruckForm)} /></Field>
            </div>
            <Field label="Ownership"><Select name="ownershipType" value={truckForm.ownershipType} onChange={updateForm(setTruckForm)}><option>OWNED</option><option>FINANCED</option><option>LEASED</option><option>THIRD_PARTY</option></Select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Acquisition cost"><Input type="number" name="acquisitionCost" value={truckForm.acquisitionCost} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Loan amount"><Input type="number" name="loanAmount" value={truckForm.loanAmount} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Monthly repayment"><Input type="number" name="monthlyRepayment" value={truckForm.monthlyRepayment} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Useful life years"><Input type="number" name="usefulLifeYears" value={truckForm.usefulLifeYears} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Expected monthly trips"><Input type="number" name="expectedMonthlyTrips" value={truckForm.expectedMonthlyTrips} onChange={updateForm(setTruckForm)} /></Field>
              <Field label="Target margin/kg"><Input type="number" name="targetGrossMarginPerKg" value={truckForm.targetGrossMarginPerKg} onChange={updateForm(setTruckForm)} /></Field>
            </div>
            <Field label="Default driver"><Input name="defaultDriverName" value={truckForm.defaultDriverName} onChange={updateForm(setTruckForm)} /></Field>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 font-semibold">Save Truck</button>
          </form>

          <div className="glass-card p-5 xl:col-span-2">
            <h3 className="font-bold text-white mb-4">Truck assets</h3>
            <MiniTable
              headers={['Truck', 'Plate', 'Capacity', 'Ownership', 'Fixed Monthly Cost', 'Status']}
              rows={trucks}
              renderRow={(t) => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="p-3 text-white"><div className="font-semibold">{t.name}</div><div className="text-xs text-gray-500">{t.defaultDriverName || 'No default driver'}</div></td>
                  <td className="p-3 text-gray-300">{t.plateNumber || '—'}</td>
                  <td className="p-3 text-gray-300">{kg(t.capacityKg)}</td>
                  <td className="p-3 text-gray-300">{t.ownershipType}</td>
                  <td className="p-3 text-cyan-300">{money(t.fixedMonthlyCost)}</td>
                  <td className="p-3"><span className="px-2 py-1 rounded-full bg-white/10 text-gray-300 text-xs">{t.status}</span></td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      {tab === 'trips' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form onSubmit={handleCreateTrip} className="glass-card p-5 space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2"><Route size={16} /> Plan offtake trip</h3>
              <Field label="Truck"><Select name="truckId" value={tripForm.truckId} onChange={updateForm(setTripForm)} required><option value="">Select truck</option>{trucks.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.plateNumber}</option>)}</Select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Trip type"><Select name="tripType" value={tripForm.tripType} onChange={updateForm(setTripForm)}><option>REFINERY_OFFTAKE</option><option>SUPPLIER_PICKUP</option><option>MIXED_DROP</option><option>BRANCH_SUPPLY</option><option>CORPORATE_DELIVERY</option><option>OTHER</option></Select></Field>
                <Field label="Source type"><Select name="sourceType" value={tripForm.sourceType} onChange={updateForm(setTripForm)}><option>REFINERY</option><option>SUPPLIER</option><option>DEPOT</option><option>BRANCH</option><option>OTHER</option></Select></Field>
              </div>
              <Field label="Source / Supplier"><Input name="sourceName" value={tripForm.sourceName} onChange={updateForm(setTripForm)} placeholder="NNPC / NNaco / Refinery" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expected KG"><Input type="number" name="expectedKg" value={tripForm.expectedKg} onChange={updateForm(setTripForm)} /></Field>
                <Field label="Loaded KG"><Input type="number" name="loadedKg" value={tripForm.loadedKg} onChange={updateForm(setTripForm)} /></Field>
                <Field label="Purchase ₦/KG"><Input type="number" name="purchasePricePerKg" value={tripForm.purchasePricePerKg} onChange={updateForm(setTripForm)} /></Field>
                <Field label="Plan date"><Input type="datetime-local" name="plannedDepartureAt" value={tripForm.plannedDepartureAt} onChange={updateForm(setTripForm)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Loading ticket"><Input name="loadingTicketNumber" value={tripForm.loadingTicketNumber} onChange={updateForm(setTripForm)} /></Field>
                <Field label="Waybill"><Input name="waybillNumber" value={tripForm.waybillNumber} onChange={updateForm(setTripForm)} /></Field>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 font-semibold">Create Trip</button>
            </form>

            <div className="glass-card p-5 xl:col-span-2 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h3 className="font-bold text-white">Trips</h3>
                <Select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} className="md:w-80"><option value="">Select trip</option>{trips.map((t) => <option key={t.id} value={t.id}>{t.tripCode} — {t.truckName}</option>)}</Select>
              </div>
              <MiniTable
                headers={['Trip', 'Truck', 'Loaded/Delivered', 'Landed ₦/KG', 'External Profit', 'Status']}
                rows={trips}
                renderRow={(t) => (
                  <tr key={t.id} onClick={() => setSelectedTripId(t.id)} className={`border-t border-white/5 cursor-pointer hover:bg-white/5 ${selectedTripId === t.id ? 'bg-blue-500/10' : ''}`}>
                    <td className="p-3 text-white"><div className="font-semibold">{t.tripCode}</div><div className="text-xs text-gray-500">{shortDate(t.plannedDepartureAt || t.createdAt)}</div></td>
                    <td className="p-3 text-gray-300">{t.truckName}</td>
                    <td className="p-3 text-gray-300">{kg(t.loadedKg)} / {kg(t.economics?.deliveredKg)}</td>
                    <td className="p-3 text-cyan-300">{money(t.economics?.landedCostPerKg)}</td>
                    <td className="p-3 text-green-300">{money(t.economics?.externalGrossProfit)}</td>
                    <td className="p-3"><StatusBadge value={t.status} /></td>
                  </tr>
                )}
              />
            </div>
          </div>

          {selectedTrip && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="glass-card p-5 space-y-4">
                <h3 className="font-bold text-white">Selected trip economics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Landed ₦/KG" value={money(selectedTrip.economics?.landedCostPerKg)} />
                  <Stat label="Cost/KG Transported" value={money(selectedTrip.economics?.costPerKgTransported)} />
                  <Stat label="External Revenue" value={money(selectedTrip.economics?.externalRevenue)} />
                  <Stat label="External GP" value={money(selectedTrip.economics?.externalGrossProfit)} />
                  <Stat label="Internal Transfer" value={money(selectedTrip.economics?.internalTransferValue)} />
                  <Stat label="Net Contribution" value={money(selectedTrip.economics?.netContributionAfterFixedCost)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['LOADING', 'LOADED', 'IN_TRANSIT', 'COMPLETED', 'CLOSED', 'UNDER_REVIEW'].map((s) => <button key={s} onClick={() => handleTripStatus(s)} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-200">Mark {s}</button>)}
                  <button onClick={handleRecalculate} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white">Recalculate</button>
                </div>
                {safeRows(selectedTrip.reviewFlags).length ? (
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs">
                    Review flags: {selectedTrip.reviewFlags.join(', ')}
                  </div>
                ) : null}
              </div>

              <form onSubmit={handleAddCost} className="glass-card p-5 space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2"><Fuel size={16} /> Add trip cost</h3>
                <Field label="Category"><Select name="category" value={costForm.category} onChange={updateForm(setCostForm)}><option>DIESEL</option><option>DRIVER_ALLOWANCE</option><option>ASSISTANT_ALLOWANCE</option><option>TOLL</option><option>SECURITY</option><option>LOADING_CHARGE</option><option>UNION_FEE</option><option>MAINTENANCE</option><option>MISCELLANEOUS</option></Select></Field>
                <Field label="Amount"><Input type="number" name="amount" value={costForm.amount} onChange={updateForm(setCostForm)} required /></Field>
                <Field label="Treatment"><Select name="treatment" value={costForm.treatment} onChange={updateForm(setCostForm)}><option>CAPITALISE</option><option>EXPENSE</option><option>SPLIT</option></Select></Field>
                {costForm.treatment === 'SPLIT' ? <Field label="Capitalised %"><Input type="number" name="capitalisedRatioPct" value={costForm.capitalisedRatioPct} onChange={updateForm(setCostForm)} /></Field> : null}
                <Field label="Description"><Input name="description" value={costForm.description} onChange={updateForm(setCostForm)} /></Field>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 font-semibold">Add Cost</button>
              </form>

              <form onSubmit={handleAddOffload} className="glass-card p-5 space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2"><PackageCheck size={16} /> Add offload</h3>
                <Field label="Destination type"><Select name="destinationType" value={offloadForm.destinationType} onChange={updateForm(setOffloadForm)}><option>BRANCH</option><option>CORPORATE_CLIENT</option><option>RESELLER</option><option>BULK_CUSTOMER</option><option>OTHER</option></Select></Field>
                {offloadForm.destinationType === 'BRANCH' ? <Field label="Branch / Plant"><Input name="branchName" value={offloadForm.branchName} onChange={updateForm(setOffloadForm)} placeholder="Ajah / Festac" /></Field> : null}
                {offloadForm.destinationType === 'CORPORATE_CLIENT' ? <Field label="Corporate client"><Input name="corporateClientName" value={offloadForm.corporateClientName} onChange={updateForm(setOffloadForm)} /></Field> : null}
                {!['BRANCH', 'CORPORATE_CLIENT'].includes(offloadForm.destinationType) ? <Field label="Destination name"><Input name="destinationName" value={offloadForm.destinationName} onChange={updateForm(setOffloadForm)} /></Field> : null}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Delivered KG"><Input type="number" name="deliveredKg" value={offloadForm.deliveredKg} onChange={updateForm(setOffloadForm)} required /></Field>
                  <Field label="Received KG"><Input type="number" name="receivedKg" value={offloadForm.receivedKg} onChange={updateForm(setOffloadForm)} /></Field>
                  <Field label="Selling ₦/KG"><Input type="number" name="sellingPricePerKg" value={offloadForm.sellingPricePerKg} onChange={updateForm(setOffloadForm)} /></Field>
                  <Field label="Delivery cost"><Input type="number" name="deliveryCost" value={offloadForm.deliveryCost} onChange={updateForm(setOffloadForm)} /></Field>
                </div>
                <Field label="Receipt status"><Select name="receiptStatus" value={offloadForm.receiptStatus} onChange={updateForm(setOffloadForm)}><option>PENDING</option><option>CONFIRMED</option><option>DISPUTED</option><option>REJECTED</option></Select></Field>
                <Field label="StockIn / fulfilment reference"><Input name="stockInReference" value={offloadForm.stockInReference} onChange={updateForm(setOffloadForm)} placeholder="Optional reference only" /></Field>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 font-semibold">Record Offload</button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {safeRows(dashboard.mobileInventory).length === 0 ? (
              <div className="glass-card p-8 text-gray-500">No active LPG-in-transit records yet.</div>
            ) : dashboard.mobileInventory.map((item) => (
              <div key={item.tripId} className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{item.truckName}</h3>
                    <p className="text-xs text-gray-500">{item.tripCode} · Landed cost {money(item.landedCostPerKg)}/kg</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Loaded" value={kg(item.loadedKg)} />
                  <Stat label="Delivered" value={kg(item.deliveredKg)} />
                  <Stat label="Balance" value={kg(item.expectedBalanceKg)} />
                </div>
                <MiniTable
                  headers={['Type', 'Description', 'In', 'Out', 'Balance']}
                  rows={safeRows(item.ledger)}
                  renderRow={(l, idx) => (
                    <tr key={`${item.tripId}-${idx}`} className="border-t border-white/5">
                      <td className="p-3 text-gray-300">{l.type}</td>
                      <td className="p-3 text-white">{l.description}<div className="text-xs text-gray-500">{shortDate(l.date)}</div></td>
                      <td className="p-3 text-green-300">{l.inKg ? kg(l.inKg) : '—'}</td>
                      <td className="p-3 text-yellow-300">{l.outKg ? kg(l.outKg) : '—'}</td>
                      <td className="p-3 text-blue-300">{kg(l.balanceKg)}</td>
                    </tr>
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="fixed bottom-4 right-4 bg-black/80 text-white text-sm px-4 py-2 rounded-xl border border-white/10">Loading fleet economics...</div> : null}
    </div>
  );
}
