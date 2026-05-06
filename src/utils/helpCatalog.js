// src/utils/helpCatalog.js

export const GL_HELP = Object.freeze({
  chartOfAccounts: 'The accounting master list used by all GL postings. Bootstrap creates missing default accounts without deleting existing accounts.',
  postingReadiness: 'Pre-posting control checks required accounts, posting exceptions, approved-but-unposted records, unbalanced journals, period locks, stock setup and branch configuration.',
  safeSetup: 'Runs non-destructive setup checks such as GL bootstrap and readiness refresh. It prepares the system but does not post operational records.',
  postApproved: 'Posts approved source records for the selected business date: daily POS summaries, approved expenses, stock-in records and delivered orders.',
  retryFailed: 'Retries only records that previously failed GL posting. Fix the underlying data issue before retrying.',
  trialBalance: 'A GL report where total debits must equal total credits. This is the first finance control before trusting financial statements.',
  journals: 'Journal entries are the audit record of each posting. Drill down to see debit/credit lines, source document and reversal history.',
  reversal: 'Use reversal instead of deleting posted finance data. A reversal creates equal and opposite GL lines and preserves the audit trail.',
  reversalApproval: 'Maker-checker control for reversals. The person who requested a reversal cannot approve it.',
  periodLock: 'Locks a fiscal month to prevent further posting, retry, rebuild or reversal unless the period is formally reopened.',
  postingBatch: 'A batch groups all records attempted in one posting action, showing posted, skipped and failed records with journal IDs.',
  financeConfidence: 'A management reporting quality score based on GL balance, posting completeness, failed postings, stock setup, pricing, mapping and reconciliation quality.',
  export: 'Exports the visible GL report to CSV so Finance can review or archive offline.',
});

export const PLANT_OPS_HELP = Object.freeze({
  openingStock: 'Load once per branch before trading. It anchors stock value, WAC and future COGS calculations.',
  openingCylinderStock: 'Initial cylinder quantity by size for operational accountability. This helps track branch cylinder custody.',
  stockIn: 'Records LPG purchases or stock receipts. Stock-in increases available LPG and can support inventory GL posting.',
  wac: 'Weighted Average Cost per kg. COGS uses this value when stock is depleted by POS sales or delivered orders.',
  cogsActivation: 'Branch-level gate that allows GL COGS posting only when opening stock, stock-in, WAC, branch pricing and mapping are ready.',
  stockReconciliation: 'Compares physical stock count to system stock and records variance reasons for control and audit.',
  stockMovementLedger: 'Shows every stock-in, sale depletion, order depletion and variance adjustment for stock traceability.',
  branchPricing: 'Effective-dated selling price per kg by branch. This protects historical pricing accuracy.',
  plantMapping: 'Maps a plant/branch to a stock location so sales, deliveries and stock movements use the correct inventory bucket.',
  branchProfitability: 'Revenue minus COGS and OPEX by branch. Accuracy depends on complete posting, correct WAC and reliable stock controls.',
});

export const POSTING_HELP = Object.freeze({
  approvedUnposted: 'Approved operational records that are eligible for GL posting but have not yet hit the ledger.',
  failedPostings: 'Records where the posting handler attempted GL posting and failed. Review the reason, fix the data, then retry.',
  postedJournals: 'Successfully posted GL entries for the selected period and branch scope.',
  staleData: 'Refresh after any posting, retry, setup, lock or reopen action so you are not relying on cached values.',
});

export const helpGroups = {
  'GL & Posting': GL_HELP,
  'Plant Operations': PLANT_OPS_HELP,
  'Posting Metrics': POSTING_HELP,
};

export const FINANCE_REPORT_HELP = Object.freeze({
  cashMovement: 'Shows posted GL movement through cash, bank transfer and POS settlement accounts. Use it to explain where physical cash/bank balances changed during the selected period.',
  expenseAnalysis: 'Groups non-voided ExpenseTransaction records by category, payment disposition and business date. Use this to review OPEX quality before trusting branch P&L.',
  branchPL: 'Computes branch-level P&L from posted GL journals by branchKey. It depends on revenue, COGS and OPEX postings being complete.',
  sourceTrace: 'Lets Finance trace a GL journal back to the originating source document: daily summary, expense, stock-in or delivery order.',
  walletLiability: 'Estimates customer wallet liability from completed wallet transactions. This is a review report only and does not automatically post GL liability journals.',
  failedPayments: 'Shows orders with failed, delayed or vending-failed payment states so payment operations can confirm, retry, refund or manually resolve them.',
  noDataState: 'When a report has no data, do not assume zero performance. Confirm posting completeness, date range, branch filter and source records first.',
});

export const POS_CASHIER_HELP = Object.freeze({
  branch: 'Select the plant/branch where the sale or expense physically happened. Branch selection drives daily close, settlement, stock depletion and GL posting.',
  meters: 'Opening and closing meter readings estimate LPG sold. Keep meter readings accurate before finalizing the day.',
  pricePerKg: 'The selling price per kg used to calculate sale amount and expected meter revenue. Where branch pricing exists, the effective price is shown automatically.',
  kgSold: 'Enter kilograms sold. The system calculates amount using price/kg. You may also enter amount and allow the system to calculate kg.',
  amount: 'Sale value captured from the customer. This feeds daily summary revenue and later GL posting after approval.',
  paymentMethod: 'Choose Cash, POS or Transfer. This determines settlement expectations and cash-on-hand reconciliation.',
  overrideReason: 'Explain any price difference from the configured effective price. This protects against unauthorized discounting and revenue leakage.',
  expenseDisposition: 'Cash expenses reduce expected cash on hand. Transfer/POS/Unpaid expenses are tracked separately for finance review.',
  finalize: 'Finalize only after sales, expenses, meter readings and variance have been reviewed. Finalization submits the day for approval; it does not post to GL by itself.',
  receipt: 'Receipt preview/reprint helps cashier support customer queries without editing the original sale record.',
  status: 'Daily status shows where the day is in the lifecycle: in progress, pending approval, approved, posted, rejected or closed.',
});

export const OPENING_BALANCE_HELP = Object.freeze({
  wizard: 'Guided setup for opening cash, bank, inventory, receivables, payables and equity. It must balance before posting.',
  inventory: 'Opening inventory requires plant/branch, quantity and cost/kg. This anchors WAC and enables POS sale validation.',
  posting: 'Posting creates the GL opening balance and loads operational stock. Maker-checker enforcement is intentionally excluded in Wave 19A.',
});

export const POS_REVERSAL_HELP = Object.freeze({
  saleReversal: 'Use sale reversal for wrong amount, wrong kg, duplicate sale, or failed customer payment. Posted sales require GL reversal handling.',
  expenseReversal: 'Use expense reversal for duplicate/wrong expense entries. Cash expense reversal recalculates expected cash-on-hand.',
  audit: 'Reversal captures reason, source record, user and timestamp. Do not delete posted/control records.',
});

export const PRICE_OVERRIDE_HELP = Object.freeze({
  request: 'Cashiers request overrides when entered price differs from branch effective price. Sales cannot proceed with unapproved override.',
  approve: 'Finance/admin approval allows the override to be used once. Maker-checker same-user blocking is not enforced in Wave 19A.',
  expiry: 'Approved overrides can expire and become USED after successful sale logging.',
});

export const PLANT_COMMAND_HELP = Object.freeze({
  commandCenter: 'Single plant control tower for stock health, maintenance, operating status, profitability, utilization and alerts.',
  validations: 'Stock cannot be logged without a valid plant and stock mapping. Sales cannot be logged until stock and branch pricing are configured.',
  profitability: 'Plant profitability combines POS/delivery revenue, stock movement COGS and OPEX/maintenance costs.',
});

export const LOAN_PROJECTION_HELP = Object.freeze({
  managementAccounts: 'Lender-ready monthly pack showing revenue, kg sold, COGS, OPEX, gross profit, cash/settlement evidence, GL readiness and inventory valuation.',
  loanAssumptions: 'Enter the lender terms: principal, interest rate, tenor, moratorium and fees. The system calculates reducing-balance repayments unless another method is selected.',
  truckEconomics: 'Models the truck benefit from refinery buying: cost/kg saved, monthly operating cost, downtime and volume growth.',
  dscr: 'Debt Service Coverage Ratio = cash available for debt service divided by monthly repayment. A lender comfort target is often at least 1.25x in the base case.',
  breakEvenVolume: 'Minimum monthly kg required for the truck margin uplift to cover loan repayment and truck operating costs.',
  fundingPack: 'Exportable pack for lender review: management accounts, assumptions, repayment schedule, sensitivity analysis and readiness checklist.',
});

helpGroups['Loan & Funding Readiness'] = LOAN_PROJECTION_HELP;

export const CRM_COMMAND_HELP = Object.freeze({
  dashboard: 'Customer CRM Command Center converts the customer list into retention, refill follow-up, LTV, campaign targeting and complaint recovery actions.',
  rfm: 'RFM scores customers by recency, frequency and monetary value. Use high scores for key account care and low recency for reactivation.',
  followUp: 'Daily follow-up queue identifies customers due for refill, churn-risk customers, dormant high-value customers and complaint-heavy customers.',
  campaigns: 'Campaign targets can be exported for WhatsApp, SMS or call lists. Do not target blocked/inactive customers.',
});

export const INTELLIGENCE_COMMAND_HELP = Object.freeze({
  executive: 'Business Intelligence Command Center summarizes actual sales, KG sold, margin, customer, stock, finance and risk signals.',
  recommendations: 'Recommended actions convert exceptions into management tasks such as closing overdue POS days, resolving failed postings and calling dormant customers.',
  dataConfidence: 'Data confidence drops when postings fail, plants are at risk or operational records are stale. Review before using figures for management decisions.',
});

export const PLANT_RELIABILITY_HELP = Object.freeze({
  stockCover: 'Days of stock cover estimates how long LPG stock can support current sales rate. Plants below three days require replenishment review.',
  maintenance: 'Preventive and corrective maintenance logs show downtime, cost and reliability impact.',
  safety: 'Safety checks create operational evidence for inspections, lender review and internal governance.',
  utilization: 'Utilization compares plant output to configured capacity. Over-capacity signals operational risk or wrong capacity configuration.',
});

export const ADMIN_CONTROL_HELP = Object.freeze({
  governance: 'Administration Control Center monitors users, roles, plant/stock mappings, product pricing, posting readiness and system health.',
  dataQuality: 'Data quality checks detect missing phone numbers, duplicate contacts, missing prices, missing stock mappings and failed postings.',
  systemHealth: 'System health should be reviewed before management accounts, month-end close and lender-report exports.',
});

helpGroups['Customer CRM Command'] = CRM_COMMAND_HELP;
helpGroups['Business Intelligence Command'] = INTELLIGENCE_COMMAND_HELP;
helpGroups['Plant Reliability'] = PLANT_RELIABILITY_HELP;
helpGroups['Administration Control'] = ADMIN_CONTROL_HELP;

export const DATA_MIGRATION_HELP = Object.freeze({
  businessDate: 'Every imported record must carry its own transaction date. Upload date is audit-only and must never drive sales, expenses, stock, GL, management accounts or profitability reporting.',
  branches: 'Load branches/plants first so every sales, expense, stock purchase and variance row can be tied to the correct operating location.',
  openingStock: 'Opening stock anchors the stock ledger and weighted average cost. Without it, stock performance and COGS cannot be trusted.',
  stockPurchases: 'Upload each replenishment when stock finishes or is topped up. This allows the system to calculate stock cover, COGS and plant profitability by period.',
  dailySales: 'One row per branch/cashier/business date close. Meter movement, KG sold, expected revenue and collection split are validated before import.',
  expenses: 'Expenses should use the actual expense date and branch. Cash expenses affect cashier close; transfer/POS/unpaid expenses are tracked separately for finance review.',
  variances: 'Stock shortages, gains and leakages are stock variance records, not ordinary cash expenses. They affect stock performance and should be reviewed before GL stock-loss posting.',
  dryRun: 'Dry run previews what will be created without writing to live operating tables. Compare totals with your Excel control summary before final import.',
  finalImport: 'Final import writes approved rows into live modules but leaves GL posting controlled by approval/posting workflows unless queueing is explicitly enabled.',
  duplicates: 'Duplicates are detected using branch, date, cashier/source details and references. Review duplicates before importing to avoid overstating revenue or stock.',
});

export const POS_CLOSE_WORKSPACE_HELP = Object.freeze({
  sequence: 'Use this workspace to review the day end-to-end: select branch/date, confirm meters, validate sales and expenses, check cash variance, finalize, approve and post only approved days.',
  businessDate: 'Always confirm the business date before loading or creating a daily summary. Do not close today when you intend to correct a historical day.',
  branch: 'Branch/plant selection drives stock depletion, expected cash, settlement and GL branch reporting. Wrong branch selection corrupts plant profitability.',
  meter: 'Meter close should support KG sold. Large differences between meter movement and logged sales must be explained before approval.',
  cashVariance: 'Expected cash equals cash sales minus approved cash expenses. Any shortage or overage should be documented before approval.',
  glPreview: 'GL preview is a control view. Actual GL is only affected when approved records are posted by the posting action.',
  reopen: 'Reopen is used for corrections before final posting. Once posted, use reversal workflows instead of deleting or editing source records.',
});

export const POS_CLOSE_CONTROL_HELP = Object.freeze({
  dashboard: 'The dashboard surfaces open days, pending approvals, approved-unposted records and failed postings so supervisors know what is blocking close.',
  workbench: 'The workbench is the supervisor action screen for approving, rejecting, reopening and posting a selected daily close.',
  actionList: 'Prioritize critical and high-severity items first, especially rejected days, approved-unposted days and failed postings that affect management accounts.',
  approval: 'Approval confirms the operational numbers are acceptable. Posting to GL remains a separate finance/control step.',
  exceptions: 'Failed postings usually indicate missing GL mapping, invalid branch setup, missing stock cost, closed period or incomplete source data.',
});

export const POS_EOD_APPROVAL_HELP = Object.freeze({
  pending: 'Pending approvals are finalized daily summaries awaiting review. Approvers should compare sales, expenses, cash variance, meter movement and notes before approval.',
  reject: 'Reject only with a clear reason so the cashier/supervisor can correct the daily close and resubmit.',
  postDay: 'Post day sends approved records for the selected business date and branch into the GL posting engine. It should not be used for unapproved or unresolved days.',
  history: 'Approval history helps explain who approved, rejected or posted a day and supports audit evidence.',
  retry: 'Retry failed postings only after fixing the root cause. Retrying without correcting setup/data will repeat the failure.',
});

export const POS_LEDGER_HELP = Object.freeze({
  sourceDocs: 'Source Docs show the operational records: daily summaries, sales, expenses and related posting state.',
  glJournals: 'GL Journals show accounting entries created from approved source records. Debits and credits must balance and should trace back to a source document.',
  dateFilter: 'The date filter should match the business/transaction date range under review, not upload or entry date.',
  reversal: 'Use reversal requests for posted GL records. Do not edit or delete posted entries because the audit trail must remain intact.',
  traceability: 'Use this screen to prove how a cashier close became a GL journal and how it contributes to management accounts.',
});

export const ADMIN_MODULE_HELP = Object.freeze({
  adminControl: 'Command view for system governance: user access, configuration readiness, data quality, security logs and posting controls.',
  staffAccess: 'Create users, assign roles and manage staff access. Keep finance, cashier, operations and admin roles separate.',
  systemConfig: 'Global business setup including branches, product/pricing behaviour, WhatsApp settings and operational defaults.',
  dataMigration: 'Controlled import workbench for historical CSV data. Use it for branch, opening stock, stock purchase, daily sales, expenses and stock variance migration.',
  reports: 'Export management accounts, sales, stock, audit and debtor evidence for internal review, lenders and auditors.',
  approvals: 'Configure which actions require approval and who can approve them. This supports maker-checker control as the business matures.',
  integrations: 'Manage external service credentials and readiness checks for WhatsApp, payment, messaging and future accounting integrations.',
  referenceData: 'Maintain reusable lists such as expense categories, payment methods, products, reason codes and operating statuses.',
  dataQuality: 'Detect incomplete or suspicious setup/data before it affects management accounts or operational reports.',
  notifications: 'Configure operational message templates for customer updates, staff alerts and escalation notices.',
  backupExport: 'Export controlled data packs for backup, reconciliation, lender review and offline analysis.',
});

helpGroups['Historical Data Migration'] = DATA_MIGRATION_HELP;
helpGroups['POS Close Workspace'] = POS_CLOSE_WORKSPACE_HELP;
helpGroups['POS Close Control'] = POS_CLOSE_CONTROL_HELP;
helpGroups['POS EOD Approvals'] = POS_EOD_APPROVAL_HELP;
helpGroups['POS Ledger Trace'] = POS_LEDGER_HELP;
helpGroups['Administration Modules'] = ADMIN_MODULE_HELP;
