import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canViewModule, getRoleLabel } from '../../config/accessControl';
import { 
    LayoutDashboard, Truck, TrendingUp, Users, ShoppingCart, 
    MessageSquare, Settings, LogOut, ChevronLeft, ChevronRight,
    PieChart, Map, Activity, FileText, Shield, Database, 
    ClipboardList, DollarSign, Briefcase, UserCheck, RotateCcw, Calculator, History, Bell, Link, SlidersHorizontal, FileArchive, ClipboardCheck, ShieldCheck, Wrench
} from 'lucide-react';

const MENU_GROUPS = [
    {
        title: "Command",
        items: [
            { id: 'Dashboard', label: 'Executive View', icon: LayoutDashboard },
            { id: 'Logistics', label: 'Dispatch Map', icon: Truck },
        ]
    },
    {
        title: "Intelligence",
        items: [
            { id: 'BusinessIntelligenceCommandCenter', label: 'BI Command', icon: PieChart },
            { id: 'BusinessAnalytics', label: 'Growth & LTV', icon: PieChart },
            { id: 'DeliveryHeatmap', label: 'Delivery & Market Map', icon: Map },
            { id: 'DriverScorecards', label: 'Fleet & Truck Economics', icon: Activity },
        ]
    },
    {
        title: "Operations",
        items: [
            { id: 'Inventory', label: 'Stock & Cylinders', icon: ShoppingCart },
            { id: 'StockControlCenter', label: 'Stock Control', icon: Database },
{ id: 'ProductPriceBranchConfig', label: 'Product & Pricing', icon: Settings },
            { id: 'PlantCommandCenter', label: 'Plant Operations', icon: Activity, help: 'Unified plant operations workspace for daily sales, stock, reliability, maintenance, profitability and safety.' },
        ]
    },
    {
        title: "Finance & ERP",
        items: [
            { id: 'PostingReadinessControl', label: 'Posting Readiness', icon: Shield },
            { id: 'FinancialStatements', label: 'P&L / Balance', icon: TrendingUp },
            { id: 'FinanceControlReports', label: 'Finance Controls', icon: FileText },
            { id: 'GLReversalWorkbench', label: 'GL Reversals', icon: RotateCcw },
            { id: 'OpeningBalanceWizard', label: 'Opening Balances', icon: Database },
            { id: 'PriceOverrideWorkbench', label: 'Price Overrides', icon: Shield },
            { id: 'OptionalSettlementControl', label: 'Settlement Control', icon: DollarSign },
            { id: 'TrialBalance', label: 'Trial Balance', icon: FileText },
            { id: 'GLHealth', label: 'GL Health', icon: Activity },
            { id: 'LoanProjectionStudio', label: 'Loan Projection', icon: Calculator },
            { id: 'AssetAndLoan', label: 'Assets & Loans', icon: Briefcase },
            { id: 'PlantProfitability', label: 'Unit Economics', icon: DollarSign },
            { id: 'RevenueAssurance', label: 'Audit / Fraud', icon: Shield },
            { id: 'TaxCompliance', label: 'Tax & VAT', icon: FileText },
        ]
    },
    {
        title: "Sales & CRM",
        items: [
            { id: 'CustomerCRMCommandCenter', label: 'Customer CRM', icon: Users },
            { id: 'CorporateClientManager', label: 'Corporate Clients', icon: Briefcase, help: 'Manage B2B leads, prospects, onboarding, fulfilment, WhatsApp linkage and relationship ownership.' },
            { id: 'CustomerHub', label: 'Customers & Accounts', icon: Users },
            { id: 'Customer360', label: 'Customer 360', icon: UserCheck },
            { id: 'SalesAnalytics', label: 'Sales Trends', icon: TrendingUp },
            { id: 'SupportDesk', label: 'Live Chat', icon: MessageSquare },
            { id: 'WhatsAppBusinessLayer', label: 'WhatsApp Layer', icon: MessageSquare },
        ]
    },
    {
        title: "Point of Sale",
        items: [
            { id: 'DailyLog', label: 'Cashier POS', icon: ClipboardList, help: 'Capture daily LPG sales, expenses, meter readings and receipts for the selected branch.' },
            { id: 'CloseWorkspace', label: 'Close Workspace', icon: ClipboardList, help: 'Review, finalize, approve and post daily branch close records.' },
            { id: 'DailyCloseControlDashboard', label: 'Close Control', icon: Activity, help: 'Monitor open days, pending approvals, approved-unposted records and failed postings.' },
            { id: 'DailyCloseControlWorkbench', label: 'Close Workbench', icon: Shield, help: 'Supervisor workbench for close exception action, approval, rejection, reopen and GL posting.' },
            { id: 'POSReversalWorkbench', label: 'POS Reversals', icon: RotateCcw, help: 'Void or reverse wrong/duplicate sales and expenses with audit reasons.' },
            { id: 'ApprovalQueue', label: 'EOD Approvals', icon: FileText, help: 'Approve, reject, review history and post approved day-end summaries.' },
            { id: 'TransactionHistory', label: 'Ledger', icon: Database, help: 'Trace source documents to GL journals and request reversals for posted entries.' },
        ]
    },
    {
        title: "Administration",
        items: [
            { id: 'AdministrationControlCenter', label: 'Admin Control', icon: Shield, help: 'Governance dashboard for users, setup readiness, data quality and system controls.' },
            { id: 'UserManagement', label: 'Staff Access', icon: Users, help: 'Manage users, roles and staff access.' },
            { id: 'Configuration', label: 'Business Setup', icon: Settings, help: 'Global business configuration including operational defaults and WhatsApp settings.' },
            { id: 'WhatsAppSetupAdmin', label: 'WhatsApp Setup', icon: MessageSquare, help: 'Configure WhatsApp Cloud API credentials, webhook readiness and test messaging.' },
            { id: 'ApprovalMatrixAdmin', label: 'Approval Matrix', icon: ClipboardCheck, help: 'Define maker-checker and approval responsibilities for sensitive actions.' },
            { id: 'IntegrationHub', label: 'Integration Hub', icon: Link, help: 'External service readiness for WhatsApp, payments, messaging and future accounting integration.' },
            { id: 'ReferenceDataAdmin', label: 'Reference Data', icon: SlidersHorizontal, help: 'Govern expense categories, payment methods, reason codes, products and reusable lists.' },
            { id: 'DataMigration', label: 'Data Migration', icon: History, help: 'Import historical CSV data with staging, validation, dry-run and final import controls.' },
            { id: 'TenderRepairWorkbench', label: 'Tender Repair', icon: Wrench, help: 'Temporary module to run migrated tender split dry run, actual repair and GL rebuild status checks.' },
            { id: 'DataQualityCenter', label: 'Data Quality', icon: ShieldCheck, help: 'Identify missing setup, failed postings, duplicate/suspicious records and reporting risks.' },
            { id: 'ReportsCenter', label: 'Reports Center', icon: FileText, help: 'Export lender, audit and management reporting packs.' },
            { id: 'NotificationTemplatesAdmin', label: 'Notifications', icon: Bell, help: 'Manage customer/staff notification wording and escalation templates.' },
            { id: 'BackupExportCenter', label: 'Backup / Export', icon: FileArchive, help: 'Controlled exports and offline packs for backup, audit and reconciliation.' },
            { id: 'AuditLog', label: 'Security Logs', icon: Shield, help: 'Review security and audit events.' },
            { id: 'AppLogViewer', label: 'System Diagnostics', icon: Activity, help: 'Inspect system logs and diagnostics.' },
        ]
    }
];

export default function Sidebar({ activeView, setActiveView }) {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const visibleGroups = MENU_GROUPS
        .map(group => ({ ...group, items: group.items.filter(item => canViewModule(user, item.id)) }))
        .filter(group => group.items.length > 0);

    return (
        <div className={`h-screen bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-72'}`}>
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                {!collapsed && (
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
                            <span className="font-bold text-white">P</span>
                        </div>
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
                            PrimeJet<span className="text-blue-500">OS</span>
                        </span>
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all">
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                {visibleGroups.map((group, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id)}
                                    title={item.help || item.label}
                                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
                                        activeView === item.id 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-blue-300'
                                    }`}
                                >
                                    <item.icon size={20} className={`${collapsed ? 'mx-auto' : 'mr-3'} ${activeView === item.id ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'}`} />
                                    
                                    {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                                    
                                    {/* Tooltip for Collapsed Mode */}
                                    {collapsed && (
                                        <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-white/10">
                                            {item.label}
                                            {item.help && <span className="block text-[10px] text-gray-400 mt-1 max-w-xs whitespace-normal">{item.help}</span>}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                                {user?.name?.[0]}
                            </div>
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate w-32">{user?.name}</p>
                                <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}