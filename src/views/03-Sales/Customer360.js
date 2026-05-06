// src/views/03-Sales/Customer360.js
import React, { useEffect, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import { Clock, FileText, MessageSquare, RefreshCw, Search, ShoppingBag, Ticket, User, Wallet } from 'lucide-react';
import { getCustomers } from '../../api/customerService';
import { getCustomer360, getCustomerTimeline, createSupportTicket } from '../../api/supportService';

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtMoney = (v) => `₦${safeNum(v).toLocaleString()}`;
const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const Stat = ({ label, value, icon: Icon }) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
        <p className="text-xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-300 flex items-center justify-center">
        <Icon size={18} />
      </div>
    </div>
  </Card>
);

const typeBadge = (type) => {
  const t = String(type || '').toUpperCase();
  if (t.includes('TICKET')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (t.includes('ORDER')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  if (t.includes('CHAT')) return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
  if (t.includes('NOTE')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  return 'bg-white/5 text-gray-300 border-white/10';
};

export default function Customer360() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [profile, setProfile] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const show = (message, type = 'success') => setNotification({ show: true, message, type });

  const searchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(search, 1);
      setCustomers(safeArr(data?.customers || data?.data || data));
    } catch (e) {
      show(e?.message || 'Failed to search customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomer = async (customerId = selectedCustomerId) => {
    if (!customerId) {
      show('Select or enter a customer ID first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const [profileData, timelineData] = await Promise.all([
        getCustomer360(customerId),
        getCustomerTimeline(customerId, { limit: 60 }),
      ]);
      setSelectedCustomerId(customerId);
      setProfile(profileData);
      setTimeline(safeArr(timelineData?.timeline));
    } catch (e) {
      show(e?.message || 'Failed to load customer 360.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createFollowUp = async () => {
    if (!profile?.customer?.id) return;
    try {
      await createSupportTicket({
        customerId: profile.customer.id,
        customerName: profile.customer.name,
        customerEmail: profile.customer.email,
        customerPhone: profile.customer.phone,
        category: 'GENERAL_ENQUIRY',
        priority: 'MEDIUM',
        severity: 'MEDIUM',
        assignedTeam: 'SUPPORT',
        subject: 'Customer follow-up from Customer 360',
        description: note || 'Manual follow-up created from Customer 360.',
      });
      setNote('');
      show('Follow-up ticket created.');
      await loadCustomer(profile.customer.id);
    } catch (e) {
      show(e?.message || 'Failed to create follow-up.', 'error');
    }
  };

  const customer = profile?.customer || null;
  const summary = profile?.summary || {};

  return (
    <div className="space-y-6">
      <Notification notification={notification} setNotification={setNotification} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <PageTitle title="Customer 360" subtitle="Unified customer profile, orders, tickets, notes, chat and timeline" />
        <Button variant="secondary" icon={RefreshCw} onClick={() => loadCustomer()} disabled={loading || !selectedCustomerId}>{loading ? 'Loading...' : 'Refresh Profile'}</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500 uppercase tracking-widest">Search customers</label>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <input className="glass-input w-full pl-9" placeholder="Search by name / phone / email..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') searchCustomers(); }} />
                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
              </div>
              <Button icon={Search} onClick={searchCustomers} disabled={loading}>Search</Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest">Or enter customer ID</label>
            <div className="flex gap-2 mt-2">
              <input className="glass-input w-full" placeholder="customerId" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} />
              <Button onClick={() => loadCustomer()} disabled={loading}>Load</Button>
            </div>
          </div>
        </div>

        {customers.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {customers.slice(0, 9).map((c) => (
              <button key={c.id} onClick={() => loadCustomer(c.id)} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-left transition">
                <p className="font-semibold text-white">{c.name || 'Customer'}</p>
                <p className="text-xs text-gray-500">{c.phone || c.email || c.id}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {customer ? (
        <>
          <Card>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {(customer.name || 'C')[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{customer.name || 'Customer'}</h3>
                  <p className="text-sm text-gray-400">{customer.phone || 'No phone'} • {customer.email || 'No email'}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {customer.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-gray-500">Last order</p>
                <p className="text-sm text-gray-300">{fmtDate(summary.lastOrderDate)}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <Stat label="Total Orders" value={safeNum(summary.totalOrders).toLocaleString()} icon={ShoppingBag} />
            <Stat label="Active Orders" value={safeNum(summary.activeOrders).toLocaleString()} icon={Clock} />
            <Stat label="Total Spent" value={fmtMoney(summary.totalSpent)} icon={Wallet} />
            <Stat label="Open Tickets" value={safeNum(summary.openTickets).toLocaleString()} icon={Ticket} />
            <Stat label="Chat Count" value={safeNum(summary.chatCount).toLocaleString()} icon={MessageSquare} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <h3 className="text-lg font-bold text-white mb-4">Unified Timeline</h3>
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {timeline.length === 0 ? <p className="text-gray-500">No timeline events found.</p> : timeline.map((event, idx) => (
                  <div key={`${event.type}-${event.refId}-${idx}`} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className={`inline-flex px-2 py-1 rounded-lg border text-xs ${typeBadge(event.type)}`}>{event.type}</span>
                        <h4 className="text-white font-semibold mt-2">{event.title}</h4>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description || '—'}</p>
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(event.occurredAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-bold text-white mb-3">Create Follow-up</h3>
                <p className="text-sm text-gray-500 mb-3">Create a support ticket directly from the customer profile.</p>
                <textarea className="glass-input w-full min-h-[130px]" placeholder="Follow-up note / issue details..." value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full mt-3" icon={FileText} onClick={createFollowUp}>Create Ticket</Button>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-white mb-3">Recent Tickets</h3>
                <div className="space-y-3">
                  {safeArr(profile?.tickets).length === 0 ? <p className="text-sm text-gray-500">No tickets found.</p> : safeArr(profile?.tickets).slice(0, 5).map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-white font-medium">{t.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.status} • {t.priority} • {fmtDate(t.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold text-white mb-3">Recent Notes</h3>
                <div className="space-y-3">
                  {safeArr(profile?.notes).length === 0 ? <p className="text-sm text-gray-500">No notes found.</p> : safeArr(profile?.notes).slice(0, 5).map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-sm text-gray-300">{n.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.authorEmail || 'system'} • {fmtDate(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-12 text-gray-500">
            <User size={42} className="mx-auto mb-3 opacity-50" />
            <p>Select a customer to load the 360 profile.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
