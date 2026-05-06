// src/views/03-Sales/SupportDesk.js
import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Headphones,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Ticket,
  Truck,
  UserCheck,
} from 'lucide-react';
import {
  getSupportDashboard,
  getSupportHub,
  listSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  addTicketNote,
} from '../../api/supportService';

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const safeStr = (v) => (typeof v === 'string' ? v : '');

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TEAMS = ['SUPPORT', 'OPERATIONS', 'FINANCE', 'ADMIN', 'UNASSIGNED'];
const CATEGORIES = [
  'DELIVERY_DELAY',
  'WRONG_CYLINDER',
  'PAYMENT_ISSUE',
  'FAILED_REFILL',
  'DRIVER_CONDUCT',
  'APP_ISSUE',
  'WALLET_REFUND',
  'FAILED_DELIVERY',
  'ORDER_UPDATE',
  'GENERAL_ENQUIRY',
  'OTHER',
];

const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const badgeClass = (status) => {
  const s = safeStr(status).toUpperCase();
  if (s === 'OPEN') return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (s === 'IN_PROGRESS') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (s === 'WAITING_CUSTOMER') return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
  if (s === 'ESCALATED') return 'bg-red-500/10 text-red-300 border-red-500/20';
  if (s === 'RESOLVED' || s === 'CLOSED') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  return 'bg-white/5 text-gray-300 border-white/10';
};

const priorityClass = (priority) => {
  const p = safeStr(priority).toUpperCase();
  if (p === 'URGENT') return 'text-red-300';
  if (p === 'HIGH') return 'text-orange-300';
  if (p === 'MEDIUM') return 'text-amber-300';
  return 'text-slate-300';
};

const StatCard = ({ label, value, icon: Icon, tone = 'blue' }) => {
  const toneClass = {
    blue: 'bg-blue-500/10 text-blue-300',
    red: 'bg-red-500/10 text-red-300',
    amber: 'bg-amber-500/10 text-amber-300',
    emerald: 'bg-emerald-500/10 text-emerald-300',
    purple: 'bg-purple-500/10 text-purple-300',
  }[tone] || 'bg-blue-500/10 text-blue-300';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{safeNum(value).toLocaleString()}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneClass}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
};

export default function SupportDesk({ setActiveView }) {
  const [dashboard, setDashboard] = useState(null);
  const [hub, setHub] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', openOnly: 'true' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    orderId: '',
    category: 'GENERAL_ENQUIRY',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    assignedTeam: 'SUPPORT',
    subject: '',
    description: '',
  });

  const show = (message, type = 'success') => setNotification({ show: true, message, type });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashboardData, hubData, ticketData] = await Promise.all([
        getSupportDashboard(),
        getSupportHub({ limit: 10, sinceDays: 7 }),
        listSupportTickets({ limit: 25, openOnly: filters.openOnly, search: filters.search, status: filters.status, priority: filters.priority }),
      ]);
      setDashboard(dashboardData);
      setHub(hubData);
      setTickets(safeArr(ticketData?.tickets));
    } catch (e) {
      console.error('Support load error', e);
      show(e?.message || 'Failed to load support desk.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshTickets = async () => {
    setTicketLoading(true);
    try {
      const data = await listSupportTickets({
        limit: 25,
        openOnly: filters.openOnly,
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
      });
      setTickets(safeArr(data?.tickets));
    } catch (e) {
      show(e?.message || 'Failed to refresh tickets.', 'error');
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = dashboard?.summary || {};
  const queue = hub?.queue || {};

  const canCreate = useMemo(() => {
    return safeStr(form.subject).trim().length >= 3 && safeStr(form.description).trim().length >= 5;
  }, [form]);

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      show('Please enter a subject and a short description.', 'error');
      return;
    }
    setTicketLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, safeStr(v).trim()]));
      await createSupportTicket(payload);
      setForm({
        customerId: '', customerName: '', customerPhone: '', orderId: '', category: 'GENERAL_ENQUIRY',
        priority: 'MEDIUM', severity: 'MEDIUM', assignedTeam: 'SUPPORT', subject: '', description: '',
      });
      show('Support ticket created.');
      await loadAll();
    } catch (e2) {
      show(e2?.message || 'Failed to create ticket.', 'error');
    } finally {
      setTicketLoading(false);
    }
  };

  const updateTicket = async (ticket, patch) => {
    try {
      const data = await updateSupportTicket(ticket.id, patch);
      const updated = data?.ticket;
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      show('Ticket updated.');
    } catch (e) {
      show(e?.message || 'Failed to update ticket.', 'error');
    }
  };

  const submitNote = async () => {
    if (!selectedTicket || !noteText.trim()) return;
    try {
      const data = await addTicketNote(selectedTicket.id, noteText, 'INTERNAL');
      setSelectedTicket(data?.ticket);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? data?.ticket : t)));
      setNoteText('');
      show('Note added.');
    } catch (e) {
      show(e?.message || 'Failed to add note.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Notification notification={notification} setNotification={setNotification} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageTitle title="Support Desk" subtitle="Customer complaints, SLA control, ticket workflow and customer follow-up" />
        <div className="flex gap-2">
          <Button variant="secondary" icon={UserCheck} onClick={() => setActiveView?.('Customer360')}>Customer 360</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={loadAll} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={stats.openTickets} icon={Ticket} tone="blue" />
        <StatCard label="Overdue SLA" value={stats.overdueTickets} icon={ShieldAlert} tone="red" />
        <StatCard label="Escalated" value={stats.escalatedTickets} icon={AlertTriangle} tone="amber" />
        <StatCard label="Failed Delivery Follow-up" value={stats.failedDeliveryRuns} icon={Truck} tone="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Create Complaint / Ticket</h3>
              <p className="text-xs text-gray-500 mt-1">Manual support intake for delivery, payment, app, wallet and order issues.</p>
            </div>
            <Headphones className="text-blue-300" size={22} />
          </div>

          <form onSubmit={submitTicket} className="space-y-3">
            <input className="glass-input w-full" placeholder="Customer ID (optional)" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="glass-input w-full" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              <input className="glass-input w-full" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <input className="glass-input w-full" placeholder="Order ID / Reference (optional)" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select className="glass-input w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="glass-input w-full" value={form.assignedTeam} onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })}>{TEAMS.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="glass-input w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="glass-input w-full" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>{SEVERITIES.map((x) => <option key={x}>{x}</option>)}</select>
            </div>

            <input className="glass-input w-full" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="glass-input w-full min-h-[110px]" placeholder="Description / customer complaint details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Button type="submit" icon={PlusCircle} disabled={!canCreate || ticketLoading} className="w-full">Create Ticket</Button>
          </form>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Ticket Queue</h3>
              <p className="text-xs text-gray-500 mt-1">Lifecycle: OPEN → IN_PROGRESS → WAITING_CUSTOMER → ESCALATED → RESOLVED → CLOSED</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input className="glass-input pl-9 w-56" placeholder="Search tickets..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
              </div>
              <select className="glass-input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, openOnly: e.target.value ? '' : filters.openOnly })}>
                <option value="">Any status</option>{STATUSES.map((x) => <option key={x}>{x}</option>)}
              </select>
              <select className="glass-input" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                <option value="">Any priority</option>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}
              </select>
              <Button variant="secondary" icon={RefreshCw} onClick={refreshTickets} disabled={ticketLoading}>Apply</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-white/5 text-xs uppercase text-gray-300">
                <tr>
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Customer / Source</th>
                  <th className="p-4">SLA</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No support tickets found.</td></tr>
                ) : tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="p-4 align-top">
                      <p className="text-white font-semibold">{t.ticketNo || t.id}</p>
                      <p className="text-sm text-gray-300 mt-1 max-w-xs truncate">{t.subject}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-lg border text-xs ${badgeClass(t.status)}`}>{t.status}</span>
                        <span className={`text-xs font-bold ${priorityClass(t.priority)}`}>{t.priority}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-gray-200">{t.customerName || t.customerId || 'Unknown customer'}</p>
                      <p className="text-xs text-gray-500">{t.category} • {t.sourceType}</p>
                      {t.orderId && <p className="text-xs text-blue-300 mt-1">Order: {t.orderId}</p>}
                    </td>
                    <td className="p-4 align-top">
                      <p className={t?.slaStatus?.breached ? 'text-red-300' : 'text-emerald-300'}>{t?.slaStatus?.breached ? 'Breached / At risk' : 'Within SLA'}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {fmtDate(t?.slaStatus?.resolutionDueAt)}</p>
                    </td>
                    <td className="p-4 align-top">
                      <select className="glass-input text-xs" value={t.assignedTeam || 'SUPPORT'} onChange={(e) => updateTicket(t, { assignedTeam: e.target.value })}>{TEAMS.map((x) => <option key={x}>{x}</option>)}</select>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2">
                        <Button variant="secondary" onClick={() => setSelectedTicket(t)}>View</Button>
                        <select className="glass-input text-xs" value={t.status} onChange={(e) => updateTicket(t, { status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="New Customer Orders" value={queue.newCustomerOrders} icon={MessageSquare} tone="blue" />
        <StatCard label="Active Deliveries" value={queue.activeDeliveries} icon={Truck} tone="purple" />
        <StatCard label="Waiting Customer" value={stats.waitingCustomerTickets} icon={Clock} tone="amber" />
        <StatCard label="Recent Chats" value={stats.recentChats} icon={MessageSquare} tone="emerald" />
      </div>

      {selectedTicket && (
        <Card>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{selectedTicket.ticketNo} — {selectedTicket.subject}</h3>
              <p className="text-sm text-gray-400 mt-2">{selectedTicket.description || 'No description provided.'}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`px-2 py-1 rounded-lg border text-xs ${badgeClass(selectedTicket.status)}`}>{selectedTicket.status}</span>
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">{selectedTicket.category}</span>
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">Team: {selectedTicket.assignedTeam}</span>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSelectedTicket(null)}>Close Details</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold text-white mb-3">Notes / Audit Trail</h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {safeArr(selectedTicket.notes).length === 0 ? <p className="text-sm text-gray-500">No notes yet.</p> : safeArr(selectedTicket.notes).slice().reverse().map((n) => (
                  <div key={n.id || n.createdAt} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm text-gray-200">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-2">{n.noteType} • {n.authorEmail || 'system'} • {fmtDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Add Internal Note</h4>
              <textarea className="glass-input w-full min-h-[120px]" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add update, customer feedback, escalation note, or resolution detail..." />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">Adding a note records accountability and can count as first response.</p>
                <Button icon={CheckCircle} onClick={submitNote} disabled={!noteText.trim()}>Add Note</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
