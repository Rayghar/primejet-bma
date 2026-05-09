// File: src/views/06-Corporate/CorporateClientsModule.js
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
  getCorporateClientDetails,
  createCorporateClient,
  updateCorporateClient,
  addCorporateActivity,
  createCorporateFulfilment,
  updateCorporateFulfilmentStatus,
  getRelationshipManagers,
  createCorporatePortalUser,
  updateCorporatePortalUser,
  createCorporateSite,
  reviewCorporateRequest,
  convertCorporateRequestToFulfilment,
  createCorporateOperationalOrder,
  linkCorporateFulfilmentRun,
  getCorporateBillingDashboard,
  recordCorporateFulfilmentPayment,
} from '../../api/corporateClientService';
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  KeyRound,
  ListChecks,
  MapPin,
  PackageCheck,
  PhoneCall,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  TimerReset,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';

const emptyClient = {
  companyName: '',
  contactPerson: '',
  contactRole: '',
  phone: '',
  email: '',
  industry: '',
  source: 'FIELD_SALES',
  stage: 'ONBOARDING',
  status: 'ACTIVE',
  expectedMonthlyKg: '',
  agreedPricePerKg: '',
  paymentTerms: 'PAY_ON_DELIVERY',
  creditLimit: '',
  slaExpectation: '',
  address: '',
  city: 'Lagos',
  state: 'Lagos',
  assignedBranchId: '',
  assignedBranchName: '',
  relationshipManagerId: '',
  relationshipManagerName: '',
  whatsappPhone: '',
  anniversaryDate: '',
  nextFollowUpDate: '',
  notes: '',
  portalEnabled: true,
  createPortalUser: true,
  portalUserName: '',
  portalUserEmail: '',
  portalUserPhone: '',
  portalUserRole: 'corporate_admin',
  portalPassword: '',
  billingEmail: '',
  billingCycle: 'PER_DELIVERY',
  requiresInternalApproval: false,
  defaultApprovalMode: 'NONE',
  defaultCreditHoldPolicy: 'WARN_ONLY',
  createDefaultSite: true,
  defaultSiteName: 'Primary Delivery Site',
};

const emptyPortalUser = {
  name: '',
  email: '',
  phone: '',
  corporateRole: 'corporate_admin',
  password: '',
  jobTitle: '',
  department: '',
  mustChangePassword: true,
  isCorporatePrimaryContact: false,
  status: 'active',
};

const emptySite = {
  siteName: '',
  siteType: 'OTHER',
  address: '',
  city: 'Lagos',
  state: 'Lagos',
  siteContactName: '',
  siteContactPhone: '',
  siteContactEmail: '',
  preferredDeliveryWindow: '',
  deliveryInstructions: '',
  assignedBranchId: '',
  assignedBranchName: '',
  defaultProductType: 'BULK_LPG',
  estimatedMonthlyKg: '',
  status: 'ACTIVE',
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
  paymentMethod: 'ACCOUNT_TERMS',
  linkedOrderId: '',
  linkedRunId: '',
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

const emptyPayment = {
  fulfilmentId: '',
  amount: '',
  paymentMethod: 'TRANSFER',
  paymentReference: '',
};

const SECTION_LABELS = {
  overview: 'Command Overview',
  accounts: 'Accounts',
  onboarding: 'Onboarding',
  portal: 'Portal Access',
  sites: 'Delivery Sites',
  requests: 'Requests Inbox',
  fulfilment: 'Fulfilment Control',
  billing: 'Billing & Credit',
  relationship: 'Relationship Desk',
};

const SECTION_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Building2, hint: 'Pipeline, volume, SLA and exposure snapshot' },
  { id: 'accounts', label: 'Accounts', icon: Users, hint: 'Find, create and update corporate accounts' },
  { id: 'onboarding', label: 'Onboarding', icon: ListChecks, hint: 'Step-by-step account setup checklist' },
  { id: 'portal', label: 'Portal Access', icon: KeyRound, hint: 'Create and manage customer login credentials' },
  { id: 'sites', label: 'Sites', icon: MapPin, hint: 'Administer delivery locations' },
  { id: 'requests', label: 'Requests', icon: ClipboardCheck, hint: 'Review portal requests' },
  { id: 'fulfilment', label: 'Fulfilment', icon: Truck, hint: 'Log and update corporate deliveries' },
  { id: 'billing', label: 'Billing', icon: DollarSign, hint: 'Invoices, payments, credit exposure and statements' },
  { id: 'relationship', label: 'Relationship', icon: PhoneCall, hint: 'Follow-ups, notes and customer health' },
];

const inputClass = 'mt-1 w-full rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:border-blue-400 option:bg-black option:text-white';
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
const rowId = (row) => row?.id || row?._id || row?.email || row?.siteName || row?.companyName;
const vehicleName = (item = {}) => item.truckName || item.vanName || item.vehicleType || 'Unassigned';
const labelize = (value = '') => String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

const stageTone = (stage = '') => {
  if (['ACTIVE', 'DELIVERED', 'ON_TIME', 'PAID', 'APPROVED'].includes(stage)) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
  if (['ONBOARDING', 'SCHEDULED', 'IN_TRANSIT', 'AT_RISK', 'UNDER_REVIEW', 'INVITED'].includes(stage)) return 'bg-blue-500/15 text-blue-300 border-blue-500/20';
  if (['PROSPECT', 'REQUESTED', 'PART_PAID', 'SUBMITTED', 'QUOTED'].includes(stage)) return 'bg-amber-500/15 text-amber-300 border-amber-500/20';
  if (['LOST', 'DORMANT', 'DELAYED', 'FAILED', 'CANCELLED', 'LATE', 'MISSED', 'REJECTED', 'SUSPENDED'].includes(stage)) return 'bg-red-500/15 text-red-300 border-red-500/20';
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

const AdminStep = ({ done, label, hint }) => (
  <div className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-white/5 bg-white/5'}`}>
    <div className="flex items-start gap-3">
      <CheckCircle2 size={18} className={done ? 'text-emerald-300' : 'text-slate-600'} />
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      </div>
    </div>
  </div>
);

const Field = ({ label, children, span = '' }) => (
  <label className={`block text-[11px] font-bold uppercase tracking-wide text-slate-300 ${span}`}>
    <span>{label}</span>
    {React.isValidElement(children)
      ? React.cloneElement(children, { placeholder: children.props.placeholder || label, className: `${children.props.className || ''}` })
      : children}
  </label>
);

export default function CorporateClientsModule({ initialSection = 'overview' }) {
  const [activeSection, setActiveSection] = useState(initialSection || 'overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState('');
  const [runLinkDrafts, setRunLinkDrafts] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dashboard, setDashboard] = useState({ metrics: {}, dueFollowUps: [], recentFulfilments: [] });
  const [fulfilmentControl, setFulfilmentControl] = useState({ metrics: {}, pipeline: {}, latestFulfilments: [], overdueFulfilments: [], atRiskFulfilments: [], byClient: [] });
  const [billingControl, setBillingControl] = useState({ metrics: {}, byClient: [], openInvoices: [], overdueInvoices: [] });
  const [clients, setClients] = useState([]);
  const [clientDetails, setClientDetails] = useState({ client: null, users: [], sites: [], fulfilments: [], requests: [] });
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [clientForm, setClientForm] = useState(emptyClient);
  const [portalUserForm, setPortalUserForm] = useState(emptyPortalUser);
  const [siteForm, setSiteForm] = useState(emptySite);
  const [fulfilmentForm, setFulfilmentForm] = useState(emptyFulfilment);
  const [activityForm, setActivityForm] = useState(emptyActivity);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [lastCredentials, setLastCredentials] = useState(null);

  useEffect(() => {
    setActiveSection(initialSection || 'overview');
  }, [initialSection]);

  const selectedClient = useMemo(
    () => clientDetails.client || clients.find((client) => rowId(client) === selectedClientId) || clients[0] || null,
    [clientDetails.client, clients, selectedClientId]
  );

  const branchOptions = Array.isArray(branches) ? branches : [];
  const users = clientDetails.users || [];
  const sites = clientDetails.sites || [];
  const fulfilments = clientDetails.fulfilments || [];
  const requests = clientDetails.requests || [];

  const resetFormsFromClient = (client) => {
    if (!client) {
      setClientForm(emptyClient);
      setPortalUserForm(emptyPortalUser);
      setSiteForm(emptySite);
      setFulfilmentForm(emptyFulfilment);
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
      portalEnabled: client.portalEnabled !== false,
      createPortalUser: false,
      portalUserName: '',
      portalUserEmail: '',
      portalUserPhone: '',
      portalPassword: '',
      createDefaultSite: false,
    });
    setPortalUserForm({
      ...emptyPortalUser,
      name: client.contactPerson || '',
      email: client.email || '',
      phone: client.phone || client.whatsappPhone || '',
      jobTitle: client.contactRole || '',
      isCorporatePrimaryContact: users.length === 0,
    });
    setSiteForm({
      ...emptySite,
      siteName: 'Primary Delivery Site',
      address: client.address || '',
      siteContactName: client.contactPerson || '',
      siteContactPhone: client.phone || client.whatsappPhone || '',
      siteContactEmail: client.email || '',
      assignedBranchId: client.assignedBranchId || '',
      assignedBranchName: client.assignedBranchName || '',
      estimatedMonthlyKg: client.expectedMonthlyKg || '',
    });
    setFulfilmentForm({
      ...emptyFulfilment,
      sellingPricePerKg: client.agreedPricePerKg || '',
      branchId: client.assignedBranchId || '',
      branchName: client.assignedBranchName || '',
      deliveryAddress: client.address || '',
      deliverySiteName: sites[0]?.siteName || '',
    });
  };

  const loadDetails = async (clientId) => {
    if (!clientId) {
      setClientDetails({ client: null, users: [], sites: [], fulfilments: [], requests: [] });
      return null;
    }
    const details = await getCorporateClientDetails(clientId);
    setClientDetails(details || { client: null, users: [], sites: [], fulfilments: [], requests: [] });
    resetFormsFromClient(details?.client);
    return details;
  };

  const getSettledValue = (settled, fallback) => (settled?.status === 'fulfilled' ? settled.value : fallback);

  const load = async (options = {}) => {
    setLoading(true);
    setError('');
    try {
      const effectiveSearch = options.clearFilters ? '' : search;
      const effectiveStage = options.clearFilters ? '' : stageFilter;

      // Core data first: the Accounts list must never be blocked by optional lookups
      // such as plants/branches or relationship managers. This prevents the whole
      // module from showing a 30-second timeout when one secondary endpoint is slow.
      const clientRows = await getCorporateClients({ search: effectiveSearch, stage: effectiveStage });
      const rows = clientRows?.rows || [];
      setClients(rows);

      if (options.clearFilters) {
        setSearch('');
        setStageFilter('');
      }

      const preferredId = options.preferredClientId || selectedClientId || rowId(rows[0]);
      const found = rows.find((c) => rowId(c) === preferredId) || rows[0];
      if (found) {
        setSelectedClientId(rowId(found));
        await loadDetails(rowId(found));
      } else {
        setSelectedClientId('');
        setClientDetails({ client: null, users: [], sites: [], fulfilments: [], requests: [] });
        resetFormsFromClient(null);
      }

      const [dashResult, controlResult, billingResult, rmsResult, plantResult] = await Promise.allSettled([
        getCorporateDashboard({}, { timeout: 12000 }),
        getCorporateFulfilmentControl({ timeout: 12000 }),
        getCorporateBillingDashboard({ timeout: 12000 }),
        getRelationshipManagers({ timeout: 8000 }),
        getPlants(null, { timeout: 8000 }),
      ]);

      setDashboard(getSettledValue(dashResult, { metrics: {} }) || {});
      setFulfilmentControl(getSettledValue(controlResult, { metrics: {}, pipeline: {}, latestFulfilments: [] }) || {});
      setBillingControl(getSettledValue(billingResult, { metrics: {}, byClient: [], openInvoices: [], overdueInvoices: [] }) || {});
      setManagers(getSettledValue(rmsResult, { rows: [] })?.rows || []);
      const plantRows = getSettledValue(plantResult, []);
      setBranches(Array.isArray(plantRows) ? plantRows : []);
    } catch (err) {
      setError(err.message || 'Failed to load corporate clients module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // initial module bootstrap intentionally runs once; user actions call load/loadDetails explicitly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectClient = async (clientId, section = null) => {
    setSelectedClientId(clientId);
    setError('');
    setMessage('');
    try {
      await loadDetails(clientId);
      if (section) setActiveSection(section);
    } catch (err) {
      setError(err.message || 'Failed to load selected corporate client.');
    }
  };

  const updateClientField = (field, value) => {
    const next = { ...clientForm, [field]: value };
    if (field === 'relationshipManagerId') {
      const rm = managers.find((m) => rowId(m) === value);
      next.relationshipManagerName = rm?.name || rm?.email || '';
    }
    if (field === 'assignedBranchId') {
      const branch = branchOptions.find((b) => String(rowId(b) || b.name) === String(value));
      next.assignedBranchName = branch?.name || branch?.branchName || '';
    }
    if (field === 'contactPerson' && !clientForm.portalUserName) next.portalUserName = value;
    if (field === 'email' && !clientForm.portalUserEmail) {
      next.portalUserEmail = value;
      next.billingEmail = value;
    }
    if (field === 'phone' && !clientForm.portalUserPhone) {
      next.portalUserPhone = value;
      next.whatsappPhone = value;
    }
    setClientForm(next);
  };

  const updateSiteField = (field, value) => {
    const next = { ...siteForm, [field]: value };
    if (field === 'assignedBranchId') {
      const branch = branchOptions.find((b) => String(rowId(b) || b.name) === String(value));
      next.assignedBranchName = branch?.name || branch?.branchName || '';
    }
    setSiteForm(next);
  };

  const updateFulfilmentField = (field, value) => {
    const next = { ...fulfilmentForm, [field]: value };
    if (field === 'branchId') {
      const branch = branchOptions.find((b) => String(rowId(b) || b.name) === String(value));
      next.branchName = branch?.name || branch?.branchName || '';
    }
    if (field === 'deliverySiteName') {
      const site = sites.find((s) => s.siteName === value);
      if (site) next.deliveryAddress = site.address || next.deliveryAddress;
    }
    setFulfilmentForm(next);
  };


  const hydrateFulfilmentFormFromRequest = (request = {}) => {
    const site = sites.find((s) => s.id === request.siteId || s.siteName === request.siteName) || {};
    const paymentMethod = request.paymentType === 'PREPAID' ? 'ONLINE' : (request.paymentType || selectedClient?.paymentTerms || 'ACCOUNT_TERMS');
    const next = {
      ...emptyFulfilment,
      orderType: request.requestType === 'RECURRING_REFILL' ? 'BULK_REFILL' : (request.requestType || 'BULK_REFILL'),
      priority: request.priority || 'NORMAL',
      requestSource: request.requestSource === 'BUSINESS_PORTAL' ? 'OTHER' : (request.requestSource || 'RELATIONSHIP_MANAGER'),
      requestReference: request.requestCode || request.poNumber || '',
      requestedKg: request.requestedKg || '',
      deliveredKg: '',
      sellingPricePerKg: request.estimatedPricePerKg || selectedClient?.agreedPricePerKg || '',
      paymentMethod,
      paymentDueDate: selectedClient?.paymentTerms?.startsWith?.('CREDIT') ? '' : '',
      promisedAt: request.requestedDeliveryDate ? String(request.requestedDeliveryDate).slice(0, 16) : '',
      scheduledAt: request.scheduledAt ? String(request.scheduledAt).slice(0, 16) : '',
      status: 'REQUESTED',
      branchId: selectedClient?.assignedBranchId || site.assignedBranchId || '',
      branchName: selectedClient?.assignedBranchName || site.assignedBranchName || '',
      deliverySiteName: request.siteName || site.siteName || '',
      deliveryAddress: request.deliveryAddress || site.address || selectedClient?.address || '',
      serviceNotes: [
        request.notes,
        request.poNumber ? `PO/Ref: ${request.poNumber}` : '',
        'Auto-populated from corporate request. Review pricing, delivery cost, vehicle/driver and schedule before logging.'
      ].filter(Boolean).join('\n'),
    };
    setFulfilmentForm(next);
    setActiveSection('fulfilment');
    setMessage(`Fulfilment form auto-populated from ${request.requestCode || 'corporate request'}. Review and log when ready, or use Create Fulfilment to generate it immediately.`);
  };

  const saveClient = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...clientForm };
      const clientId = rowId(payload);
      const response = clientId ? await updateCorporateClient(clientId, payload) : await createCorporateClient(payload);
      if (response.portalUser?.temporaryPassword || response.portalUser?.user) {
        setLastCredentials({
          email: response.portalUser?.user?.email || payload.portalUserEmail,
          password: response.portalUser?.temporaryPassword || payload.portalPassword || '(password set manually)',
          role: response.portalUser?.user?.role || payload.portalUserRole,
        });
        setMessage('Corporate account saved and portal credentials generated. The account is now selected for administration.');
        setActiveSection('portal');
      } else {
        setMessage(clientId ? 'Corporate account updated and remains selected.' : 'Corporate account created and selected for administration.');
        if (!clientId) setActiveSection('onboarding');
      }
      const saved = response.client || response;
      await load({ preferredClientId: rowId(saved), clearFilters: true });
    } catch (err) {
      setError(err.message || 'Unable to save corporate client.');
    } finally {
      setSaving(false);
    }
  };

  const createNewClient = () => {
    setSelectedClientId('');
    setClientDetails({ client: null, users: [], sites: [], fulfilments: [], requests: [] });
    setClientForm(emptyClient);
    setPortalUserForm(emptyPortalUser);
    setSiteForm(emptySite);
    setFulfilmentForm(emptyFulfilment);
    setActivityForm(emptyActivity);
    setLastCredentials(null);
    setActiveSection('accounts');
    setMessage('New corporate account form opened. Capture only the essentials, save, then administer portal users and sites from the module tabs.');
  };

  const createPortalUser = async () => {
    if (!selectedClient?.id) {
      setError('Save or select a corporate client before creating portal credentials.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await createCorporatePortalUser(selectedClient.id, portalUserForm);
      setLastCredentials({
        email: response.user?.email,
        password: response.temporaryPassword || portalUserForm.password || '(password set manually)',
        role: response.user?.role || portalUserForm.corporateRole,
      });
      setMessage('Corporate portal user created. Share these login credentials securely with the customer.');
      setPortalUserForm({ ...emptyPortalUser, corporateRole: 'corporate_requester' });
      await loadDetails(selectedClient.id);
    } catch (err) {
      setError(err.message || 'Unable to create portal user.');
    } finally {
      setSaving(false);
    }
  };

  const togglePortalUserStatus = async (user) => {
    if (!selectedClient?.id || !user?.id) return;
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateCorporatePortalUser(selectedClient.id, user.id, { status: nextStatus });
      setMessage(`Portal user ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
      await loadDetails(selectedClient.id);
    } catch (err) {
      setError(err.message || 'Unable to update portal user.');
    } finally {
      setSaving(false);
    }
  };

  const createSite = async () => {
    if (!selectedClient?.id) {
      setError('Save or select a corporate client before creating delivery sites.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await createCorporateSite(selectedClient.id, siteForm);
      setMessage('Corporate delivery site created and linked to the selected account.');
      setSiteForm({ ...emptySite, assignedBranchId: selectedClient.assignedBranchId || '', assignedBranchName: selectedClient.assignedBranchName || '' });
      await loadDetails(selectedClient.id);
      await load({ preferredClientId: selectedClient.id });
    } catch (err) {
      setError(err.message || 'Unable to create corporate site.');
    } finally {
      setSaving(false);
    }
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
      setMessage('Corporate fulfilment logged. It is visible under Fulfilment Control and the selected account history.');
      setFulfilmentForm({
        ...emptyFulfilment,
        sellingPricePerKg: selectedClient.agreedPricePerKg || '',
        branchId: selectedClient.assignedBranchId || '',
        branchName: selectedClient.assignedBranchName || '',
        deliveryAddress: selectedClient.address || '',
        deliverySiteName: sites[0]?.siteName || '',
      });
      await load({ preferredClientId: selectedClient.id });
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
      setMessage('Relationship activity added to the account timeline.');
      setActivityForm(emptyActivity);
      await loadDetails(selectedClient.id);
      await load({ preferredClientId: selectedClient.id });
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
        note: `Marked ${status} from Corporate Clients module`,
      });
      setMessage(`Fulfilment ${fulfilment.orderCode || fulfilment.id} marked ${status}.`);
      await load({ preferredClientId: selectedClient?.id });
    } catch (err) {
      setError(err.message || 'Unable to update fulfilment status.');
    } finally {
      setStatusUpdating('');
    }
  };

  const reviewRequest = async (request, status) => {
    if (!request?.id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await reviewCorporateRequest(request.id, { status, note: `Marked ${status} from BMA Corporate Clients module.` });
      setMessage(`Corporate request ${request.requestCode || request.id} marked ${status}.`);
      await loadDetails(selectedClient?.id || request.clientId);
    } catch (err) {
      setError(err.message || 'Unable to update corporate request.');
    } finally {
      setSaving(false);
    }
  };

  const convertRequest = async (request) => {
    if (!request?.id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await convertCorporateRequestToFulfilment(request.id, {
        sellingPricePerKg: selectedClient?.agreedPricePerKg || request.estimatedPricePerKg || 0,
        paymentMethod: request.paymentType === 'PREPAID' ? 'ONLINE' : request.paymentType,
        status: 'REQUESTED',
      });
      const fulfilment = res?.fulfilment;
      if (fulfilment) {
        setFulfilmentForm({ ...emptyFulfilment, ...fulfilment, promisedAt: fulfilment.promisedAt ? String(fulfilment.promisedAt).slice(0, 16) : '', scheduledAt: fulfilment.scheduledAt ? String(fulfilment.scheduledAt).slice(0, 16) : '', actualDeliveredAt: fulfilment.actualDeliveredAt ? String(fulfilment.actualDeliveredAt).slice(0, 16) : '', paymentDueDate: fulfilment.paymentDueDate ? String(fulfilment.paymentDueDate).slice(0, 10) : '' });
      }
      setActiveSection('fulfilment');
      setMessage(`Corporate request ${request.requestCode || request.id} created a fulfilment and operational order${res?.operationalOrder?.id ? ` (${res.operationalOrder.id})` : ''}. It can now flow through order/run management and dispatch.`);
      await load({ preferredClientId: selectedClient?.id || request.clientId });
    } catch (err) {
      setError(err.message || 'Unable to create fulfilment from corporate request.');
    } finally {
      setSaving(false);
    }
  };

  const metrics = dashboard?.metrics || {};
  const controlMetrics = fulfilmentControl?.metrics || {};
  const recentFulfilments = fulfilmentControl?.latestFulfilments || dashboard?.recentFulfilments || [];
  const dueFollowUps = dashboard?.dueFollowUps || [];
  const overdue = fulfilmentControl?.overdueFulfilments || [];
  const atRisk = fulfilmentControl?.atRiskFulfilments || [];
  const pipeline = fulfilmentControl?.pipeline || {};
  const activities = selectedClient?.activities || [];

  const onboarding = selectedClient ? {
    profile: Boolean(selectedClient.companyName && selectedClient.contactPerson && selectedClient.phone),
    pricing: Boolean(num(selectedClient.agreedPricePerKg) > 0 && selectedClient.paymentTerms),
    site: sites.length > 0 || Boolean(selectedClient.address),
    portal: Boolean(selectedClient.portalEnabled && users.length > 0),
    relationship: Boolean(selectedClient.relationshipManagerName || selectedClient.relationshipManagerId),
    firstFulfilment: fulfilments.some((f) => f.status === 'DELIVERED') || num(selectedClient.fulfilmentCount) > 0,
  } : {};
  const onboardingScore = selectedClient ? Math.round((Object.values(onboarding).filter(Boolean).length / 6) * 100) : 0;

  const renderSelectedAccountHeader = () => (
    <Card className="p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Selected corporate account</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-white">{selectedClient?.companyName || 'No account selected'}</h2>
            {selectedClient?.stage && <Pill tone={stageTone(selectedClient.stage)}>{selectedClient.stage}</Pill>}
            {selectedClient?.portalEnabled && <Pill tone="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"><KeyRound size={13} className="mr-1" /> Portal Enabled</Pill>}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {selectedClient ? `${selectedClient.contactPerson || 'No contact'} · ${selectedClient.phone || selectedClient.whatsappPhone || 'No phone'} · RM: ${selectedClient.relationshipManagerName || 'Unassigned'}` : 'Create or select an account from the Accounts submenu.'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:min-w-[520px]">
          <SmallMetric label="Users" value={fmt(users.length)} hint="portal logins" />
          <SmallMetric label="Sites" value={fmt(sites.length)} hint="delivery locations" />
          <SmallMetric label="Delivered" value={kg(selectedClient?.lifetimeDeliveredKg)} hint="lifetime" />
          <SmallMetric label="Outstanding" value={money(selectedClient?.outstandingBalance)} hint="reference" />
        </div>
      </div>
    </Card>
  );

  const renderAccountPicker = () => (
    <Card className="xl:col-span-1">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white">Corporate Accounts</h3>
          <p className="text-xs text-slate-500">Select a client to administer profile, users, sites, requests and fulfilment.</p>
        </div>
        <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{clients.length} shown</Pill>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input className={`${inputClass} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, phone, email, RM…" />
        </div>
        <select className={inputClass} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {['LEAD', 'PROSPECT', 'ONBOARDING', 'ACTIVE', 'RETENTION', 'DORMANT', 'LOST'].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
        <Button variant="secondary" icon={Search} onClick={() => load()}>Apply Filter</Button>
      </div>
      <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
        {clients.map((client) => (
          <button
            key={rowId(client)}
            type="button"
            onClick={() => selectClient(rowId(client), 'onboarding')}
            className={`w-full rounded-2xl border p-4 text-left transition ${selectedClient?.id === rowId(client) ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-white">{client.companyName}</div>
                <div className="text-xs text-slate-500">{client.clientCode || 'No code'} · {client.contactPerson || 'No contact'}</div>
              </div>
              <Pill tone={stageTone(client.stage)}>{client.stage}</Pill>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span>Expected: <b className="text-white">{kg(client.expectedMonthlyKg)}</b></span>
              <span>Portal: <b className="text-white">{client.portalEnabled ? 'Enabled' : 'Off'}</b></span>
              <span>RM: <b className="text-white">{client.relationshipManagerName || '—'}</b></span>
              <span>Next: <b className="text-white">{date(client.nextFollowUpDate)}</b></span>
            </div>
          </button>
        ))}
        {!clients.length && <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No corporate clients found. Use “New Corporate Client” to create one.</div>}
      </div>
    </Card>
  );

  const renderClientForm = () => (
    <Card className="xl:col-span-2">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{clientForm.id ? 'Administer Corporate Account' : 'Create Corporate Account'}</h3>
          <p className="text-sm text-slate-400">BMA-led onboarding: create the account, enable the portal, then issue login credentials from Portal Access.</p>
        </div>
        <Pill tone={stageTone(clientForm.stage || 'NEW')}>{clientForm.id ? clientForm.stage : 'NEW'}</Pill>
      </div>

      <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <ListChecks size={18} className="mt-0.5 text-blue-300" />
          <div>
            <p className="font-semibold text-white">Swift onboarding path</p>
            <p className="mt-1 text-sm text-blue-100/80">Capture company, contact, branch, pricing and address. Save. Then go to Portal Access to create customer logins, or keep “Create login now” checked to generate the first login immediately.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Company name" span="xl:col-span-2"><input className={inputClass} value={clientForm.companyName} onChange={(e) => updateClientField('companyName', e.target.value)} /></Field>
        <Field label="Stage"><select className={inputClass} value={clientForm.stage} onChange={(e) => updateClientField('stage', e.target.value)}>{['LEAD','PROSPECT','ONBOARDING','ACTIVE','RETENTION','DORMANT','LOST'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
        <Field label="Contact person"><input className={inputClass} value={clientForm.contactPerson} onChange={(e) => updateClientField('contactPerson', e.target.value)} /></Field>
        <Field label="Role / title"><input className={inputClass} value={clientForm.contactRole} onChange={(e) => updateClientField('contactRole', e.target.value)} /></Field>
        <Field label="Industry"><input className={inputClass} value={clientForm.industry} onChange={(e) => updateClientField('industry', e.target.value)} placeholder="Hotel, estate, restaurant…" /></Field>
        <Field label="Phone"><input className={inputClass} value={clientForm.phone} onChange={(e) => updateClientField('phone', e.target.value)} /></Field>
        <Field label="WhatsApp phone"><input className={inputClass} value={clientForm.whatsappPhone} onChange={(e) => updateClientField('whatsappPhone', e.target.value)} /></Field>
        <Field label="Email"><input className={inputClass} value={clientForm.email} onChange={(e) => updateClientField('email', e.target.value)} /></Field>
        <Field label="Expected monthly KG"><input type="number" className={inputClass} value={clientForm.expectedMonthlyKg} onChange={(e) => updateClientField('expectedMonthlyKg', e.target.value)} /></Field>
        <Field label="Agreed ₦/KG"><input type="number" className={inputClass} value={clientForm.agreedPricePerKg} onChange={(e) => updateClientField('agreedPricePerKg', e.target.value)} /></Field>
        <Field label="Credit limit"><input type="number" className={inputClass} value={clientForm.creditLimit} onChange={(e) => updateClientField('creditLimit', e.target.value)} /></Field>
        <Field label="Payment terms"><select className={inputClass} value={clientForm.paymentTerms} onChange={(e) => updateClientField('paymentTerms', e.target.value)}>{['PAY_ON_DELIVERY','PREPAID','CREDIT_7_DAYS','CREDIT_14_DAYS','CREDIT_30_DAYS','CUSTOM'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
        <Field label="Relationship manager"><select className={inputClass} value={clientForm.relationshipManagerId} onChange={(e) => updateClientField('relationshipManagerId', e.target.value)}><option value="">Unassigned</option>{managers.map((m) => <option key={rowId(m)} value={rowId(m)}>{m.name || m.email}</option>)}</select></Field>
        <Field label="Assigned branch"><select className={inputClass} value={clientForm.assignedBranchId} onChange={(e) => updateClientField('assignedBranchId', e.target.value)}><option value="">Unassigned</option>{branchOptions.map((b) => <option key={rowId(b) || b.name} value={rowId(b) || b.name}>{b.name || b.branchName}</option>)}</select></Field>
        <Field label="Address" span="xl:col-span-3"><input className={inputClass} value={clientForm.address} onChange={(e) => updateClientField('address', e.target.value)} /></Field>
        <Field label="City"><input className={inputClass} value={clientForm.city} onChange={(e) => updateClientField('city', e.target.value)} /></Field>
        <Field label="State"><input className={inputClass} value={clientForm.state} onChange={(e) => updateClientField('state', e.target.value)} /></Field>
        <Field label="Next follow-up"><input type="date" className={inputClass} value={clientForm.nextFollowUpDate} onChange={(e) => updateClientField('nextFollowUpDate', e.target.value)} /></Field>
        <Field label="SLA expectation" span="xl:col-span-3"><input className={inputClass} value={clientForm.slaExpectation} onChange={(e) => updateClientField('slaExpectation', e.target.value)} placeholder="e.g. same-day supply, 4-hour response, scheduled weekly supply" /></Field>
        <Field label="Notes" span="xl:col-span-3"><textarea rows="3" className={inputClass} value={clientForm.notes} onChange={(e) => updateClientField('notes', e.target.value)} /></Field>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"><input type="checkbox" checked={Boolean(clientForm.portalEnabled)} onChange={(e) => updateClientField('portalEnabled', e.target.checked)} /> Enable business portal</label>
        {!clientForm.id && <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"><input type="checkbox" checked={Boolean(clientForm.createPortalUser)} onChange={(e) => updateClientField('createPortalUser', e.target.checked)} /> Create first login now</label>}
        {!clientForm.id && <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"><input type="checkbox" checked={Boolean(clientForm.createDefaultSite)} onChange={(e) => updateClientField('createDefaultSite', e.target.checked)} /> Create default site</label>}
        {clientForm.createPortalUser && !clientForm.id && (
          <>
            <Field label="Portal user name"><input className={inputClass} value={clientForm.portalUserName || clientForm.contactPerson || ''} onChange={(e) => updateClientField('portalUserName', e.target.value)} /></Field>
            <Field label="Portal user email"><input className={inputClass} value={clientForm.portalUserEmail || clientForm.email || ''} onChange={(e) => updateClientField('portalUserEmail', e.target.value)} /></Field>
            <Field label="Temporary password"><input className={inputClass} value={clientForm.portalPassword || ''} onChange={(e) => updateClientField('portalPassword', e.target.value)} placeholder="Leave blank to auto-generate" /></Field>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button icon={Save} onClick={saveClient} disabled={saving || !clientForm.companyName}>{saving ? 'Saving…' : clientForm.id ? 'Save Changes' : 'Create & Select Account'}</Button>
        <Button variant="secondary" icon={UserPlus} onClick={createNewClient}>New Corporate Client</Button>
        {clientForm.id && <Button variant="secondary" icon={KeyRound} onClick={() => setActiveSection('portal')}>Manage Logins</Button>}
        {clientForm.id && <Button variant="secondary" icon={MapPin} onClick={() => setActiveSection('sites')}>Manage Sites</Button>}
      </div>
    </Card>
  );


  const createOrderForFulfilment = async (fulfilment) => {
    if (!fulfilment?.id) return;
    setStatusUpdating(fulfilment.id);
    setError('');
    setMessage('');
    try {
      const res = await createCorporateOperationalOrder(fulfilment.id);
      setMessage(res?.operationalOrder?.id ? `Operational order ${res.operationalOrder.id} linked to ${fulfilment.orderCode || fulfilment.id}.` : 'Operational order linked.');
      await load({ preferredClientId: selectedClient?.id || fulfilment.clientId });
    } catch (err) {
      setError(err.message || 'Unable to create operational order.');
    } finally {
      setStatusUpdating('');
    }
  };

  const linkRunForFulfilment = async (fulfilment) => {
    const draft = runLinkDrafts[fulfilment.id] || {};
    if (!draft.runId) {
      setError('Enter a Run ID before linking this fulfilment to dispatch/run management.');
      return;
    }
    setStatusUpdating(fulfilment.id);
    setError('');
    setMessage('');
    try {
      await linkCorporateFulfilmentRun(fulfilment.id, { runId: draft.runId, sequence: draft.sequence });
      setMessage(`Fulfilment ${fulfilment.orderCode || fulfilment.id} linked to run ${draft.runId}.`);
      setRunLinkDrafts((prev) => ({ ...prev, [fulfilment.id]: { runId: '', sequence: '' } }));
      await load({ preferredClientId: selectedClient?.id || fulfilment.clientId });
    } catch (err) {
      setError(err.message || 'Unable to link run.');
    } finally {
      setStatusUpdating('');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label="Corporate accounts" value={fmt(metrics.totalCorporateClients)} hint={`${fmt(metrics.leadsAndProspects)} leads/prospects`} />
        <MetricCard icon={ClipboardCheck} label="Active / onboarding" value={`${fmt(metrics.activeCorporateClients)} / ${fmt(metrics.onboarding)}`} hint={`${fmt(metrics.followUpsDue)} follow-ups due`} />
        <MetricCard icon={PackageCheck} label="Delivered volume" value={kg(metrics.deliveredKg)} hint={`${kg(metrics.requestedKg)} requested`} />
        <MetricCard icon={DollarSign} label="B2B revenue" value={money(metrics.fulfilmentRevenue)} hint={`${money(metrics.grossMargin)} gross margin`} />
      </div>

      {renderSelectedAccountHeader()}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">B2B Fulfilment Control Tower</h3>
              <p className="text-sm text-slate-400">Open orders, SLA exceptions, payment exposure and latest corporate deliveries.</p>
            </div>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20"><TimerReset size={13} className="mr-1" /> Avg TAT {hours(controlMetrics.averageTurnaroundMinutes)}</Pill>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <SmallMetric label="Open" value={fmt(controlMetrics.openFulfilments)} hint={`${fmt(pipeline.REQUESTED?.count)} requested`} />
            <SmallMetric label="Overdue" value={fmt(controlMetrics.overdueFulfilments)} hint={`${fmt(controlMetrics.atRiskFulfilments)} at risk`} />
            <SmallMetric label="On-time" value={`${fmt(controlMetrics.onTimeDeliveryRate)}%`} hint="delivered" />
            <SmallMetric label="Outstanding" value={money(controlMetrics.outstandingAmount)} hint="reference" />
            <SmallMetric label="In transit" value={fmt(pipeline.IN_TRANSIT?.count)} hint={kg(pipeline.IN_TRANSIT?.requestedKg)} />
            <SmallMetric label="Delivered" value={fmt(controlMetrics.deliveredFulfilments)} hint={kg(controlMetrics.deliveredKg)} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">This is now a separate module</h3>
          <div className="space-y-3 text-sm text-slate-400">
            <p>Use the Corporate Clients menu group in the left sidebar. Each submenu opens a focused workspace, instead of hiding everything inside Sales & CRM.</p>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <b className="text-white">Recommended flow:</b>
              <div className="mt-2 space-y-1 text-xs">
                <p>1. Accounts → Create client</p>
                <p>2. Portal Access → Create login</p>
                <p>3. Sites → Confirm delivery site</p>
                <p>4. Fulfilment → Log first corporate order</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">SLA Watchlist</h3>
          <div className="space-y-2">
            {[...overdue.slice(0, 4), ...atRisk.slice(0, 2)].slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><div className="font-semibold text-white">{item.clientName}</div><div className="text-xs text-slate-500">{item.orderCode || item.requestReference || 'No order code'} · Promise: {dateTime(item.promisedAt)}</div></div>
                  <Pill tone={stageTone(item.slaStatus)}>{item.slaStatus || item.status}</Pill>
                </div>
              </div>
            ))}
            {!overdue.length && !atRisk.length && <p className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-500">No overdue or at-risk corporate fulfilments.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Due Follow-ups</h3>
          <div className="space-y-2">
            {dueFollowUps.slice(0, 8).map((client) => (
              <button key={client.id} type="button" onClick={() => selectClient(client.id, 'relationship')} className="w-full rounded-xl border border-white/5 bg-white/5 p-3 text-left text-sm hover:bg-white/10">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white">{client.companyName}</div><Pill tone="bg-amber-500/10 text-amber-300 border-amber-500/20">{date(client.nextFollowUpDate)}</Pill></div>
                <div className="text-xs text-slate-500">RM: {client.relationshipManagerName || 'Unassigned'} · {client.phone || client.whatsappPhone || 'No phone'}</div>
              </button>
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
            {!(fulfilmentControl.byClient || []).length && <p className="text-sm text-slate-500">Top accounts will appear after fulfilments are logged.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAccounts = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {renderAccountPicker()}
      {renderClientForm()}
    </div>
  );

  const renderOnboarding = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="text-lg font-bold text-white">Onboarding Progress</h3>
          <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Readiness score</p>
            <p className="mt-1 text-4xl font-bold text-white">{selectedClient ? `${onboardingScore}%` : '—'}</p>
            <p className="mt-2 text-sm text-slate-400">Complete these items before treating the account as fully operational.</p>
          </div>
          <div className="mt-4 space-y-2">
            <Button className="w-full" icon={Users} onClick={() => setActiveSection('accounts')} disabled={!selectedClient}>Edit Account</Button>
            <Button className="w-full" variant="secondary" icon={KeyRound} onClick={() => setActiveSection('portal')} disabled={!selectedClient}>Manage Portal Users</Button>
            <Button className="w-full" variant="secondary" icon={MapPin} onClick={() => setActiveSection('sites')} disabled={!selectedClient}>Manage Sites</Button>
          </div>
        </Card>
        <Card className="xl:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-white">Account Administration Checklist</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AdminStep done={onboarding.profile} label="Business profile captured" hint="Company, contact person, phone and basic profile are available." />
            <AdminStep done={onboarding.pricing} label="Pricing and payment terms set" hint="Agreed price per KG and payment terms are configured." />
            <AdminStep done={onboarding.site} label="Delivery site confirmed" hint="At least one delivery site or primary address is available." />
            <AdminStep done={onboarding.portal} label="Portal login created" hint="Customer can log in using BMA-created credentials." />
            <AdminStep done={onboarding.relationship} label="Relationship ownership assigned" hint="Relationship manager or responsible owner is assigned." />
            <AdminStep done={onboarding.firstFulfilment} label="First fulfilment recorded" hint="Account has at least one logged fulfilment or completed delivery." />
          </div>
        </Card>
      </div>
      {renderClientForm()}
    </div>
  );

  const renderPortal = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      {lastCredentials && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
          <div className="mb-2 flex items-center gap-2 font-bold text-white"><KeyRound size={16} /> Newly Generated Business Portal Credentials</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <span>Email: <b>{lastCredentials.email || '—'}</b></span>
            <span>Password: <b>{lastCredentials.password || '—'}</b></span>
            <span>Role: <b>{lastCredentials.role || '—'}</b></span>
          </div>
          <p className="mt-2 text-xs text-blue-200/80">Share securely with the corporate customer. The user is flagged to change password on first login where supported.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Create Portal Login</h3>
            <Pill tone={selectedClient?.portalEnabled ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-slate-500/10 text-slate-300 border-slate-500/20'}>{selectedClient?.portalEnabled ? 'PORTAL ON' : 'PORTAL OFF'}</Pill>
          </div>
          <div className="space-y-3">
            <p className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-400">This is the exact place to create corporate-customer login credentials after BMA onboarding.</p>
            <Field label="Name"><input className={inputClass} value={portalUserForm.name} onChange={(e) => setPortalUserForm({ ...portalUserForm, name: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} value={portalUserForm.email} onChange={(e) => setPortalUserForm({ ...portalUserForm, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} value={portalUserForm.phone} onChange={(e) => setPortalUserForm({ ...portalUserForm, phone: e.target.value })} /></Field>
            <Field label="Role"><select className={inputClass} value={portalUserForm.corporateRole} onChange={(e) => setPortalUserForm({ ...portalUserForm, corporateRole: e.target.value })}>{['corporate_admin','corporate_requester','corporate_approver','corporate_viewer'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Job title"><input className={inputClass} value={portalUserForm.jobTitle} onChange={(e) => setPortalUserForm({ ...portalUserForm, jobTitle: e.target.value })} /></Field>
            <Field label="Department"><input className={inputClass} value={portalUserForm.department} onChange={(e) => setPortalUserForm({ ...portalUserForm, department: e.target.value })} /></Field>
            <Field label="Temporary password"><input className={inputClass} value={portalUserForm.password} onChange={(e) => setPortalUserForm({ ...portalUserForm, password: e.target.value })} placeholder="Leave blank to auto-generate" /></Field>
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"><input type="checkbox" checked={Boolean(portalUserForm.mustChangePassword)} onChange={(e) => setPortalUserForm({ ...portalUserForm, mustChangePassword: e.target.checked })} /> Force password change</label>
            <Button className="w-full" icon={ShieldCheck} onClick={createPortalUser} disabled={saving || !selectedClient?.id || !portalUserForm.email}>{saving ? 'Creating…' : 'Create Portal User'}</Button>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Existing Portal Users</h3>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{users.length} users</Pill>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={rowId(user)} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{user.name || user.email}</p><Pill tone={stageTone(user.status)}>{user.status || 'active'}</Pill></div>
                    <p className="mt-1 text-sm text-slate-400">{user.email} · {user.phone || 'No phone'} · {user.jobTitle || user.department || 'No title'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="bg-slate-500/10 text-slate-300 border-slate-500/20">{user.role || user.corporateRole}</Pill>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => togglePortalUserStatus(user)} disabled={saving}>{user.status === 'active' ? 'Suspend' : 'Activate'}</Button>
                  </div>
                </div>
              </div>
            ))}
            {!users.length && <p className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No portal users yet. Create the first login from the form on the left.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSites = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="mb-4 text-lg font-bold text-white">Add Delivery Site</h3>
          <div className="space-y-3">
            <Field label="Site name"><input className={inputClass} value={siteForm.siteName} onChange={(e) => updateSiteField('siteName', e.target.value)} placeholder="Main kitchen, Lekki outlet…" /></Field>
            <Field label="Site type"><select className={inputClass} value={siteForm.siteType} onChange={(e) => updateSiteField('siteType', e.target.value)}>{['HEAD_OFFICE','BRANCH','KITCHEN','RESTAURANT','HOTEL','ESTATE','SCHOOL','FACTORY','OTHER'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Address"><textarea rows="3" className={inputClass} value={siteForm.address} onChange={(e) => updateSiteField('address', e.target.value)} /></Field>
            <Field label="Contact name"><input className={inputClass} value={siteForm.siteContactName} onChange={(e) => updateSiteField('siteContactName', e.target.value)} /></Field>
            <Field label="Contact phone"><input className={inputClass} value={siteForm.siteContactPhone} onChange={(e) => updateSiteField('siteContactPhone', e.target.value)} /></Field>
            <Field label="Preferred delivery window"><input className={inputClass} value={siteForm.preferredDeliveryWindow} onChange={(e) => updateSiteField('preferredDeliveryWindow', e.target.value)} placeholder="Weekdays 9am–1pm" /></Field>
            <Field label="Assigned branch"><select className={inputClass} value={siteForm.assignedBranchId} onChange={(e) => updateSiteField('assignedBranchId', e.target.value)}><option value="">Use account branch</option>{branchOptions.map((b) => <option key={rowId(b) || b.name} value={rowId(b) || b.name}>{b.name || b.branchName}</option>)}</select></Field>
            <Field label="Estimated monthly KG"><input type="number" className={inputClass} value={siteForm.estimatedMonthlyKg} onChange={(e) => updateSiteField('estimatedMonthlyKg', e.target.value)} /></Field>
            <Field label="Delivery instructions"><textarea rows="3" className={inputClass} value={siteForm.deliveryInstructions} onChange={(e) => updateSiteField('deliveryInstructions', e.target.value)} /></Field>
            <Button className="w-full" icon={MapPin} onClick={createSite} disabled={saving || !selectedClient?.id || !siteForm.siteName || !siteForm.address}>{saving ? 'Saving…' : 'Create Site'}</Button>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Delivery Sites</h3>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{sites.length} sites</Pill>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {sites.map((site) => (
              <div key={rowId(site)} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{site.siteName}</p>
                    <p className="mt-1 text-sm text-slate-400">{site.address}</p>
                  </div>
                  <Pill tone={stageTone(site.status)}>{site.status}</Pill>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Type: <b className="text-white">{site.siteType}</b></span>
                  <span>KG/month: <b className="text-white">{kg(site.estimatedMonthlyKg)}</b></span>
                  <span>Contact: <b className="text-white">{site.siteContactName || '—'}</b></span>
                  <span>Branch: <b className="text-white">{site.assignedBranchName || '—'}</b></span>
                </div>
                {site.deliveryInstructions && <p className="mt-3 rounded-xl bg-slate-950/50 p-3 text-xs text-slate-400">{site.deliveryInstructions}</p>}
              </div>
            ))}
            {!sites.length && <p className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400 md:col-span-2">No delivery sites yet. Add at least one site so requests and fulfilments have a clear destination.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white">Corporate Requests Inbox</h3>
            <p className="text-sm text-slate-400">Portal requests submitted by the selected corporate customer. Prepare a fulfilment form for review or create the fulfilment record from the request.</p>
          </div>
          <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{requests.length} requests</Pill>
        </div>
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={rowId(request)} className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-white">{request.requestCode || request.poNumber || request.id}</p><Pill tone={stageTone(request.status)}>{request.status}</Pill></div>
                  <p className="mt-1 text-sm text-slate-400">{request.siteName || 'No site'} · {kg(request.requestedKg)} · {dateTime(request.requestedDeliveryDate)}</p>
                  {request.notes && <p className="mt-2 text-xs text-slate-500">{request.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => reviewRequest(request, 'UNDER_REVIEW')} disabled={saving}>Review</Button>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => reviewRequest(request, 'APPROVED')} disabled={saving}>Approve</Button>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => hydrateFulfilmentFormFromRequest(request)} disabled={saving}>Prepare Fulfilment</Button>
                  <Button className="px-3 py-1.5 text-xs" onClick={() => convertRequest(request)} disabled={saving || Boolean(request.linkedFulfilmentId)} title="Create a Corporate Fulfilment record and operational Order record so it can flow through Order/Run management, dispatch and tracking.">Create Fulfilment + Order</Button>
                </div>
              </div>
            </div>
          ))}
          {!requests.length && <p className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No portal requests for this corporate client yet.</p>}
        </div>
      </Card>
    </div>
  );

  const renderFulfilment = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Log / Administer Corporate Fulfilment</h3>
            <Pill tone="bg-slate-500/10 text-slate-300 border-slate-500/20">{selectedClient?.companyName || 'Select account'}</Pill>
          </div>
          <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">Use this form for manual fulfilments or after clicking <b>Prepare Fulfilment</b> from a request. Use Prepare Fulfilment from Requests to auto-populate this form. Wave 2 can also create/link an operational Order and Run for dispatch tracking while keeping corporate billing separate from GL posting.</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Order type"><select className={inputClass} value={fulfilmentForm.orderType} onChange={(e) => updateFulfilmentField('orderType', e.target.value)}>{['BULK_REFILL','CYLINDER_REFILL','CYLINDER_EXCHANGE','EQUIPMENT_SUPPLY','OTHER'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Priority"><select className={inputClass} value={fulfilmentForm.priority} onChange={(e) => updateFulfilmentField('priority', e.target.value)}>{['NORMAL','HIGH','URGENT','SCHEDULED_CONTRACT'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Request source"><select className={inputClass} value={fulfilmentForm.requestSource} onChange={(e) => updateFulfilmentField('requestSource', e.target.value)}>{['WHATSAPP','RELATIONSHIP_MANAGER','PHONE_CALL','EMAIL','WALK_IN','ADMIN_ENTRY','OTHER'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Requested KG"><input type="number" className={inputClass} value={fulfilmentForm.requestedKg} onChange={(e) => updateFulfilmentField('requestedKg', e.target.value)} /></Field>
            <Field label="Delivered KG"><input type="number" className={inputClass} value={fulfilmentForm.deliveredKg} onChange={(e) => updateFulfilmentField('deliveredKg', e.target.value)} placeholder="Defaults to requested" /></Field>
            <Field label="Selling ₦/KG"><input type="number" className={inputClass} value={fulfilmentForm.sellingPricePerKg} onChange={(e) => updateFulfilmentField('sellingPricePerKg', e.target.value)} /></Field>
            <Field label="Cost ₦/KG"><input type="number" className={inputClass} value={fulfilmentForm.costPerKg} onChange={(e) => updateFulfilmentField('costPerKg', e.target.value)} /></Field>
            <Field label="Delivery cost"><input type="number" className={inputClass} value={fulfilmentForm.deliveryCost} onChange={(e) => updateFulfilmentField('deliveryCost', e.target.value)} /></Field>
            <Field label="Amount paid"><input type="number" className={inputClass} value={fulfilmentForm.amountPaid} onChange={(e) => updateFulfilmentField('amountPaid', e.target.value)} /></Field>
            <Field label="Payment method"><select className={inputClass} value={fulfilmentForm.paymentMethod || 'ACCOUNT_TERMS'} onChange={(e) => updateFulfilmentField('paymentMethod', e.target.value)}>{['ACCOUNT_TERMS','PAY_ON_DELIVERY','ONLINE','WALLET','TRANSFER','CREDIT','OTHER'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Linked retail order ID"><input className={inputClass} value={fulfilmentForm.linkedOrderId} onChange={(e) => updateFulfilmentField('linkedOrderId', e.target.value)} placeholder="Optional existing Order ID" /></Field>
            <Field label="Linked run ID"><input className={inputClass} value={fulfilmentForm.linkedRunId} onChange={(e) => updateFulfilmentField('linkedRunId', e.target.value)} placeholder="Optional existing Run ID" /></Field>
            <Field label="Invoice number"><input className={inputClass} value={fulfilmentForm.invoiceNumber} onChange={(e) => updateFulfilmentField('invoiceNumber', e.target.value)} /></Field>
            <Field label="Payment due date"><input type="date" className={inputClass} value={fulfilmentForm.paymentDueDate} onChange={(e) => updateFulfilmentField('paymentDueDate', e.target.value)} /></Field>
            <Field label="Promised date/time"><input type="datetime-local" className={inputClass} value={fulfilmentForm.promisedAt} onChange={(e) => updateFulfilmentField('promisedAt', e.target.value)} /></Field>
            <Field label="Scheduled date/time"><input type="datetime-local" className={inputClass} value={fulfilmentForm.scheduledAt} onChange={(e) => updateFulfilmentField('scheduledAt', e.target.value)} /></Field>
            <Field label="Actual delivered"><input type="datetime-local" className={inputClass} value={fulfilmentForm.actualDeliveredAt} onChange={(e) => updateFulfilmentField('actualDeliveredAt', e.target.value)} /></Field>
            <Field label="Status"><select className={inputClass} value={fulfilmentForm.status} onChange={(e) => updateFulfilmentField('status', e.target.value)}>{['REQUESTED','SCHEDULED','IN_TRANSIT','DELIVERED','DELAYED','CANCELLED','FAILED'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Vehicle type"><select className={inputClass} value={fulfilmentForm.vehicleType} onChange={(e) => updateFulfilmentField('vehicleType', e.target.value)}>{['NOT_ASSIGNED','TRUCK','VAN','THIRD_PARTY'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Truck / Van name"><input className={inputClass} value={fulfilmentForm.vehicleType === 'VAN' ? fulfilmentForm.vanName : fulfilmentForm.truckName} onChange={(e) => updateFulfilmentField(fulfilmentForm.vehicleType === 'VAN' ? 'vanName' : 'truckName', e.target.value)} /></Field>
            <Field label="Driver"><input className={inputClass} value={fulfilmentForm.driverName} onChange={(e) => updateFulfilmentField('driverName', e.target.value)} /></Field>
            <Field label="Branch"><select className={inputClass} value={fulfilmentForm.branchId} onChange={(e) => updateFulfilmentField('branchId', e.target.value)}><option value="">Use account branch</option>{branchOptions.map((b) => <option key={rowId(b) || b.name} value={rowId(b) || b.name}>{b.name || b.branchName}</option>)}</select></Field>
            <Field label="Delivery site"><select className={inputClass} value={fulfilmentForm.deliverySiteName} onChange={(e) => updateFulfilmentField('deliverySiteName', e.target.value)}><option value="">Manual / no site</option>{sites.map((site) => <option key={rowId(site)} value={site.siteName}>{site.siteName}</option>)}</select></Field>
            <Field label="Delivery address" span="md:col-span-3"><input className={inputClass} value={fulfilmentForm.deliveryAddress} onChange={(e) => updateFulfilmentField('deliveryAddress', e.target.value)} /></Field>
            <Field label="Service notes" span="md:col-span-3"><textarea rows="2" className={inputClass} value={fulfilmentForm.serviceNotes} onChange={(e) => updateFulfilmentField('serviceNotes', e.target.value)} /></Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button icon={Truck} onClick={logFulfilment} disabled={saving || !selectedClient?.id || !fulfilmentForm.requestedKg}>{saving ? 'Saving…' : 'Log Fulfilment'}</Button>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">Revenue {money(num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.sellingPricePerKg))}</Pill>
            <Pill tone="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Margin {money((num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.sellingPricePerKg)) - (num(fulfilmentForm.deliveredKg || fulfilmentForm.requestedKg) * num(fulfilmentForm.costPerKg)) - num(fulfilmentForm.deliveryCost))}</Pill>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-bold text-white">Recent Fulfilments</h3>
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {(fulfilments.length ? fulfilments : recentFulfilments).slice(0, 12).map((item) => (
              <div key={rowId(item)} className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><div className="font-semibold text-white">{item.clientName || selectedClient?.companyName}</div><Pill tone={stageTone(item.status)}>{item.status}</Pill></div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>{kg(item.deliveredKg || item.requestedKg)}</span><span>{money(item.revenue)}</span><span>{vehicleName(item)}</span><span>{item.invoiceNumber || item.orderCode || 'No invoice'}</span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-400">
                  <span>Operational order: <b className="text-white">{item.linkedOrderId || 'Not created'}</b></span>
                  <span>Run: <b className="text-white">{item.linkedRunId || 'Not linked'}</b></span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!item.linkedOrderId && <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => createOrderForFulfilment(item)} disabled={statusUpdating === item.id}>Create Order</Button>}
                  <input className={`${inputClass} max-w-[180px] py-1.5 text-xs`} placeholder="Run ID" value={runLinkDrafts[item.id]?.runId || ''} onChange={(e) => setRunLinkDrafts((prev) => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), runId: e.target.value } }))} />
                  <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => linkRunForFulfilment(item)} disabled={statusUpdating === item.id || !item.linkedOrderId}>Link Run</Button>
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
            {!fulfilments.length && !recentFulfilments.length && <p className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-500">No corporate fulfilments yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );


  const selectedBilling = useMemo(() => {
    const rows = fulfilments || [];
    const totalInvoiceValue = rows.reduce((sum, f) => sum + num(f.revenue), 0);
    const paid = rows.reduce((sum, f) => sum + num(f.amountPaid), 0);
    const outstanding = rows.reduce((sum, f) => sum + num(f.outstandingAmount), 0);
    const overdue = rows.filter((f) => num(f.outstandingAmount) > 0 && f.paymentDueDate && new Date(f.paymentDueDate) < new Date());
    const creditLimit = num(selectedClient?.creditLimit);
    return {
      totalInvoiceValue,
      paid,
      outstanding,
      overdue,
      openInvoices: rows.filter((f) => num(f.outstandingAmount) > 0),
      creditLimit,
      availableCredit: Math.max(0, creditLimit - outstanding),
      utilizationPct: creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0,
    };
  }, [fulfilments, selectedClient]);

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.fulfilmentId || !paymentForm.amount) {
      setError('Select an invoice/fulfilment and enter the payment amount.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await recordCorporateFulfilmentPayment(paymentForm.fulfilmentId, paymentForm);
      setMessage(res.message || 'Corporate payment recorded.');
      setPaymentForm(emptyPayment);
      await loadDetails(selectedClientId);
      const billing = await getCorporateBillingDashboard({ timeout: 12000 }).catch(() => null);
      if (billing) setBillingControl(billing);
    } catch (err) {
      setError(err.message || 'Failed to record corporate payment.');
    } finally {
      setSaving(false);
    }
  };

  const renderBilling = () => {
    const rows = fulfilments.length ? fulfilments : billingControl.openInvoices || [];
    return (
      <div className="space-y-6">
        {selectedClient && <SelectedAccountSummary />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallMetric label="Invoice value" value={money(selectedBilling.totalInvoiceValue || billingControl?.metrics?.totalInvoiceValue)} hint="Revenue value of corporate deliveries" />
          <SmallMetric label="Outstanding" value={money(selectedBilling.outstanding || billingControl?.metrics?.totalOutstanding)} hint="Unpaid corporate exposure" />
          <SmallMetric label="Available credit" value={money(selectedBilling.availableCredit)} hint={`${selectedBilling.utilizationPct || 0}% utilised`} />
          <SmallMetric label="Overdue invoices" value={selectedBilling.overdue.length || billingControl?.metrics?.overdueInvoices || 0} hint="Past due date and unpaid" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.3fr]">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">Record Corporate Payment</h3>
              <p className="mt-1 text-xs text-slate-400">Manual finance control for bank transfer, POS, cash, wallet or approved corporate payment receipts. This updates fulfilment payment status but does not post GL journals.</p>
            </div>
            <form onSubmit={recordPayment} className="space-y-3">
              <Field label="Invoice / fulfilment"><select className={inputClass} value={paymentForm.fulfilmentId} onChange={(e) => setPaymentForm({ ...paymentForm, fulfilmentId: e.target.value })}>
                <option value="">Select invoice or fulfilment</option>
                {fulfilments.map((f) => <option key={f.id} value={f.id}>{f.invoiceNumber || f.orderCode || f.id} — {money(f.outstandingAmount)} outstanding</option>)}
              </select></Field>
              <Field label="Amount received"><input className={inputClass} type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></Field>
              <Field label="Payment method"><select className={inputClass} value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>{['TRANSFER','ONLINE','WALLET','PAY_ON_DELIVERY','ACCOUNT_TERMS','OTHER'].map((x) => <option key={x} value={x}>{labelize(x)}</option>)}</select></Field>
              <Field label="Payment reference"><input className={inputClass} value={paymentForm.paymentReference} onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })} placeholder="Bank ref / receipt / gateway ref" /></Field>
              <Button type="submit" icon={DollarSign} disabled={saving || !paymentForm.fulfilmentId || !paymentForm.amount}>{saving ? 'Recording…' : 'Record Payment'}</Button>
            </form>
          </Card>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Invoices & Statement Lines</h3>
                <p className="mt-1 text-xs text-slate-400">Corporate billing control by fulfilment. Use this before GL posting is introduced.</p>
              </div>
              <Pill tone={selectedBilling.outstanding > selectedBilling.creditLimit && selectedBilling.creditLimit ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}>{selectedBilling.outstanding > selectedBilling.creditLimit && selectedBilling.creditLimit ? 'Credit Risk' : 'Within Credit'}</Pill>
            </div>
            <div className="space-y-3">
              {rows.slice(0, 12).map((f) => (
                <div key={f.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-white">{f.invoiceNumber || f.orderCode || f.id}</p>
                      <p className="text-xs text-slate-400">{f.deliverySiteName || 'Corporate delivery'} • {kg(f.deliveredKg || f.requestedKg)} • Due {date(f.paymentDueDate)}</p>
                    </div>
                    <Pill tone={stageTone(f.paymentStatus)}>{labelize(f.paymentStatus || 'UNPAID')}</Pill>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-4">
                    <span>Value <b className="block text-white">{money(f.revenue)}</b></span>
                    <span>Paid <b className="block text-white">{money(f.amountPaid)}</b></span>
                    <span>Outstanding <b className="block text-white">{money(f.outstandingAmount)}</b></span>
                    <span>Method <b className="block text-white">{labelize(f.paymentMethod)}</b></span>
                  </div>
                </div>
              ))}
              {!rows.length && <p className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No invoice or fulfilment billing lines yet.</p>}
            </div>
          </Card>
        </div>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Top Corporate Exposure</h3>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">Portfolio view</Pill>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(billingControl.byClient || []).slice(0, 9).map((c) => (
              <button key={c.id} type="button" onClick={() => selectClient(c.id, 'billing')} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-left hover:border-blue-500/30 hover:bg-blue-500/10">
                <p className="font-bold text-white">{c.companyName}</p>
                <p className="mt-1 text-xs text-slate-400">{labelize(c.paymentTerms)} • {c.openInvoices} open invoices</p>
                <div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-400">Outstanding</span><b className="text-white">{money(c.outstanding)}</b></div>
                <div className="mt-1 flex items-center justify-between text-sm"><span className="text-slate-400">Available credit</span><b className={c.creditRisk ? 'text-red-300' : 'text-emerald-300'}>{money(c.availableCredit)}</b></div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderRelationship = () => (
    <div className="space-y-6">
      {renderSelectedAccountHeader()}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <h3 className="mb-4 text-lg font-bold text-white">Add Relationship Activity</h3>
          <div className="space-y-3">
            <Field label="Type"><select className={inputClass} value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>{['FOLLOW_UP','CALL','WHATSAPP','EMAIL','VISIT','NOTE','SERVICE_ISSUE','STAGE_CHANGE'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></Field>
            <Field label="Title"><input className={inputClass} value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} /></Field>
            <Field label="Note"><textarea rows="4" className={inputClass} value={activityForm.note} onChange={(e) => setActivityForm({ ...activityForm, note: e.target.value })} /></Field>
            <Field label="Outcome"><input className={inputClass} value={activityForm.outcome} onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value })} /></Field>
            <Field label="Next follow-up"><input type="date" className={inputClass} value={activityForm.nextFollowUpDate} onChange={(e) => setActivityForm({ ...activityForm, nextFollowUpDate: e.target.value })} /></Field>
            <Button className="w-full" icon={PhoneCall} onClick={addActivity} disabled={saving || !selectedClient?.id || !activityForm.note}>Add Activity</Button>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-white">Relationship Timeline</h3>
            <Pill tone="bg-blue-500/10 text-blue-300 border-blue-500/20">{activities.length} activities</Pill>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id || activity.createdAt} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-bold text-white">{activity.title || activity.type}</p><p className="text-xs text-slate-500">{activity.createdByName || 'System'} · {dateTime(activity.createdAt)}</p></div>
                  <Pill tone="bg-slate-500/10 text-slate-300 border-slate-500/20">{activity.type}</Pill>
                </div>
                <p className="mt-3 text-sm text-slate-300">{activity.note}</p>
                {activity.outcome && <p className="mt-2 text-xs text-slate-400">Outcome: {activity.outcome}</p>}
                {activity.nextFollowUpDate && <p className="mt-2 text-xs text-amber-300">Next follow-up: {date(activity.nextFollowUpDate)}</p>}
              </div>
            ))}
            {!activities.length && <p className="rounded-xl border border-white/5 bg-white/5 p-6 text-center text-sm text-slate-400">No activities logged yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    if (activeSection === 'accounts') return renderAccounts();
    if (activeSection === 'onboarding') return renderOnboarding();
    if (activeSection === 'portal') return renderPortal();
    if (activeSection === 'sites') return renderSites();
    if (activeSection === 'requests') return renderRequests();
    if (activeSection === 'fulfilment') return renderFulfilment();
    if (activeSection === 'billing') return renderBilling();
    if (activeSection === 'relationship') return renderRelationship();
    return renderOverview();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <PageTitle title="Corporate Clients" subtitle="Dedicated BMA module for corporate account setup, customer portal credentials, delivery sites, requests, fulfilment and relationship ownership." />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={Building2} onClick={createNewClient}>New Corporate Client</Button>
          <Button icon={RefreshCw} onClick={() => load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-9">
          {SECTION_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                title={item.hint}
                className={`rounded-xl border p-3 text-left transition ${active ? 'border-blue-500/30 bg-blue-500/15 text-white' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                <div className="flex items-center gap-2"><Icon size={16} /><span className="text-sm font-semibold">{item.label}</span></div>
              </button>
            );
          })}
        </div>
      </div>

      <HelpPanel
        title={`${SECTION_LABELS[activeSection] || 'Corporate Clients'} guide`}
        items={[
          { label: 'Standalone module', text: 'Corporate clients now sit outside Sales & CRM with focused submenus for account setup, portal access, sites, requests and fulfilment.' },
          { label: 'BMA-led onboarding', text: 'Create the account internally, enable the business portal, then generate customer login credentials without requiring public self-registration.' },
          { label: 'Account administration', text: 'After creation, the account remains selected so you can immediately administer users, sites, requests and fulfilment records.' },
          { label: 'Finance safety', text: 'This frontend restructuring does not introduce GL posting or change financial posting behaviour.' },
        ]}
      />

      {loading && <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">Loading corporate client data…</div>}
      {renderActiveSection()}
    </div>
  );
}

export const CorporateAccounts = () => <CorporateClientsModule initialSection="accounts" />;
export const CorporateOnboarding = () => <CorporateClientsModule initialSection="onboarding" />;
export const CorporatePortalAccess = () => <CorporateClientsModule initialSection="portal" />;
export const CorporateSites = () => <CorporateClientsModule initialSection="sites" />;
export const CorporateRequests = () => <CorporateClientsModule initialSection="requests" />;
export const CorporateFulfilmentControl = () => <CorporateClientsModule initialSection="fulfilment" />;
export const CorporateBilling = () => <CorporateClientsModule initialSection="billing" />;
export const CorporateRelationshipDesk = () => <CorporateClientsModule initialSection="relationship" />;
