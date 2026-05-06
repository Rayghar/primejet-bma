// src/config/accessControl.js
// Frontend access catalogue. This mirrors the backend permission model closely enough
// for menu hiding and route protection; backend remains the source of truth for security.

export const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner / Executive' },
  { value: 'investor', label: 'Investor' },
  { value: 'finance_lead', label: 'Finance Lead' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'plant_manager', label: 'Plant Manager' },
  { value: 'manager', label: 'Manager (Legacy)' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'inventory_officer', label: 'Inventory Officer' },
  { value: 'sales_agent', label: 'Sales / CRM Agent' },
  { value: 'support_agent', label: 'Support Agent' },
  { value: 'auditor', label: 'Auditor / Read-only' },
  { value: 'driver', label: 'Driver' },
  { value: 'customer', label: 'Customer' },
];

export const BRANCH_SCOPE_OPTIONS = [
  { value: 'all', label: 'All branches' },
  { value: 'selected', label: 'Selected branch(es)' },
  { value: 'own', label: 'Own/default branch only' },
  { value: 'none', label: 'No branch access' },
];

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_EXECUTIVE: 'dashboard.executive.view',
  INVESTOR_VIEW: 'investor.view',
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_BI_VIEW: 'analytics.bi.view',
  ANALYTICS_FLEET_VIEW: 'analytics.fleet.view',
  ANALYTICS_FLEET_MANAGE: 'analytics.fleet.manage',
  OPERATIONS_VIEW: 'operations.view',
  OPERATIONS_PLANT_VIEW: 'operations.plant.view',
  OPERATIONS_PLANT_MANAGE: 'operations.plant.manage',
  OPERATIONS_PRICING_VIEW: 'operations.pricing.view',
  OPERATIONS_PRICING_MANAGE: 'operations.pricing.manage',
  STOCK_VIEW: 'stock.view',
  STOCK_MANAGE: 'stock.manage',
  FINANCE_VIEW: 'finance.view',
  FINANCE_GL_VIEW: 'finance.gl.view',
  FINANCE_GL_POST: 'finance.gl.post',
  FINANCE_GL_REBUILD: 'finance.gl.rebuild',
  FINANCE_GL_RETRY: 'finance.gl.retry',
  FINANCE_GL_REVERSE_REQUEST: 'finance.gl.reverse.request',
  FINANCE_GL_REVERSE_APPROVE: 'finance.gl.reverse.approve',
  FINANCE_PERIOD_LOCK: 'finance.period.lock',
  FINANCE_OPENING_BALANCE: 'finance.opening-balance.manage',
  FINANCE_SETTLEMENT_MANAGE: 'finance.settlement.manage',
  FINANCE_TAX_VIEW: 'finance.tax.view',
  FINANCE_ASSET_LOAN_VIEW: 'finance.asset-loan.view',
  FINANCE_UNIT_ECONOMICS_VIEW: 'finance.unit-economics.view',
  FINANCE_REVENUE_ASSURANCE_VIEW: 'finance.revenue-assurance.view',
  POS_VIEW: 'pos.view',
  POS_SALE_CREATE: 'pos.sale.create',
  POS_EXPENSE_CREATE: 'pos.expense.create',
  POS_CLOSE_SUBMIT: 'pos.close.submit',
  POS_CLOSE_APPROVE: 'pos.close.approve',
  POS_REVERSE_REQUEST: 'pos.reverse.request',
  POS_REVERSE_APPROVE: 'pos.reverse.approve',
  POS_HISTORY_VIEW: 'pos.history.view',
  SALES_VIEW: 'sales.view',
  SALES_MANAGE: 'sales.manage',
  SALES_CORPORATE_VIEW: 'sales.corporate.view',
  SALES_CORPORATE_MANAGE: 'sales.corporate.manage',
  CUSTOMER_VIEW: 'customer.view',
  CUSTOMER_MANAGE: 'customer.manage',
  SUPPORT_VIEW: 'support.view',
  WHATSAPP_VIEW: 'whatsapp.view',
  WHATSAPP_MANAGE: 'whatsapp.manage',
  MIGRATION_VIEW: 'migration.view',
  MIGRATION_UPLOAD: 'migration.upload',
  MIGRATION_VALIDATE: 'migration.validate',
  MIGRATION_IMPORT: 'migration.import',
  ADMIN_VIEW: 'admin.view',
  ADMIN_USERS_VIEW: 'admin.users.view',
  ADMIN_USERS_CREATE: 'admin.users.create',
  ADMIN_USERS_UPDATE: 'admin.users.update',
  ADMIN_USERS_DELETE: 'admin.users.delete',
  ADMIN_ROLES_MANAGE: 'admin.roles.manage',
  ADMIN_CONFIG_MANAGE: 'admin.config.manage',
  ADMIN_AUDIT_VIEW: 'admin.audit.view',
  ADMIN_DIAGNOSTICS_VIEW: 'admin.diagnostics.view',
  ADMIN_REFERENCE_MANAGE: 'admin.reference.manage',
  ADMIN_REPORTS_VIEW: 'admin.reports.view',
  ADMIN_BACKUP_EXPORT: 'admin.backup.export',
  ADMIN_INTEGRATIONS_MANAGE: 'admin.integrations.manage',
  ADMIN_NOTIFICATIONS_MANAGE: 'admin.notifications.manage',
  ADMIN_DATA_QUALITY_VIEW: 'admin.data-quality.view',
  ADMIN_APPROVAL_MATRIX_MANAGE: 'admin.approval-matrix.manage',
};

const VIEWER_PERMISSIONS = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.DASHBOARD_EXECUTIVE,
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.OPERATIONS_VIEW,
  PERMISSIONS.OPERATIONS_PLANT_VIEW,
  PERMISSIONS.STOCK_VIEW,
  PERMISSIONS.FINANCE_VIEW,
  PERMISSIONS.FINANCE_GL_VIEW,
  PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW,
  PERMISSIONS.FINANCE_ASSET_LOAN_VIEW,
  PERMISSIONS.SALES_VIEW,
  PERMISSIONS.SALES_CORPORATE_VIEW,
  PERMISSIONS.CUSTOMER_VIEW,
  PERMISSIONS.ADMIN_REPORTS_VIEW,
];

export const ROLE_PERMISSION_TEMPLATES = {
  super_admin: ['*'],
  admin: ['*'],
  owner: [...VIEWER_PERMISSIONS, PERMISSIONS.FINANCE_REVENUE_ASSURANCE_VIEW, PERMISSIONS.FINANCE_TAX_VIEW, PERMISSIONS.ANALYTICS_BI_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW],
  investor: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.DASHBOARD_EXECUTIVE, PERMISSIONS.INVESTOR_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_GL_VIEW, PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW, PERMISSIONS.FINANCE_ASSET_LOAN_VIEW, PERMISSIONS.SALES_VIEW, PERMISSIONS.ADMIN_REPORTS_VIEW],
  finance_lead: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.DASHBOARD_EXECUTIVE, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_GL_VIEW, PERMISSIONS.FINANCE_GL_POST, PERMISSIONS.FINANCE_GL_REBUILD, PERMISSIONS.FINANCE_GL_RETRY, PERMISSIONS.FINANCE_GL_REVERSE_REQUEST, PERMISSIONS.FINANCE_GL_REVERSE_APPROVE, PERMISSIONS.FINANCE_PERIOD_LOCK, PERMISSIONS.FINANCE_OPENING_BALANCE, PERMISSIONS.FINANCE_SETTLEMENT_MANAGE, PERMISSIONS.FINANCE_TAX_VIEW, PERMISSIONS.FINANCE_ASSET_LOAN_VIEW, PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW, PERMISSIONS.FINANCE_REVENUE_ASSURANCE_VIEW, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.POS_CLOSE_APPROVE, PERMISSIONS.POS_REVERSE_APPROVE, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.MIGRATION_VIEW, PERMISSIONS.MIGRATION_VALIDATE, PERMISSIONS.MIGRATION_IMPORT, PERMISSIONS.ADMIN_REPORTS_VIEW, PERMISSIONS.ADMIN_DATA_QUALITY_VIEW],
  accountant: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_GL_VIEW, PERMISSIONS.FINANCE_GL_RETRY, PERMISSIONS.FINANCE_GL_REVERSE_REQUEST, PERMISSIONS.FINANCE_SETTLEMENT_MANAGE, PERMISSIONS.FINANCE_TAX_VIEW, PERMISSIONS.FINANCE_ASSET_LOAN_VIEW, PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW, PERMISSIONS.FINANCE_REVENUE_ASSURANCE_VIEW, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.MIGRATION_VIEW, PERMISSIONS.ADMIN_REPORTS_VIEW, PERMISSIONS.ADMIN_DATA_QUALITY_VIEW],
  operations_manager: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.OPERATIONS_PLANT_MANAGE, PERMISSIONS.OPERATIONS_PRICING_VIEW, PERMISSIONS.OPERATIONS_PRICING_MANAGE, PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_MANAGE, PERMISSIONS.POS_VIEW, PERMISSIONS.POS_CLOSE_APPROVE, PERMISSIONS.POS_REVERSE_REQUEST, PERMISSIONS.POS_REVERSE_APPROVE, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.SALES_CORPORATE_MANAGE, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.ADMIN_REPORTS_VIEW],
  plant_manager: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.OPERATIONS_PLANT_MANAGE, PERMISSIONS.OPERATIONS_PRICING_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_MANAGE, PERMISSIONS.POS_VIEW, PERMISSIONS.POS_CLOSE_APPROVE, PERMISSIONS.POS_REVERSE_REQUEST, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.SALES_CORPORATE_MANAGE, PERMISSIONS.CUSTOMER_VIEW],
  manager: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.OPERATIONS_PLANT_MANAGE, PERMISSIONS.OPERATIONS_PRICING_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_MANAGE, PERMISSIONS.POS_VIEW, PERMISSIONS.POS_CLOSE_APPROVE, PERMISSIONS.POS_REVERSE_REQUEST, PERMISSIONS.POS_REVERSE_APPROVE, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.SALES_CORPORATE_MANAGE, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_GL_VIEW, PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW, PERMISSIONS.ADMIN_REPORTS_VIEW],
  cashier: [PERMISSIONS.POS_VIEW, PERMISSIONS.POS_SALE_CREATE, PERMISSIONS.POS_EXPENSE_CREATE, PERMISSIONS.POS_CLOSE_SUBMIT, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_MANAGE, PERMISSIONS.STOCK_VIEW, PERMISSIONS.OPERATIONS_PRICING_VIEW],
  inventory_officer: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.ANALYTICS_FLEET_VIEW, PERMISSIONS.ANALYTICS_FLEET_MANAGE, PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_PLANT_VIEW, PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_MANAGE, PERMISSIONS.OPERATIONS_PRICING_VIEW, PERMISSIONS.ADMIN_REPORTS_VIEW],
  sales_agent: [PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_CORPORATE_VIEW, PERMISSIONS.SALES_CORPORATE_MANAGE, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_MANAGE, PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.WHATSAPP_VIEW, PERMISSIONS.ANALYTICS_VIEW],
  support_agent: [PERMISSIONS.SUPPORT_VIEW, PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_MANAGE, PERMISSIONS.WHATSAPP_VIEW],
  auditor: [...VIEWER_PERMISSIONS, PERMISSIONS.FINANCE_REVENUE_ASSURANCE_VIEW, PERMISSIONS.FINANCE_TAX_VIEW, PERMISSIONS.POS_HISTORY_VIEW, PERMISSIONS.MIGRATION_VIEW, PERMISSIONS.ADMIN_AUDIT_VIEW, PERMISSIONS.ADMIN_DATA_QUALITY_VIEW],
  driver: [PERMISSIONS.OPERATIONS_VIEW],
  customer: [],
};

export const MODULE_CATALOG = {
  Dashboard: { permission: PERMISSIONS.DASHBOARD_VIEW },
  Logistics: { permission: PERMISSIONS.OPERATIONS_VIEW },
  BusinessIntelligenceCommandCenter: { permission: PERMISSIONS.ANALYTICS_BI_VIEW },
  BusinessAnalytics: { permission: PERMISSIONS.ANALYTICS_VIEW },
  DeliveryHeatmap: { permission: PERMISSIONS.ANALYTICS_VIEW },
  DriverScorecards: { permission: PERMISSIONS.ANALYTICS_FLEET_VIEW },
  Inventory: { permission: PERMISSIONS.STOCK_VIEW },
  StockControlCenter: { permission: PERMISSIONS.STOCK_VIEW },
  ProductPriceBranchConfig: { permission: PERMISSIONS.OPERATIONS_PRICING_VIEW },
  PlantReliabilityCommandCenter: { permission: PERMISSIONS.OPERATIONS_PLANT_VIEW },
  PlantCommandCenter: { permission: PERMISSIONS.OPERATIONS_PLANT_VIEW },
  PlantStatus: { permission: PERMISSIONS.OPERATIONS_PLANT_VIEW },
  PostingReadinessControl: { permission: PERMISSIONS.FINANCE_GL_POST },
  FinancialStatements: { permission: PERMISSIONS.FINANCE_VIEW },
  FinanceControlReports: { permission: PERMISSIONS.FINANCE_VIEW },
  GLReversalWorkbench: { permission: PERMISSIONS.FINANCE_GL_REVERSE_REQUEST },
  OpeningBalanceWizard: { permission: PERMISSIONS.FINANCE_OPENING_BALANCE },
  PriceOverrideWorkbench: { permission: PERMISSIONS.OPERATIONS_PRICING_MANAGE },
  OptionalSettlementControl: { permission: PERMISSIONS.FINANCE_SETTLEMENT_MANAGE },
  TrialBalance: { permission: PERMISSIONS.FINANCE_GL_VIEW },
  GLHealth: { permission: PERMISSIONS.FINANCE_GL_VIEW },
  LoanProjectionStudio: { permission: PERMISSIONS.FINANCE_ASSET_LOAN_VIEW },
  AssetAndLoan: { permission: PERMISSIONS.FINANCE_ASSET_LOAN_VIEW },
  PlantProfitability: { permission: PERMISSIONS.FINANCE_UNIT_ECONOMICS_VIEW },
  RevenueAssurance: { permission: PERMISSIONS.FINANCE_REVENUE_ASSURANCE_VIEW },
  TaxCompliance: { permission: PERMISSIONS.FINANCE_TAX_VIEW },
  CustomerCRMCommandCenter: { permission: PERMISSIONS.SALES_VIEW },
  CorporateClientManager: { permission: PERMISSIONS.SALES_CORPORATE_VIEW },
  CustomerHub: { permission: PERMISSIONS.CUSTOMER_VIEW },
  Customer360: { permission: PERMISSIONS.CUSTOMER_VIEW },
  SalesAnalytics: { permission: PERMISSIONS.SALES_VIEW },
  SupportDesk: { permission: PERMISSIONS.SUPPORT_VIEW },
  WhatsAppBusinessLayer: { permission: PERMISSIONS.WHATSAPP_VIEW },
  DailyLog: { permission: PERMISSIONS.POS_VIEW },
  CloseWorkspace: { permission: PERMISSIONS.POS_CLOSE_SUBMIT },
  DailyCloseControlDashboard: { permission: PERMISSIONS.POS_CLOSE_APPROVE },
  DailyCloseControlWorkbench: { permission: PERMISSIONS.POS_CLOSE_APPROVE },
  POSReversalWorkbench: { permission: PERMISSIONS.POS_REVERSE_REQUEST },
  ApprovalQueue: { permission: PERMISSIONS.POS_CLOSE_APPROVE },
  TransactionHistory: { permission: PERMISSIONS.POS_HISTORY_VIEW },
  AdministrationControlCenter: { permission: PERMISSIONS.ADMIN_VIEW },
  UserManagement: { permission: PERMISSIONS.ADMIN_USERS_VIEW },
  Configuration: { permission: PERMISSIONS.ADMIN_CONFIG_MANAGE },
  WhatsAppSetupAdmin: { permission: PERMISSIONS.WHATSAPP_MANAGE },
  ApprovalMatrixAdmin: { permission: PERMISSIONS.ADMIN_APPROVAL_MATRIX_MANAGE },
  IntegrationHub: { permission: PERMISSIONS.ADMIN_INTEGRATIONS_MANAGE },
  ReferenceDataAdmin: { permission: PERMISSIONS.ADMIN_REFERENCE_MANAGE },
  DataMigration: { permission: PERMISSIONS.MIGRATION_VIEW },
  TenderRepairWorkbench: { permission: PERMISSIONS.MIGRATION_IMPORT },
  DataQualityCenter: { permission: PERMISSIONS.ADMIN_DATA_QUALITY_VIEW },
  ReportsCenter: { permission: PERMISSIONS.ADMIN_REPORTS_VIEW },
  NotificationTemplatesAdmin: { permission: PERMISSIONS.ADMIN_NOTIFICATIONS_MANAGE },
  BackupExportCenter: { permission: PERMISSIONS.ADMIN_BACKUP_EXPORT },
  AuditLog: { permission: PERMISSIONS.ADMIN_AUDIT_VIEW },
  AppLogViewer: { permission: PERMISSIONS.ADMIN_DIAGNOSTICS_VIEW },
};

export const getRoleLabel = (role) => ROLE_OPTIONS.find((item) => item.value === role)?.label || role || 'Unknown';

export const getEffectivePermissions = (user = {}) => {
  if (Array.isArray(user.effectivePermissions) && user.effectivePermissions.length > 0) return user.effectivePermissions;
  const base = ROLE_PERMISSION_TEMPLATES[user.role] || [];
  if (base.includes('*')) return ['*'];
  const direct = Array.isArray(user.permissions) ? user.permissions : [];
  const add = Array.isArray(user.permissionOverrides?.add) ? user.permissionOverrides.add : [];
  const remove = Array.isArray(user.permissionOverrides?.remove) ? user.permissionOverrides.remove : [];
  const merged = new Set([...base, ...direct, ...add]);
  remove.forEach((permission) => merged.delete(permission));
  return Array.from(merged);
};

export const userHasPermission = (user, permission) => {
  if (!permission) return true;
  const effective = getEffectivePermissions(user);
  return effective.includes('*') || effective.includes(permission);
};

export const canViewModule = (user, moduleId) => {
  const module = MODULE_CATALOG[moduleId];
  if (!module) return ['admin', 'super_admin'].includes(user?.role);
  return userHasPermission(user, module.permission);
};

export const getFirstAllowedModule = (user) => {
  const preferred = ['Dashboard', 'DailyLog', 'StockControlCenter', 'FinancialStatements', 'CustomerHub'];
  const fromPreferred = preferred.find((id) => canViewModule(user, id));
  if (fromPreferred) return fromPreferred;
  return Object.keys(MODULE_CATALOG).find((id) => canViewModule(user, id)) || 'Dashboard';
};

export const permissionsForRole = (role) => ROLE_PERMISSION_TEMPLATES[role] || [];
