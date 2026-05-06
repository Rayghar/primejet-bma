import React, { useEffect, useMemo, useState } from 'react';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import HelpPanel from '../../components/shared/HelpPanel';
import { HelpLabel } from '../../components/shared/HelpTooltip';
import { DATA_MIGRATION_HELP } from '../../utils/helpCatalog';
import { downloadCsv } from '../../utils/csv';
import {
  createMigrationBatch,
  dryRunMigrationBatch,
  importMigrationBatch,
  getMigrationBatch,
} from '../../api/migrationService';
import {
  Upload,
  Database,
  CheckCircle,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const SHEETS = [
  {
    key: 'branches',
    label: 'Branches / Plants',
    required: true,
    help: 'Define every branch/plant code that appears in the other CSVs. New branches can be created during import.',
    columns: ['Branch Code', 'Branch Name', 'Plant Name', 'Location', 'Opening Date', 'Status', 'Capacity KG', 'Manager', 'Default Cashier', 'Notes'],
    sample: [{ 'Branch Code': 'AJAH-01', 'Branch Name': 'Ajah Plant', 'Plant Name': 'PrimeJet Ajah', Location: 'Ajah Lagos', 'Opening Date': '2025-06-01', Status: 'Operational', 'Capacity KG': 10000, Manager: 'Manager Name', 'Default Cashier': 'Promise', Notes: '' }],
  },
  {
    key: 'openingStock',
    label: 'Opening Stock',
    required: true,
    help: 'Load the LPG stock position as at the migration start date for each branch.',
    columns: ['Branch Code', 'Stock Date', 'Product', 'Opening Quantity KG', 'Opening Cost Per KG', 'Opening Total Cost', 'Target Sale Price Per KG', 'Source Reference', 'Notes'],
    sample: [{ 'Branch Code': 'AJAH-01', 'Stock Date': '2025-06-01', Product: 'LPG', 'Opening Quantity KG': 3500, 'Opening Cost Per KG': 1050, 'Opening Total Cost': 3675000, 'Target Sale Price Per KG': 1380, 'Source Reference': 'Opening migration', Notes: '' }],
  },
  {
    key: 'stockPurchases',
    label: 'Stock Purchases / Stock-In',
    required: false,
    help: 'Every LPG stock purchase/reload after the opening stock date. This is what allows stock to finish and be replenished historically.',
    columns: ['Purchase Date', 'Branch Code', 'Supplier', 'Product', 'Quantity KG', 'Cost Per KG', 'Transport Cost', 'Other Landing Cost', 'Total Cost', 'Effective Landed Cost Per KG', 'Target Sale Price Per KG', 'Payment Method', 'Amount Paid', 'Reference', 'Notes'],
    sample: [{ 'Purchase Date': '2025-06-20', 'Branch Code': 'AJAH-01', Supplier: 'Marketer A', Product: 'LPG', 'Quantity KG': 5000, 'Cost Per KG': 1180, 'Transport Cost': 80000, 'Other Landing Cost': 20000, 'Total Cost': 6000000, 'Effective Landed Cost Per KG': 1200, 'Target Sale Price Per KG': 1400, 'Payment Method': 'Bank Transfer', 'Amount Paid': 6000000, Reference: 'INV-001', Notes: '' }],
  },
  {
    key: 'dailySales',
    label: 'Daily Sales / Cashier Close',
    required: true,
    help: 'One row per business date/branch close report. Business Date drives financial statements, not upload date.',
    columns: ['Business Date', 'Branch Code', 'Cashier Name', 'Opening Meter A', 'Closing Meter A', 'Opening Meter B', 'Closing Meter B', 'Total KG Sold', 'Selling Price Per KG', 'Expected Revenue', 'Cash Amount', 'POS Amount', 'Bank Transfer Amount', 'Company Account Amount', 'Total Collected', 'Shortage / Overpayment', 'Notes', 'Raw Source Text'],
    sample: [{ 'Business Date': '2025-04-28', 'Branch Code': 'AJAH-01', 'Cashier Name': 'Promise', 'Opening Meter A': 2679.47, 'Closing Meter A': 2679.47, 'Opening Meter B': 11908.01, 'Closing Meter B': 12048.21, 'Total KG Sold': 140.201, 'Selling Price Per KG': 1380, 'Expected Revenue': 193477.38, 'Cash Amount': 55177, 'POS Amount': 65300, 'Bank Transfer Amount': 73000.38, 'Company Account Amount': 0, 'Total Collected': 193477.38, 'Shortage / Overpayment': 0, Notes: '50kg paid directly to company account', 'Raw Source Text': '' }],
  },
  {
    key: 'expenses',
    label: 'Expenses',
    required: false,
    help: 'Cash/transfer/POS operating expenses linked to the business date.',
    columns: ['Expense Date', 'Branch Code', 'Cashier Name', 'Expense Category', 'Expense Description', 'Amount', 'Payment Source', 'Linked Business Date', 'Receipt Available', 'Notes'],
    sample: [{ 'Expense Date': '2025-04-28', 'Branch Code': 'AJAH-01', 'Cashier Name': 'Promise', 'Expense Category': 'Maintenance', 'Expense Description': 'Generator plug', Amount: 1500, 'Payment Source': 'Cash', 'Linked Business Date': '2025-04-28', 'Receipt Available': 'No', Notes: '' }],
  },
  {
    key: 'stockVariances',
    label: 'Stock Variance / Losses',
    required: false,
    help: 'Stock shortage/loss/gain rows. Do not put stock loss as a cash expense.',
    columns: ['Variance Date', 'Branch Code', 'Product', 'Variance Type', 'Quantity KG', 'Estimated Cost Per KG', 'Estimated Value', 'Reason', 'Linked Business Date', 'Approved By', 'Notes'],
    sample: [{ 'Variance Date': '2025-04-28', 'Branch Code': 'AJAH-01', Product: 'LPG', 'Variance Type': 'Shortage/Loss', 'Quantity KG': 21.6, 'Estimated Cost Per KG': 1200, 'Estimated Value': 25920, Reason: '50kg gas shortage', 'Linked Business Date': '2025-04-28', 'Approved By': '', Notes: '' }],
  },
];

const STAGING_FETCH_LIMIT = 1000;
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { cur += '"'; i += 1; }
    else if (ch === '"') { quoted = !quoted; }
    else if (ch === ',' && !quoted) { row.push(cur); cur = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cur); cur = '';
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || '').trim());
  return rows.slice(1).map((r) => headers.reduce((acc, h, idx) => ({ ...acc, [h]: r[idx] ?? '' }), {}));
};

const readFileAsText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(String(e.target.result || ''));
  reader.onerror = () => reject(new Error(`Could not read ${file?.name || 'file'}`));
  reader.readAsText(file);
});

const StatusBadge = ({ status }) => {
  const map = {
    READY: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    WARNING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    BLOCKED: 'bg-red-500/10 text-red-300 border-red-500/20',
    DUPLICATE: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    IMPORTED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-300 border-red-500/20',
    SKIPPED: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  };
  return <span className={`px-2 py-1 rounded-full text-xs border ${map[status] || 'bg-white/5 text-slate-300 border-white/10'}`}>{status || 'PENDING'}</span>;
};

const DataMigration = () => {
  const [files, setFiles] = useState({});
  const [parsedRows, setParsedRows] = useState({});
  const [batchName, setBatchName] = useState('Historical POS Migration June 2025 to Date');
  const [startDate, setStartDate] = useState('2025-06-01');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState({ createBranches: true, createMissingDailySummaryForExpenses: true, allowHistoricalNegativeStock: true, importStockDepletionMovements: true, skipDuplicates: true, queueForGlPosting: false });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [batchResult, setBatchResult] = useState(null);
  const [dryRun, setDryRun] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalParsed = useMemo(() => Object.values(parsedRows).reduce((sum, r) => sum + (Array.isArray(r) ? r.length : 0), 0), [parsedRows]);
  const staging = batchResult?.staging || [];
  const filteredStaging = staging.filter(
    (r) =>
      activeFilter === 'ALL' ||
      r.validationStatus === activeFilter ||
      r.importStatus === activeFilter
  );

  const totalFiltered = filteredStaging.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalFiltered ? (safeCurrentPage - 1) * pageSize : 0;
  const pageEnd = Math.min(pageStart + pageSize, totalFiltered);
  const visibleStaging = filteredStaging.slice(pageStart, pageEnd);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, pageSize, batchResult?.batch?.batchId]);

  const setOption = (key) => setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFile = async (sheet, file) => {
    try {
      setFiles((prev) => ({ ...prev, [sheet.key]: file }));
      const text = await readFileAsText(file);
      const rows = parseCsv(text);
      setParsedRows((prev) => ({ ...prev, [sheet.key]: rows }));
      setNotification({ show: true, type: 'success', message: `${sheet.label}: parsed ${rows.length} row(s).` });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.message });
    }
  };

  const downloadTemplate = (sheet) => downloadCsv(`${sheet.key}_migration_template.csv`, sheet.sample, sheet.columns.map((key) => ({ key, label: key })));
  const downloadAllTemplates = () => SHEETS.forEach((sheet) => downloadTemplate(sheet));

  const createBatch = async () => {
    setLoading(true);
    setNotification({ show: false, message: '', type: 'success' });
    setDryRun(null);
    try {
      if (!totalParsed) throw new Error('Upload at least one CSV before validating.');
      const data = await createMigrationBatch({
        name: batchName,
        dateRange: { startDate, endDate: endDate || undefined },
        rows: parsedRows,
        options,
        sourceFileName: Object.values(files).map((f) => f?.name).filter(Boolean).join(', '),
      });
      const fullData = data?.batch?.batchId
        ? await getMigrationBatch(data.batch.batchId, { limit: STAGING_FETCH_LIMIT })
        : data;

      setBatchResult(fullData);
      setNotification({
        show: true,
        type: 'success',
        message: `Batch created. ${fullData?.batch?.totals?.records || data?.batch?.totals?.records || 0} row(s) staged for review.`,
      });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message });
    } finally { setLoading(false); }
  };

  const refreshBatch = async () => {
    if (!batchResult?.batch?.batchId) return;
    const data = await getMigrationBatch(batchResult.batch.batchId, { limit: STAGING_FETCH_LIMIT });
    setBatchResult(data);
  };

  const runDryRun = async () => {
    setLoading(true);
    try {
      const data = await dryRunMigrationBatch(batchResult.batch.batchId);
      setDryRun(data.summary);
      await refreshBatch();
      setNotification({ show: true, type: 'success', message: 'Dry run completed. Review the import impact before final import.' });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message });
    } finally { setLoading(false); }
  };

  const finalImport = async () => {
    setLoading(true);
    try {
      const data = await importMigrationBatch(batchResult.batch.batchId, { includeWarnings: true });
      await refreshBatch();
      setNotification({ show: true, type: data.result?.failed ? 'error' : 'success', message: `Import finished. Imported ${data.result?.imported || 0}, failed ${data.result?.failed || 0}, skipped ${data.result?.skipped || 0}.` });
    } catch (error) {
      setNotification({ show: true, type: 'error', message: error.response?.data?.message || error.message });
    } finally { setLoading(false); }
  };

  const totals = batchResult?.batch?.totals || {};

  return (
    <>
      <PageTitle title="Historical Data Migration" subtitle="Import Excel/CSV historical sales, stock, expenses, branches and stock variances without ever using upload date as transaction date." />
      {notification.show && <Notification notification={notification} setNotification={setNotification} />}

      <HelpPanel
        title="Data Migration Operations Guide"
        defaultOpen
        items={[
          { key: 'businessDate', label: 'Date Control', help: DATA_MIGRATION_HELP.businessDate },
          { key: 'branches', label: 'Load Branches First', help: DATA_MIGRATION_HELP.branches },
          { key: 'openingStock', label: 'Opening Stock Anchor', help: DATA_MIGRATION_HELP.openingStock },
          { key: 'stockPurchases', label: 'Weekly Stock Purchases', help: DATA_MIGRATION_HELP.stockPurchases },
          { key: 'dailySales', label: 'Daily Sales Close', help: DATA_MIGRATION_HELP.dailySales },
          { key: 'expenses', label: 'Expenses', help: DATA_MIGRATION_HELP.expenses },
          { key: 'variances', label: 'Stock Variances', help: DATA_MIGRATION_HELP.variances },
          { key: 'dryRun', label: 'Dry Run Before Import', help: DATA_MIGRATION_HELP.dryRun },
          { key: 'finalImport', label: 'Final Import & GL Control', help: DATA_MIGRATION_HELP.finalImport },
          { key: 'duplicates', label: 'Duplicate Protection', help: DATA_MIGRATION_HELP.duplicates },
        ]}
      />

      <Card className="mb-6 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-blue-300 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-white">Critical migration control</h3>
            <p className="text-sm text-slate-300 mt-1">The application will use only the date fields inside the CSV rows: Business Date, Stock Date, Purchase Date, Expense Date and Variance Date. The upload date is stored only as audit metadata and will not drive financial statements, stock reports, GL posting, plant profitability or cashier reports.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><FileText className="mr-2" /> Migration Batch Setup</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="md:col-span-3 text-sm text-slate-300"><HelpLabel text="Name this import batch clearly so Finance can trace uploaded historical records to the source Excel/CSV pack.">Batch Name</HelpLabel><input value={batchName} onChange={(e) => setBatchName(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white" /></label>
            <label className="text-sm text-slate-300"><HelpLabel text="Control date range used for validation. Records outside this range should be reviewed before import.">Start Date</HelpLabel><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white" /></label>
            <label className="text-sm text-slate-300"><HelpLabel text="Optional range end date. It validates CSV transaction dates but does not become the transaction date itself.">End Date</HelpLabel><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white" /></label>
            <div className="flex items-end"><Button onClick={downloadAllTemplates} variant="secondary" icon={Download} className="w-full">Download CSV Templates</Button></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5 text-sm text-slate-300">
            {Object.entries(options).map(([key, val]) => (
              <label key={key} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3">
                <input type="checkbox" checked={val} onChange={() => setOption(key)} />
                <span title={DATA_MIGRATION_HELP[key] || 'Migration option'}>{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><Database className="mr-2" /> Batch Snapshot</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3"><div className="text-slate-400">Client parsed</div><div className="text-2xl font-bold text-white">{totalParsed}</div></div>
            <div className="rounded-xl bg-white/5 p-3"><div className="text-slate-400">Staged</div><div className="text-2xl font-bold text-white">{totals.records || 0}</div></div>
            <div className="rounded-xl bg-emerald-500/10 p-3"><div className="text-emerald-300">Ready</div><div className="text-2xl font-bold text-white">{totals.ready || 0}</div></div>
            <div className="rounded-xl bg-amber-500/10 p-3"><div className="text-amber-300">Warnings</div><div className="text-2xl font-bold text-white">{totals.warnings || 0}</div></div>
            <div className="rounded-xl bg-red-500/10 p-3"><div className="text-red-300">Blocked</div><div className="text-2xl font-bold text-white">{totals.blocked || 0}</div></div>
            <div className="rounded-xl bg-blue-500/10 p-3"><div className="text-blue-300">Duplicates</div><div className="text-2xl font-bold text-white">{totals.duplicates || 0}</div></div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center"><Upload className="mr-2" /> Upload CSV Files</h3>
        <p className="text-sm text-slate-400 mb-4">Create the data in Excel, then save each sheet as CSV and upload below. Required minimum: Branches, Opening Stock and Daily Sales.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SHEETS.map((sheet) => (
            <div key={sheet.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-white"><HelpLabel text={sheet.help}>{sheet.label}</HelpLabel> {sheet.required && <span className="text-red-300">*</span>}</h4>
                  <p className="text-xs text-slate-400 mt-1">{sheet.help}</p>
                </div>
                <button onClick={() => downloadTemplate(sheet)} className="text-blue-300 hover:text-blue-200"><Download size={18} /></button>
              </div>
              <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(sheet, e.target.files[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500" />
              <div className="mt-3 text-xs text-slate-400">{files[sheet.key]?.name ? `${files[sheet.key].name} • ${(parsedRows[sheet.key] || []).length} row(s)` : 'No file uploaded yet'}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={createBatch} disabled={loading || !totalParsed} icon={CheckCircle}>{loading ? 'Processing...' : 'Validate & Stage Batch'}</Button>
          <Button onClick={refreshBatch} disabled={!batchResult?.batch?.batchId || loading} variant="secondary" icon={RefreshCw}>Refresh Batch</Button>
        </div>
      </Card>

      {batchResult?.batch && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Validation Preview</h3>
              <p className="text-sm text-slate-400">Batch ID: {batchResult.batch.batchId} • Status: {batchResult.batch.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'READY', 'WARNING', 'BLOCKED', 'DUPLICATE', 'IMPORTED', 'FAILED', 'SKIPPED'].map((x) => (
                <Button
                  key={x}
                  variant={activeFilter === x ? 'primary' : 'secondary'}
                  onClick={() => {
                    setActiveFilter(x);
                    setCurrentPage(1);
                  }}
                  className="text-xs px-3 py-2"
                >
                  {x}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="text-left px-3 py-3">Type</th><th className="text-left px-3 py-3">Row</th><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Branch</th><th className="text-left px-3 py-3">Validation</th><th className="text-left px-3 py-3">Import</th><th className="text-left px-3 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {visibleStaging.map((r) => (
                  <tr key={r._id} className="border-t border-white/5 text-slate-300">
                    <td className="px-3 py-3">{r.recordType}</td>
                    <td className="px-3 py-3">{r.sourceRowNumber}</td>
                    <td className="px-3 py-3">{r.businessDate ? String(r.businessDate).slice(0, 10) : '—'}</td>
                    <td className="px-3 py-3">{r.branchCode || r.branchName || '—'}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.validationStatus} /></td>
                    <td className="px-3 py-3"><StatusBadge status={r.importStatus} /></td>
                    <td className="px-3 py-3 max-w-xl"><span className="text-red-300">{(r.validationErrors || []).join('; ')}</span>{(r.warnings || []).length > 0 && <span className="text-amber-300"> {(r.warnings || []).join('; ')}</span>}{r.importError && <span className="text-red-300"> {r.importError}</span>}</td>
                  </tr>
                ))}
                {visibleStaging.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-3 py-6 text-center text-slate-400">
                      No staged records found for the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-400">
              Showing {totalFiltered ? pageStart + 1 : 0}-{pageEnd} of{' '}
              {totalFiltered.toLocaleString()} filtered row(s).
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>Rows per page</span>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-white"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
              >
                First
              </button>

              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
              >
                Previous
              </button>

              <span>
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
              >
                Next
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
              >
                Last
              </button>
            </div>
          </div>

          {staging.length < (totals.records || 0) && (
            <p className="text-xs text-amber-300 mt-3">
              Only {staging.length.toLocaleString()} of{' '}
              {(totals.records || 0).toLocaleString()} rows are loaded in the browser.
              Click Refresh Batch, or increase STAGING_FETCH_LIMIT if your batch exceeds
              1,000 rows.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={runDryRun} disabled={loading || !batchResult?.batch?.batchId} icon={AlertTriangle} variant="secondary">Run Dry Run</Button>
            <Button onClick={finalImport} disabled={loading || !batchResult?.batch?.batchId || (totals.blocked || 0) > 0} icon={Database}>Import Approved Rows</Button>
          </div>
        </Card>
      )}

      {dryRun && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Dry Run Impact</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {Object.entries(dryRun).filter(([k]) => k !== 'rule').map(([k, v]) => <div key={k} className="rounded-xl bg-white/5 p-3"><div className="text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</div><div className="text-lg font-bold text-white">{typeof v === 'number' ? v.toLocaleString() : String(v)}</div></div>)}
          </div>
          <p className="text-sm text-blue-300 mt-4">{dryRun.rule}</p>
        </Card>
      )}
    </>
  );
};

export default DataMigration;
