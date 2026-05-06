// File: src/views/03-Sales/WhatsAppBusinessLayer.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  getWhatsAppDashboard,
  getWhatsAppRequests,
  getWhatsAppConversations,
  getWhatsAppMessages,
  simulateWhatsAppInbound,
  sendWhatsAppMessage,
  updateWhatsAppRequestStatus,
  getWhatsAppOrderDrafts,
  updateWhatsAppOrderDraft,
  cancelWhatsAppOrderDraft,
  convertWhatsAppDraftToOrder,
  searchWhatsAppCustomers,
  linkWhatsAppContactToCustomer,
  createCustomerFromWhatsAppContact,
} from '../../api/whatsappService';

const StatCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/10">
    <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value ?? 0}</p>
    {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
  </div>
);

const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
    slate: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
};

const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60"
    />
  </label>
);

const statusTone = (status) => {
  if (['RESOLVED', 'CLOSED', 'CONVERTED'].includes(status)) return 'green';
  if (['ESCALATED', 'CANCELLED'].includes(status)) return 'red';
  if (['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'READY', 'SUBMITTED', 'IN_REVIEW'].includes(status)) return 'yellow';
  return 'slate';
};

const requestStatusTone = statusTone;

export default function WhatsAppBusinessLayer() {
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [simPhone, setSimPhone] = useState('2348012345678');
  const [simText, setSimText] = useState('menu');
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, reqs, convos, orderDrafts] = await Promise.all([
        getWhatsAppDashboard(),
        getWhatsAppRequests({ limit: 40 }),
        getWhatsAppConversations({ limit: 40 }),
        getWhatsAppOrderDrafts({ limit: 40 }),
      ]);
      setDashboard(dash);
      setRequests(reqs.requests || []);
      setContacts(convos.contacts || []);
      setDrafts(orderDrafts.drafts || []);
      const firstPhone = selectedPhone || convos.contacts?.[0]?.phone || '';
      if (firstPhone) {
        const contact = convos.contacts?.find((c) => c.phone === firstPhone) || convos.contacts?.[0] || null;
        setSelectedPhone(firstPhone);
        setSelectedContact(contact);
        const msg = await getWhatsAppMessages(firstPhone);
        setMessages(msg.messages || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load WhatsApp layer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openConversation = async (phone) => {
    setSelectedPhone(phone);
    setReplyText('');
    setSelectedContact(contacts.find((c) => c.phone === phone) || null);
    try {
      const msg = await getWhatsAppMessages(phone);
      setMessages(msg.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const simulate = async () => {
    setError('');
    setSuccess('');
    try {
      await simulateWhatsAppInbound({ phone: simPhone, text: simText, profileName: 'Test Customer' });
      setSuccess('Inbound WhatsApp message simulated successfully.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const sendReply = async () => {
    if (!selectedPhone || !replyText.trim()) return;
    setError('');
    try {
      await sendWhatsAppMessage({ to: selectedPhone, text: replyText.trim() });
      setReplyText('');
      const msg = await getWhatsAppMessages(selectedPhone);
      setMessages(msg.messages || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const markResolved = async (requestId) => {
    try {
      await updateWhatsAppRequestStatus(requestId, { status: 'RESOLVED', note: 'Resolved from WhatsApp Business Layer screen' });
      const reqs = await getWhatsAppRequests({ limit: 40 });
      setRequests(reqs.requests || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateDraft = (field, value) => {
    setSelectedDraft((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const saveDraft = async () => {
    if (!selectedDraft?.id) return;
    setError('');
    setSuccess('');
    try {
      await updateWhatsAppOrderDraft(selectedDraft.id, selectedDraft);
      setSuccess('WhatsApp order draft updated.');
      const orderDrafts = await getWhatsAppOrderDrafts({ limit: 40 });
      setDrafts(orderDrafts.drafts || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDraft = async () => {
    if (!selectedDraft?.id) return;
    setError('');
    setSuccess('');
    try {
      await cancelWhatsAppOrderDraft(selectedDraft.id, { reason: 'Cancelled from WhatsApp business app console' });
      setSuccess('WhatsApp order draft cancelled.');
      setSelectedDraft(null);
      const orderDrafts = await getWhatsAppOrderDrafts({ limit: 40 });
      setDrafts(orderDrafts.drafts || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const convertDraft = async () => {
    if (!selectedDraft?.id) return;
    setError('');
    setSuccess('');
    try {
      const res = await convertWhatsAppDraftToOrder(selectedDraft.id, { createCustomerIfMissing: true });
      setSuccess(`Draft converted to order ${res.order?.id || ''}`.trim());
      setSelectedDraft(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    setError('');
    try {
      const res = await searchWhatsAppCustomers({ q: customerSearch.trim() });
      setCustomerResults(res.customers || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const linkCustomer = async (customerId) => {
    if (!selectedContact?.id) return;
    setError('');
    setSuccess('');
    try {
      await linkWhatsAppContactToCustomer(selectedContact.id, { customerId });
      setSuccess('WhatsApp contact linked to customer.');
      setCustomerResults([]);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const createCustomer = async () => {
    if (!selectedContact?.id) return;
    setError('');
    setSuccess('');
    try {
      await createCustomerFromWhatsAppContact(selectedContact.id, { name: selectedContact.profileName || `WhatsApp ${selectedContact.phone}` });
      setSuccess('Customer profile created and linked from WhatsApp contact.');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const summary = dashboard?.summary || {};
  const checklist = dashboard?.readiness || [];
  const activeRequests = useMemo(() => requests.filter((r) => !['RESOLVED', 'CLOSED'].includes(r.status)), [requests]);
  const activeDrafts = useMemo(() => drafts.filter((d) => !['CONVERTED', 'CANCELLED', 'CLOSED'].includes(d.status)), [drafts]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-blue-500/10 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Sales & CRM</p>
            <h1 className="mt-2 text-3xl font-black text-white">WhatsApp Business Layer</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              WhatsApp mini-app foundation for order status, structured refill intake, customer matching, support handoff and business-app administration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={summary.mode === 'LIVE' ? 'green' : 'yellow'}>{summary.mode || 'DRY_RUN'}</Badge>
            <Badge tone="purple">Wave 22B Order Intake</Badge>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="WhatsApp Contacts" value={summary.contacts} helper="Known WhatsApp customers" />
        <StatCard label="Open Requests" value={summary.openRequests} helper="Needs team action" />
        <StatCard label="Inbound Today" value={summary.todayInbound} helper="Customer messages" />
        <StatCard label="Support Handoffs" value={summary.handoffs} helper="Human follow-up" />
        <StatCard label="Ready Drafts" value={summary.orderDraftsReady} helper="Awaiting confirmation" />
        <StatCard label="Submitted Drafts" value={summary.submittedDrafts} helper="Sales review queue" />
        <StatCard label="Dry-run Outbox" value={summary.dryRunOutbound} helper="Not sent to Meta yet" />
      </div>

      <div className="flex flex-wrap gap-2">
        {['requests', 'drafts', 'conversations', 'identity', 'readiness', 'simulator'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-emerald-500 text-white' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {tab === 'drafts' ? 'Order Intake' : tab}
          </button>
        ))}
        <button onClick={loadAll} className="ml-auto rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">Refresh</button>
      </div>

      {activeTab === 'requests' && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">Customer Requests</h2>
          <p className="mb-4 text-xs text-slate-400">Requests created from WhatsApp messages, bot menu selections and order-intake confirmations.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Request</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Action</th></tr></thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => (
                  <tr key={req.id} className="text-slate-300">
                    <td className="py-3 pr-4"><p className="font-semibold text-white">{req.requestNo}</p><p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleString()}</p></td>
                    <td className="py-3 pr-4"><button onClick={() => openConversation(req.phone)} className="font-semibold text-blue-300 hover:text-blue-200">{req.customerName || req.phone}</button><p className="text-xs text-slate-500">{req.phone}</p></td>
                    <td className="py-3 pr-4">{req.requestType}</td>
                    <td className="py-3 pr-4"><Badge tone={requestStatusTone(req.status)}>{req.status}</Badge></td>
                    <td className="py-3 pr-4">{!['RESOLVED', 'CLOSED'].includes(req.status) && <button onClick={() => markResolved(req.id)} className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25">Mark resolved</button>}</td>
                  </tr>
                ))}
                {!requests.length && !loading && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No WhatsApp requests yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'drafts' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
            <h2 className="text-lg font-bold text-white">WhatsApp Order Intake Queue</h2>
            <p className="mb-4 text-xs text-slate-400">Structured refill requests captured from WhatsApp before fulfilment/order creation.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Draft</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Request</th><th className="py-2 pr-4">Confidence</th><th className="py-2 pr-4">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {drafts.map((draft) => (
                    <tr key={draft.id} onClick={() => setSelectedDraft(draft)} className="cursor-pointer text-slate-300 hover:bg-white/5">
                      <td className="py-3 pr-4"><p className="font-semibold text-white">{draft.draftNo}</p><p className="text-xs text-slate-500">{new Date(draft.updatedAt).toLocaleString()}</p></td>
                      <td className="py-3 pr-4"><p className="font-semibold text-white">{draft.customerName || draft.phone}</p><p className="text-xs text-slate-500">{draft.phone}</p></td>
                      <td className="py-3 pr-4">{draft.productText || `${draft.cylinderSizeKg || '?'}kg refill`} × {draft.quantity || 1}<p className="text-xs text-slate-500">{draft.addressText || draft.deliveryArea || 'No address yet'}</p></td>
                      <td className="py-3 pr-4">{draft.confidenceScore || 0}%</td>
                      <td className="py-3 pr-4"><Badge tone={statusTone(draft.status)}>{draft.status}</Badge></td>
                    </tr>
                  ))}
                  {!drafts.length && <tr><td colSpan="5" className="py-8 text-center text-slate-500">No WhatsApp order drafts yet. Simulate “2”, then send “12.5kg refill, Ajah, address: Example Estate”.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Draft Review</h2>
            {!selectedDraft ? <p className="mt-6 text-sm text-slate-500">Select a draft to review, correct and convert.</p> : (
              <div className="mt-4 space-y-3">
                <Badge tone={statusTone(selectedDraft.status)}>{selectedDraft.status}</Badge>
                <Field label="Cylinder Size KG" type="number" value={selectedDraft.cylinderSizeKg} onChange={(v) => updateDraft('cylinderSizeKg', v)} />
                <Field label="Quantity" type="number" value={selectedDraft.quantity} onChange={(v) => updateDraft('quantity', v)} />
                <Field label="Product Text" value={selectedDraft.productText} onChange={(v) => updateDraft('productText', v)} />
                <Field label="Delivery Area" value={selectedDraft.deliveryArea} onChange={(v) => updateDraft('deliveryArea', v)} />
                <Field label="Address" value={selectedDraft.addressText} onChange={(v) => updateDraft('addressText', v)} />
                <Field label="Estimated Amount" type="number" value={selectedDraft.estimatedAmount} onChange={(v) => updateDraft('estimatedAmount', v)} />
                <label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payment Preference</span><select value={selectedDraft.paymentPreference || 'UNKNOWN'} onChange={(e) => updateDraft('paymentPreference', e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"><option>UNKNOWN</option><option>TRANSFER</option><option>CASH_ON_DELIVERY</option><option>POS_ON_DELIVERY</option><option>WALLET</option><option>PAYSTACK_LINK</option></select></label>
                {!!selectedDraft.validationIssues?.length && <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">Missing: {selectedDraft.validationIssues.join(', ')}</div>}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <button onClick={saveDraft} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500">Save</button>
                  <button onClick={convertDraft} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">Convert</button>
                  <button onClick={cancelDraft} className="rounded-xl bg-red-600/80 px-3 py-2 text-xs font-bold text-white hover:bg-red-500">Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'conversations' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Conversations</h2>
            <p className="mb-4 text-xs text-slate-400">Recent WhatsApp contacts.</p>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {contacts.map((contact) => (
                <button key={contact.id} onClick={() => openConversation(contact.phone)} className={`w-full rounded-xl border p-3 text-left transition ${selectedPhone === contact.phone ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}>
                  <p className="font-semibold text-white">{contact.linkedCustomerName || contact.profileName || contact.phone}</p>
                  <p className="text-xs text-slate-500">{contact.phone} · {contact.lastIntent || 'No intent yet'}</p>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Conversation Preview</h2><p className="text-xs text-slate-400">Selected phone: {selectedPhone || 'None selected'}</p></div><Badge tone="blue">Mini-app flow</Badge></div>
            <div className="mb-4 h-72 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
              {messages.map((msg) => <div key={msg.id} className={`mb-3 flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.direction === 'OUTBOUND' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-100'}`}><p className="whitespace-pre-wrap">{msg.text}</p><p className="mt-1 text-[10px] opacity-70">{msg.direction} · {msg.status}</p></div></div>)}
              {!messages.length && <p className="py-20 text-center text-sm text-slate-500">No messages selected yet.</p>}
            </div>
            <div className="flex gap-2"><input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type manual WhatsApp reply..." className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60" /><button onClick={sendReply} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-400">Send</button></div>
          </section>
        </div>
      )}

      {activeTab === 'identity' && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">Customer Identity Matching</h2>
          <p className="mb-4 text-xs text-slate-400">Link WhatsApp contacts to existing customers, or create a customer profile from a WhatsApp contact.</p>
          <div className="grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-2 font-bold text-white">Select WhatsApp Contact</h3>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {contacts.map((contact) => <button key={contact.id} onClick={() => { setSelectedContact(contact); setSelectedPhone(contact.phone); }} className={`w-full rounded-xl border p-3 text-left ${selectedContact?.id === contact.id ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}><p className="font-semibold text-white">{contact.linkedCustomerName || contact.profileName || contact.phone}</p><p className="text-xs text-slate-500">{contact.phone} · {contact.linkedCustomerId ? 'Linked' : 'Not linked'}</p></button>)}
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-bold text-white">Link/Create Customer</h3>
              {selectedContact ? <div className="space-y-3"><p className="text-sm text-slate-300">Selected: <span className="font-bold text-white">{selectedContact.profileName || selectedContact.phone}</span></p><div className="flex gap-2"><input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search by phone, name or email" className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none" /><button onClick={searchCustomers} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Search</button></div><button onClick={createCustomer} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Create customer from WhatsApp contact</button><div className="space-y-2">{customerResults.map((c) => <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3"><div><p className="font-semibold text-white">{c.name}</p><p className="text-xs text-slate-500">{c.phone} · {c.email}</p></div><button onClick={() => linkCustomer(c.id)} className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Link</button></div>)}</div></div> : <p className="text-sm text-slate-500">Select a WhatsApp contact first.</p>}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'readiness' && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">Setup Readiness</h2>
          <p className="mb-4 text-xs text-slate-400">Dry-run works without Meta credentials. Live send requires token and phone number ID.</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{checklist.map((item) => <div key={item.key} className="flex items-start justify-between gap-3 rounded-xl bg-black/20 p-3"><div><p className="text-sm font-semibold text-slate-200">{item.label}</p><p className="text-[11px] text-slate-500">{item.key}</p></div><Badge tone={item.ready ? 'green' : item.informational ? 'yellow' : 'red'}>{item.ready ? 'Ready' : item.informational ? 'Info' : 'Missing'}</Badge></div>)}</div>
        </section>
      )}

      {activeTab === 'simulator' && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-white">Test Customer WhatsApp Flow</h2>
          <p className="mb-4 text-xs text-slate-400">Use this simulator to test order status and refill intake before connecting live Cloud API webhook.</p>
          <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]"><input value={simPhone} onChange={(e) => setSimPhone(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none" placeholder="2348012345678" /><input value={simText} onChange={(e) => setSimText(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none" placeholder="menu / 1 / 2 / 12.5kg refill, Ajah / confirm" /><button onClick={simulate} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500">Simulate inbound</button></div>
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100"><p className="font-bold">Suggested test:</p><p>Send “2”, then “12.5kg refill x1, Ajah, address: House 4 Example Estate”, then “confirm”. The request will appear in Order Intake.</p></div>
        </section>
      )}

      {!!activeRequests.length && activeTab !== 'requests' && <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5"><h2 className="text-lg font-bold text-amber-100">Operational Notes</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/80"><li>{activeRequests.length} WhatsApp request(s) still need action.</li><li>{activeDrafts.length} order intake draft(s) are open or awaiting review.</li><li>Converting a draft creates a pending internal order for operational follow-up. Payment integration remains deferred.</li></ul></section>}
    </div>
  );
}
