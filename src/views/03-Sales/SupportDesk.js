// src/views/03-Sales/SupportDesk.js
import React, { useContext, useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Headphones,
  MessageCircle,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Ticket,
  Truck,
  UserCheck,
} from 'lucide-react';
import { SocketContext } from '../../contexts/SocketContext';
import {
  getSupportDashboard,
  getSupportHub,
  listSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  addTicketNote,
  getTicketMessages,
  sendTicketMessage,
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
  'BILLING_DISPUTE',
  'QUANTITY_DISPUTE',
  'SAFETY_CONCERN',
  'CORPORATE_ACCOUNT',
  'GENERAL_ENQUIRY',
  'OTHER',
];

const inputClass = 'glass-input w-full px-3 py-2.5 text-sm bg-slate-950/80 text-white placeholder:text-slate-500';
const selectClass = `${inputClass} bg-black text-white option:bg-black option:text-white`;
const labelize = (v = '') => String(v || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-300">{label}</span>
    {children}
  </label>
);

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

const ChatBubble = ({ message }) => {
  const fromCustomer = message.recipientId === 'support' || message.senderType === 'CUSTOMER' || message.senderRole === 'customer' || message.channel === 'CORPORATE_SUPPORT' && message.recipientId === 'support';
  const adminSide = !fromCustomer;
  const who = message.senderName || (adminSide ? 'PrimeJet Support' : 'Customer');
  return (
    <div className={`flex ${adminSide ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm shadow-lg ${adminSide ? 'border-blue-400/20 bg-blue-500/15 text-blue-50 shadow-blue-950/20' : 'border-emerald-400/15 bg-emerald-500/10 text-slate-100 shadow-emerald-950/20'}`}>
        <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-slate-400"><span>{adminSide ? 'Admin reply' : 'Customer message'} · {who}</span><span>{fmtDate(message.createdAt)}</span></div>
        <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
      </div>
    </div>
  );
};

export default function SupportDesk({ setActiveView }) {
  const { socket } = useContext(SocketContext) || {};
  const [dashboard, setDashboard] = useState(null);
  const [hub, setHub] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [chatText, setChatText] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sourceType: '', openOnly: 'true' });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    corporateClientId: '',
    corporateClientName: '',
    orderId: '',
    corporateRequestId: '',
    corporateFulfilmentId: '',
    category: 'GENERAL_ENQUIRY',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    assignedTeam: 'SUPPORT',
    sourceType: 'GENERAL',
    subject: '',
    description: '',
  });

  const show = (message, type = 'success') => setNotification({ show: true, message, type });

  const loadMessages = async (ticket) => {
    if (!ticket?.id) {
      setMessages([]);
      return;
    }
    try {
      const data = await getTicketMessages(ticket.id);
      setMessages(safeArr(data?.messages || data?.rows));
    } catch (e) {
      setMessages([]);
      show(e?.message || 'Failed to load ticket conversation.', 'error');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashboardData, hubData, ticketData] = await Promise.all([
        getSupportDashboard(),
        getSupportHub({ limit: 10, sinceDays: 7 }),
        listSupportTickets({ limit: 30, openOnly: filters.openOnly, search: filters.search, status: filters.status, priority: filters.priority, sourceType: filters.sourceType }),
      ]);
      setDashboard(dashboardData);
      setHub(hubData);
      const rows = safeArr(ticketData?.tickets);
      setTickets(rows);
      if (!selectedTicket && rows[0]) {
        setSelectedTicket(rows[0]);
        await loadMessages(rows[0]);
      }
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
        limit: 30,
        openOnly: filters.openOnly,
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        sourceType: filters.sourceType,
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

  useEffect(() => {
    if (!socket) return undefined;
    const onTicket = ({ ticket } = {}) => {
      if (!ticket?.id) return;
      setTickets((prev) => {
        const exists = prev.some((t) => t.id === ticket.id);
        return exists ? prev.map((t) => (t.id === ticket.id ? ticket : t)) : [ticket, ...prev];
      });
      if (selectedTicket?.id === ticket.id) setSelectedTicket(ticket);
    };
    const onMessage = ({ ticket, message } = {}) => {
      if (ticket) onTicket({ ticket });
      if (message && selectedTicket?.id && (message.supportTicketId === selectedTicket.id || message.chatId === `corp-ticket:${selectedTicket.id}` || message.chatId === `support-ticket:${selectedTicket.id}`)) {
        setMessages((prev) => (prev.some((m) => (m.id || m._id) === (message.id || message._id)) ? prev : [...prev, message]));
      }
    };
    socket.on('support_ticket_created', onTicket);
    socket.on('support_ticket_updated', onTicket);
    socket.on('support_message_created', onMessage);
    return () => {
      socket.off('support_ticket_created', onTicket);
      socket.off('support_ticket_updated', onTicket);
      socket.off('support_message_created', onMessage);
    };
  }, [socket, selectedTicket?.id]);

  useEffect(() => {
    if (socket && selectedTicket?.id) socket.emit('join_support_ticket', { ticketId: selectedTicket.id });
  }, [socket, selectedTicket?.id]);

  const stats = dashboard?.summary || {};
  const queue = hub?.queue || {};

  const canCreate = useMemo(() => safeStr(form.subject).trim().length >= 3 && safeStr(form.description).trim().length >= 5, [form]);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    await loadMessages(ticket);
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      show('Please enter a subject and a short description.', 'error');
      return;
    }
    setTicketLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, safeStr(v).trim()]));
      const data = await createSupportTicket(payload);
      const created = data?.ticket;
      setForm({
        customerId: '', customerName: '', customerPhone: '', corporateClientId: '', corporateClientName: '', orderId: '', corporateRequestId: '', corporateFulfilmentId: '',
        category: 'GENERAL_ENQUIRY', priority: 'MEDIUM', severity: 'MEDIUM', assignedTeam: 'SUPPORT', sourceType: 'GENERAL', subject: '', description: '',
      });
      show('Support ticket created.');
      await loadAll();
      if (created) await selectTicket(created);
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

  const sendChat = async () => {
    if (!selectedTicket?.id || !chatText.trim()) return;
    try {
      const data = await sendTicketMessage(selectedTicket.id, chatText.trim());
      setChatText('');
      if (data?.ticket) {
        setSelectedTicket(data.ticket);
        setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? data.ticket : t)));
      }
      await loadMessages(selectedTicket);
    } catch (e) {
      show(e?.message || 'Failed to send message.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Notification notification={notification} setNotification={setNotification} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageTitle title="Support & Chat Desk" subtitle="Unified admin console for retail chats, corporate support tickets, complaint conversations, SLA control and follow-up workflow" />
        <div className="flex gap-2">
          <Button variant="secondary" icon={UserCheck} onClick={() => setActiveView?.('Customer360')}>Customer 360</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={loadAll} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={stats.openTickets} icon={Ticket} tone="blue" />
        <StatCard label="Overdue SLA" value={stats.overdueTickets} icon={ShieldAlert} tone="red" />
        <StatCard label="Escalated" value={stats.escalatedTickets} icon={AlertTriangle} tone="amber" />
        <StatCard label="Recent Chats" value={stats.recentChats} icon={MessageSquare} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Create Complaint / Ticket</h3>
              <p className="text-xs text-gray-500 mt-1">Manual support intake for retail and corporate delivery, payment, wallet and service issues.</p>
            </div>
            <Headphones className="text-blue-300" size={22} />
          </div>

          <form onSubmit={submitTicket} className="space-y-3">
            <Field label="Source type"><select className={selectClass} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>{['GENERAL','CHAT','ORDER','FAILED_DELIVERY','PAYMENT','WALLET','APP_ISSUE','DELIVERY','CORPORATE','OTHER'].map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
            <Field label="Customer ID"><input className={inputClass} placeholder="Optional retail customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Customer name"><input className={inputClass} placeholder="Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
              <Field label="Phone"><input className={inputClass} placeholder="Phone number" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Corporate client ID"><input className={inputClass} placeholder="Optional corporate client ID" value={form.corporateClientId} onChange={(e) => setForm({ ...form, corporateClientId: e.target.value, sourceType: e.target.value ? 'CORPORATE' : form.sourceType })} /></Field>
              <Field label="Corporate client name"><input className={inputClass} placeholder="Company name" value={form.corporateClientName} onChange={(e) => setForm({ ...form, corporateClientName: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Order ID"><input className={inputClass} placeholder="Retail order ID" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} /></Field>
              <Field label="Corporate request ID"><input className={inputClass} placeholder="B2B request ID" value={form.corporateRequestId} onChange={(e) => setForm({ ...form, corporateRequestId: e.target.value })} /></Field>
              <Field label="Corporate fulfilment ID"><input className={inputClass} placeholder="B2B fulfilment ID" value={form.corporateFulfilmentId} onChange={(e) => setForm({ ...form, corporateFulfilmentId: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Category"><select className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
              <Field label="Assigned team"><select className={selectClass} value={form.assignedTeam} onChange={(e) => setForm({ ...form, assignedTeam: e.target.value })}>{TEAMS.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
              <Field label="Priority"><select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
              <Field label="Severity"><select className={selectClass} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>{SEVERITIES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
            </div>
            <Field label="Subject"><input className={inputClass} placeholder="Short issue title" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
            <Field label="Description"><textarea className={`${inputClass} min-h-[110px]`} placeholder="Describe the complaint details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Button type="submit" icon={PlusCircle} disabled={!canCreate || ticketLoading} className="w-full">Create Ticket</Button>
          </form>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Ticket Queue</h3>
              <p className="text-xs text-gray-500 mt-1">Corporate Business Portal chats and retail support tickets appear here. Open a ticket to see the full conversation thread and reply from admin.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input className={`${inputClass} pl-9 w-56`} placeholder="Search ticket, company, phone..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
              </div>
              <select className={selectClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, openOnly: e.target.value ? '' : filters.openOnly })}>
                <option value="">Any status</option>{STATUSES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}
              </select>
              <select className={selectClass} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                <option value="">Any priority</option>{PRIORITIES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}
              </select>
              <select className={selectClass} value={filters.sourceType} onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}>
                <option value="">Any source</option>{['CORPORATE','ORDER','PAYMENT','WALLET','CHAT','GENERAL'].map((x) => <option key={x} value={x}>{labelize(x)}</option>)}
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
                  <tr key={t.id} className={`hover:bg-white/5 ${selectedTicket?.id === t.id ? 'bg-blue-500/5' : ''}`}>
                    <td className="p-4 align-top">
                      <p className="text-white font-semibold">{t.ticketNo || t.id}</p>
                      <p className="text-sm text-gray-300 mt-1 max-w-xs truncate">{t.subject}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-lg border text-xs ${badgeClass(t.status)}`}>{labelize(t.status)}</span>
                        <span className={`text-xs font-bold ${priorityClass(t.priority)}`}>{labelize(t.priority)}</span>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <p className="text-gray-200">{t.corporateClientName || t.customerName || t.customerId || 'Unknown customer'}</p>
                      <p className="text-xs text-gray-500">{labelize(t.category)} • {labelize(t.sourceType)}</p>
                      {t.orderId && <p className="text-xs text-blue-300 mt-1">Order: {t.orderId}</p>}
                      {t.corporateFulfilmentId && <p className="text-xs text-emerald-300 mt-1">B2B fulfilment: {t.corporateFulfilmentId}</p>}
                    </td>
                    <td className="p-4 align-top">
                      <p className={t?.slaStatus?.breached ? 'text-red-300' : 'text-emerald-300'}>{t?.slaStatus?.breached ? 'Breached / At risk' : 'Within SLA'}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {fmtDate(t?.slaStatus?.resolutionDueAt)}</p>
                    </td>
                    <td className="p-4 align-top">
                      <select className={`${selectClass} text-xs`} value={t.assignedTeam || 'SUPPORT'} onChange={(e) => updateTicket(t, { assignedTeam: e.target.value })}>{TEAMS.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2">
                        <Button variant="secondary" onClick={() => selectTicket(t)}>Open Chat</Button>
                        <select className={`${selectClass} text-xs`} value={t.status} onChange={(e) => updateTicket(t, { status: e.target.value })}>{STATUSES.map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select>
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
        <StatCard label="Failed Delivery Follow-up" value={stats.failedDeliveryRuns} icon={Truck} tone="red" />
      </div>

      {selectedTicket && (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-white/5 bg-white/[0.03] p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white"><MessageCircle className="mr-2 inline text-blue-300" size={20} />{selectedTicket.ticketNo} — {selectedTicket.subject}</h3>
                <p className="text-sm text-gray-400 mt-2">{selectedTicket.description || 'No description provided.'}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`px-2 py-1 rounded-lg border text-xs ${badgeClass(selectedTicket.status)}`}>{labelize(selectedTicket.status)}</span>
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">{labelize(selectedTicket.category)}</span>
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">Team: {labelize(selectedTicket.assignedTeam)}</span>
                  {selectedTicket.corporateClientName && <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">{selectedTicket.corporateClientName}</span>}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>Close Details</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0">
            <div className="border-r border-white/5 p-5">
              <h4 className="mb-3 font-semibold text-white">Customer Conversation</h4>
              <div className="max-h-[420px] min-h-[260px] space-y-3 overflow-y-auto rounded-2xl border border-white/5 bg-slate-950/30 p-4">
                {messages.map((m) => <ChatBubble key={m.id || m._id || m.createdAt} message={m} />)}
                {!messages.length && <p className="text-center text-sm text-gray-500">No chat messages yet. Send the first support response below.</p>}
              </div>
              <div className="mt-4 flex flex-col gap-2 md:flex-row">
                <input className={`${inputClass} flex-1`} placeholder="Type a reply the customer can see..." value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }} />
                <Button icon={Send} onClick={sendChat} disabled={!chatText.trim()}>Send Reply</Button>
              </div>
            </div>

            <div className="p-5">
              <h4 className="font-semibold text-white mb-3">Notes / Audit Trail</h4>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {safeArr(selectedTicket.notes).length === 0 ? <p className="text-sm text-gray-500">No notes yet.</p> : safeArr(selectedTicket.notes).slice().reverse().map((n) => (
                  <div key={n.id || n.createdAt} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-sm text-gray-200">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-2">{labelize(n.noteType)} • {n.authorEmail || 'system'} • {fmtDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Field label="Internal note"><textarea className={`${inputClass} min-h-[120px]`} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add private update, escalation note, or resolution detail..." /></Field>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500">Internal notes are visible to staff only. Chat replies are visible to the customer.</p>
                  <Button icon={CheckCircle} onClick={submitNote} disabled={!noteText.trim()}>Add Note</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
