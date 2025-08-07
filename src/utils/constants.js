// src/utils/constants.js
import {
    LayoutDashboard, BarChart2, Factory, Truck, ShoppingCart, Users, Settings,
    FileText, DollarSign, Banknote, TrendingUp, FilePlus, ClipboardCheck,
    Landmark, History, PackageCheck, UserCheck
} from 'lucide-react';

export const USER_ROLES = {
    ADMIN: 'Admin',
    FINANCE_LEAD: 'Finance Lead',
    MANAGER: 'Manager',
    CASHIER: 'Cashier',
};

export const BRANCHES = [
    { id: 'ijora', name: 'Ijora Plant' },
    { id: 'apapa', name: 'Apapa Plant' },
    { id: 'ikeja', name: 'Ikeja Plant' },
    { id: 'lekki', name: 'Lekki Plant' },
];

export const NAV_ITEMS = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'Home' },
    { id: 'FinancialStatements', icon: FileText, label: 'Financials', module: 'Finance', roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_LEAD] },
    { id: 'AssetAndLoan', icon: Landmark, label: 'Assets & Loans', module: 'Finance', roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_LEAD] },
    { id: 'Projections', icon: TrendingUp, label: 'Projections', module: 'Finance', roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_LEAD, USER_ROLES.MANAGER] },
    { id: 'TaxCompliance', icon: DollarSign, label: 'Tax Compliance', module: 'Finance', roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_LEAD] },
    { id: 'PlantStatus', icon: Factory, label: 'Plant Status', module: 'Operations', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
    { id: 'Inventory', icon: ShoppingCart, label: 'Inventory', module: 'Operations', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER] },
    { id: 'Logistics', icon: Truck, label: 'Logistics', module: 'Operations', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
    { id: 'SalesAnalytics', icon: BarChart2, label: 'Sales Analytics', module: 'Sales', roles: [USER_ROLES.ADMIN, USER_ROLES.FINANCE_LEAD, USER_ROLES.MANAGER] },
    { id: 'CustomerHub', icon: UserCheck, label: 'Customer Hub', module: 'Sales', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
    { id: 'GeneratorConversions', icon: PackageCheck, label: 'Conversions', module: 'Sales', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
    { id: 'DailyLog', icon: FilePlus, label: 'Daily Log', module: 'Data Entry', roles: [USER_ROLES.ADMIN, USER_ROLES.CASHIER] },
    { id: 'ApprovalQueue', icon: ClipboardCheck, label: 'Approval Queue', module: 'Data Entry', roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] },
    { id: 'UserManagement', icon: Users, label: 'User Management', module: 'Admin', roles: [USER_ROLES.ADMIN] },
    { id: 'Configuration', icon: Settings, label: 'Configuration', module: 'Admin', roles: [USER_ROLES.ADMIN] },
    { id: 'DataMigration', icon: History, label: 'Data Migration', module: 'Admin', roles: [USER_ROLES.ADMIN] },
];

