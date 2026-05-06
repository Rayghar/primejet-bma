// File: src/views/05-Admin/WhatsAppIntegrationSettings.js
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clipboard, RefreshCw, Save, Send, Settings, ShieldAlert } from 'lucide-react';
import {
  getWhatsAppSettings,
  updateWhatsAppSettings,
  getWhatsAppHealth,
  testWhatsAppConnection,
  sendWhatsAppTestMessage,
  syncWhatsAppTemplates,
} from '../../api/whatsappService';
import Button from '../../components/shared/Button';

const DEFAULT_SETTINGS = {
  enabled: false,
  mode: 'DRY_RUN',
  graphVersion: 'v20.0',
  businessAccountId: '',
  phoneNumberId: '',
  displayPhoneNumber: '',
  webhookVerifyToken: '',
  webhookCallbackUrl: '',
  accessToken: '',
  appSecret: '',
  defaultCountryCode: '234',
  signatureValidationRequired: false,
  mainMenuText: '',
  fallbackMessage: '',
  afterHoursMessage: '',
  requireAdminReview: true,
  autoCreateCustomer: true,
  defaultPaymentMethod: 'TRANSFER',
  defaultCity: 'Lagos',
  defaultState: 'Lagos',
  allowedCylinderSizes: [3, 5, 6, 12.5, 25, 50],
  minimumOrderFields: ['cylinderSizeKg', 'quantity', 'addressText', 'customerPhone', 'paymentPreference'],
  teamRouting: {
    GENERAL_MENU: 'BOT',
    ORDER_STATUS: 'BOT',
    NEW_ORDER: 'SALES',
    ORDER_DRAFT: 'SALES',
    ORDER_DRAFT_CONFIRMED: 'SALES',
    PAYMENT_HELP: 'FINANCE',
    COMPLAINT: 'SUPPORT',
    SPEAK_TO_AGENT: 'SUPPORT',
    UNKNOWN: 'SUPPORT',
  },
  templates: {
    orderConfirmation: '',
    paymentReminder: '',
    deliveryUpdate: '',
    complaintAcknowledgement: '',
    languageCode: 'en',
  },
};

const InfoTip = ({ children }) => (
  <p className="mt-1 text-[11px] leading-5 text-slate-500">{children}</p>
);

const Field = ({ label, value, onChange, placeholder, type = 'text', help }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <input
      type={type}
      value={value ?? ''}
      onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)}
      placeholder={placeholder}
      className="glass-input w-full p-3"
    />
    {help && <InfoTip>{help}</InfoTip>}
  </label>
);

const TextArea = ({ label, value, onChange, rows = 5, help }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
    <textarea
      rows={rows}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      className="glass-input w-full p-3"
    />
    {help && <InfoTip>{help}</InfoTip>}
  </label>
);

const Toggle = ({ label, checked, onChange, help }) => (
  <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
    <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" />
    <span>
      <span className="block text-sm font-semibold text-white">{label}</span>
      {help && <InfoTip>{help}</InfoTip>}
    </span>
  </label>
);

const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    red: 'border-red-500/30 bg-red-500/10 text-red-200',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    slate: 'border-white/10 bg-white/5 text-slate-300',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
};

const toCsv = (value) => Array.isArray(value) ? value.join(', ') : value || '';
const fromCsv = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

export default function WhatsAppIntegrationSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [runtime, setRuntime] = useState({});
  const [testPhone, setTestPhone] = useState('');
  const [testText, setTestText] = useState('PrimeJet Gas WhatsApp live test message.');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const readiness = runtime?.readiness || [];
  const missing = runtime?.missing || [];
  const liveReady = runtime?.effectiveMode === 'LIVE' && missing.length === 0;
  const webhookUrl = settings.webhookCallbackUrl || runtime?.webhookUrl || '';

  const update = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const updateNested = (group, field, value) => setSettings((prev) => ({ ...prev, [group]: { ...(prev[group] || {}), [field]: value } }));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWhatsAppSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
      setRuntime(data.runtime || {});
    } catch (err) {
      setError(err.message || 'Failed to load WhatsApp settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const payload = useMemo(() => ({
    ...settings,
    allowedCylinderSizes: Array.isArray(settings.allowedCylinderSizes) ? settings.allowedCylinderSizes : fromCsv(settings.allowedCylinderSizes).map(Number),
    minimumOrderFields: Array.isArray(settings.minimumOrderFields) ? settings.minimumOrderFields : fromCsv(settings.minimumOrderFields),
  }), [settings]);

  const save = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const data = await updateWhatsAppSettings(payload);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || payload) });
      setRuntime(data.runtime || runtime);
      setNotice('WhatsApp settings saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  const refreshHealth = async () => {
    setBusy('health');
    setError('');
    try {
      const data = await getWhatsAppHealth();
      setRuntime(data || {});
      setNotice('WhatsApp readiness refreshed.');
    } catch (err) {
      setError(err.message || 'Failed to refresh WhatsApp readiness');
    } finally {
      setBusy('');
    }
  };

  const runTestConnection = async () => {
    setBusy('connection');
    setError('');
    try {
      const data = await testWhatsAppConnection();
      setRuntime(data.health || runtime);
      setNotice(data.message || (data.ok ? 'WhatsApp connection test completed.' : `Connection failed: ${data.error || 'unknown error'}`));
    } catch (err) {
      setError(err.message || 'Failed to test connection');
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    if (!testPhone.trim()) {
      setError('Enter a test recipient WhatsApp number first.');
      return;
    }
    setBusy('message');
    setError('');
    try {
      await sendWhatsAppTestMessage({ to: testPhone.trim(), text: testText });
      setNotice('Test WhatsApp message processed. Check the message log or the recipient phone.');
    } catch (err) {
      setError(err.message || 'Failed to send test message');
    } finally {
      setBusy('');
    }
  };

  const syncTemplates = async () => {
    setBusy('templates');
    setError('');
    try {
      const data = await syncWhatsAppTemplates();
      setNotice(data.message || `Template sync completed. ${Array.isArray(data.templates) ? data.templates.length : 0} template(s) returned.`);
    } catch (err) {
      setError(err.message || 'Failed to sync templates');
    } finally {
      setBusy('');
    }
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setNotice('Webhook URL copied.');
    } catch (_err) {
      setNotice('Copy failed. Please copy the URL manually.');
    }
  };

  if (loading) {
    return <div className="glass-card p-6 text-sm text-slate-400">Loading WhatsApp integration settings...</div>;
  }

  return (
    <div className="glass-card space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">WhatsApp Integration Setup</h3>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
              Configure Meta WhatsApp Cloud API, webhook verification, customer mini-app flow, order-intake defaults and live test readiness from Admin.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={runtime?.effectiveMode === 'LIVE' ? 'green' : runtime?.effectiveMode === 'DISABLED' ? 'red' : 'amber'}>
            {runtime?.effectiveMode || settings.mode || 'DRY_RUN'}
          </Badge>
          <Badge tone={liveReady ? 'green' : 'amber'}>{liveReady ? 'Live ready' : 'Setup required'}</Badge>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</div>}

      <section className="grid gap-4 lg:grid-cols-3">
        <Toggle label="Enable WhatsApp Integration" checked={settings.enabled} onChange={(value) => update('enabled', value)} help="Turn this on before live testing. When disabled, webhooks can still be inspected but outbound sending stays blocked." />
        <label className="block rounded-xl border border-white/10 bg-white/5 p-3">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Mode</span>
          <select value={settings.mode || 'DRY_RUN'} onChange={(event) => update('mode', event.target.value)} className="glass-input w-full p-3">
            <option value="DISABLED">Disabled</option>
            <option value="DRY_RUN">Dry Run</option>
            <option value="LIVE">Live</option>
          </select>
          <InfoTip>Dry Run logs messages without sending to Meta. Live sends real WhatsApp messages using the configured token and phone number ID.</InfoTip>
        </label>
        <Field label="Graph API Version" value={settings.graphVersion} onChange={(value) => update('graphVersion', value)} help="Example: v20.0. Use the same version shown in your Meta Developer WhatsApp API setup." />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Field label="WhatsApp Business Account ID" value={settings.businessAccountId} onChange={(value) => update('businessAccountId', value)} help="Found in Meta Business Manager / WhatsApp Manager." />
        <Field label="Phone Number ID" value={settings.phoneNumberId} onChange={(value) => update('phoneNumberId', value)} help="This is the Cloud API phone number ID, not the visible phone number." />
        <Field label="Visible Business Phone Number" value={settings.displayPhoneNumber} onChange={(value) => update('displayPhoneNumber', value)} help="Optional display number for admin reference." />
        <Field label="Default Country Code" value={settings.defaultCountryCode} onChange={(value) => update('defaultCountryCode', value)} help="Default country code for normalising customer phone numbers. Nigeria is 234." />
        <Field label="Webhook Verify Token" value={settings.webhookVerifyToken} onChange={(value) => update('webhookVerifyToken', value)} help="Must match the token entered in Meta when verifying your webhook callback URL." />
        <Field label="Access Token" value={settings.accessToken} onChange={(value) => update('accessToken', value)} help="Paste a temporary or permanent Meta token. It will be masked after saving and never returned in full." />
        <Field label="App Secret" value={settings.appSecret} onChange={(value) => update('appSecret', value)} help="Optional but recommended for webhook signature validation. It is masked after saving." />
        <Toggle label="Require webhook signature validation" checked={settings.signatureValidationRequired} onChange={(value) => update('signatureValidationRequired', value)} help="Keep this off until the raw webhook signature middleware is enabled and tested in production." />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="font-bold text-white">Webhook Setup</h4>
            <p className="text-xs text-slate-500">Copy this URL into Meta Developer Console under WhatsApp webhook callback URL.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={Clipboard} onClick={copyWebhook}>Copy URL</Button>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={refreshHealth} disabled={busy === 'health'}>{busy === 'health' ? 'Refreshing...' : 'Refresh'}</Button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-emerald-100 break-all">{webhookUrl || 'Webhook URL will appear after backend host is available.'}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readiness.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                <Badge tone={item.ready ? 'green' : item.informational ? 'amber' : 'red'}>{item.ready ? 'Ready' : item.informational ? 'Info' : 'Missing'}</Badge>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{item.key}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TextArea label="Main Menu / Welcome Flow" value={settings.mainMenuText} onChange={(value) => update('mainMenuText', value)} help="This is the WhatsApp mini-app menu customers see when they type hi, hello, menu or start." />
        <TextArea label="Unknown Message Fallback" value={settings.fallbackMessage} onChange={(value) => update('fallbackMessage', value)} help="Shown when the bot cannot classify the message." />
        <TextArea label="After-Hours Message" value={settings.afterHoursMessage} onChange={(value) => update('afterHoursMessage', value)} rows={3} help="Optional response for requests outside operating hours." />
        <div className="grid gap-3">
          <Field label="Order Status Keywords" value={toCsv(settings.orderStatusKeywords)} onChange={(value) => update('orderStatusKeywords', fromCsv(value))} help="Comma-separated words/customers can type for order status." />
          <Field label="Refill/Order Keywords" value={toCsv(settings.refillKeywords)} onChange={(value) => update('refillKeywords', fromCsv(value))} help="Comma-separated words/customers can type to start refill request." />
          <Field label="Complaint Keywords" value={toCsv(settings.complaintKeywords)} onChange={(value) => update('complaintKeywords', fromCsv(value))} help="Comma-separated complaint handoff keywords." />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 font-bold text-white">Order Intake Defaults</h4>
          <div className="space-y-3">
            <Toggle label="Require admin review before converting WhatsApp draft" checked={settings.requireAdminReview} onChange={(value) => update('requireAdminReview', value)} help="Recommended: keep sales/admin review before creating operational orders." />
            <Toggle label="Auto-create customer if WhatsApp phone is unknown" checked={settings.autoCreateCustomer} onChange={(value) => update('autoCreateCustomer', value)} help="Creates a lightweight customer profile during draft-to-order conversion if needed." />
            <Field label="Default Payment Method" value={settings.defaultPaymentMethod} onChange={(value) => update('defaultPaymentMethod', value)} help="Examples: TRANSFER, CASH_ON_DELIVERY, POS_ON_DELIVERY, WALLET, PAYSTACK_LINK." />
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Default City" value={settings.defaultCity} onChange={(value) => update('defaultCity', value)} />
              <Field label="Default State" value={settings.defaultState} onChange={(value) => update('defaultState', value)} />
            </div>
            <Field label="Allowed Cylinder Sizes" value={toCsv(settings.allowedCylinderSizes)} onChange={(value) => update('allowedCylinderSizes', fromCsv(value).map(Number).filter(Boolean))} help="Comma-separated sizes accepted by the WhatsApp order intake parser." />
            <Field label="Minimum Order Fields" value={toCsv(settings.minimumOrderFields)} onChange={(value) => update('minimumOrderFields', fromCsv(value))} help="Fields that must be captured before a WhatsApp refill draft is accepted." />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 font-bold text-white">Team Routing</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.keys(DEFAULT_SETTINGS.teamRouting).map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{key}</span>
                <select value={settings.teamRouting?.[key] || DEFAULT_SETTINGS.teamRouting[key]} onChange={(event) => updateNested('teamRouting', key, event.target.value)} className="glass-input w-full p-3">
                  <option>BOT</option>
                  <option>SALES</option>
                  <option>SUPPORT</option>
                  <option>FINANCE</option>
                  <option>OPERATIONS</option>
                </select>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 font-bold text-white">Template Names</h4>
          <div className="space-y-3">
            <Field label="Order Confirmation Template" value={settings.templates?.orderConfirmation} onChange={(value) => updateNested('templates', 'orderConfirmation', value)} />
            <Field label="Payment Reminder Template" value={settings.templates?.paymentReminder} onChange={(value) => updateNested('templates', 'paymentReminder', value)} />
            <Field label="Delivery Update Template" value={settings.templates?.deliveryUpdate} onChange={(value) => updateNested('templates', 'deliveryUpdate', value)} />
            <Field label="Complaint Acknowledgement Template" value={settings.templates?.complaintAcknowledgement} onChange={(value) => updateNested('templates', 'complaintAcknowledgement', value)} />
            <Field label="Language Code" value={settings.templates?.languageCode || 'en'} onChange={(value) => updateNested('templates', 'languageCode', value)} />
            <Button variant="secondary" icon={RefreshCw} onClick={syncTemplates} disabled={busy === 'templates'}>{busy === 'templates' ? 'Syncing...' : 'Sync Templates'}</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 font-bold text-white">Live Test Console</h4>
          <div className="space-y-3">
            <Field label="Test Recipient WhatsApp Number" value={testPhone} onChange={setTestPhone} placeholder="2348012345678" help="Use an allowed test recipient in Meta sandbox or an opted-in production recipient." />
            <TextArea label="Test Message" value={testText} onChange={setTestText} rows={3} />
            <div className="flex flex-wrap gap-2">
              <Button icon={ShieldAlert} variant="secondary" onClick={runTestConnection} disabled={busy === 'connection'}>{busy === 'connection' ? 'Testing...' : 'Test Connection'}</Button>
              <Button icon={Send} onClick={sendTest} disabled={busy === 'message'}>{busy === 'message' ? 'Sending...' : 'Send Test Message'}</Button>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs leading-5 text-blue-100">
              <p className="font-bold">Operational guide</p>
              <p>1. Save credentials. 2. Copy webhook URL to Meta. 3. Use the same verify token. 4. Run setup check. 5. Send a test message. 6. Ask a customer to reply “menu”, then monitor Sales & CRM → WhatsApp Layer.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <CheckCircle size={16} className="text-emerald-300" />
          Secrets are masked after saving. Empty or masked secret fields preserve the existing stored value.
        </div>
        <Button onClick={save} disabled={saving} icon={Save} className="px-8">{saving ? 'Saving...' : 'Save WhatsApp Settings'}</Button>
      </div>
    </div>
  );
}
