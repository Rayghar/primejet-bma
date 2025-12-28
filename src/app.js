import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // ✅ Added Real-Time Layer
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import Login from './views/Login';
import NotFound from './views/NotFound';

// --- 00. COMMAND CENTER (Live Ops) ---
import Dashboard from './views/00-CommandCenter/Dashboard';
import Logistics from './views/00-CommandCenter/Logistics';

// --- 01. FINANCE (ERP Financials) ---
import FinancialStatements from './views/01-Finance/FinancialStatements';
import AssetAndLoan from './views/01-Finance/AssetAndLoan';
import TaxCompliance from './views/01-Finance/TaxCompliance';
import RevenueAssurance from './views/01-Finance/RevenueAssurance';
import PlantProfitability from './views/01-Finance/PlantProfitability';

// --- 02. OPERATIONS (Physical Assets) ---
import Inventory from './views/02-Operations/Inventory';
import PlantStatus from './views/02-Operations/PlantStatus';

// --- 02. PERFORMANCE (HR & Fleet) ---
import DriverScorecards from './views/02-Performance/DriverScorecards';

// --- 03. INTELLIGENCE (BI & Strategy) ---
import BusinessAnalytics from './views/03-Intelligence/BusinessAnalytics';
import DeliveryHeatmap from './views/03-Intelligence/DeliveryHeatmap';

// --- 03. SALES (CRM & Support) ---
import SalesAnalytics from './views/03-Sales/SalesAnalytics';
import CustomerHub from './views/03-Sales/CustomerHub';
import SupportDesk from './views/03-Sales/SupportDesk';

// --- 04. DATA ENTRY (POS & Logs) ---
import DailyLog from './views/04-DataEntry/DailyLog';
import ApprovalQueue from './views/04-DataEntry/ApprovalQueue';
import TransactionHistory from './views/04-DataEntry/TransactionHistory'; // ✅ Restored Legacy Feature

// --- 05. ADMIN (Configuration & Security) ---
import UserManagement from './views/05-Admin/UserManagement';
import Configuration from './views/05-Admin/Configuration';
import AuditLog from './views/05-Admin/AuditLog';
import AppLogViewer from './views/05-Admin/AppLogViewer'; // ✅ Restored Legacy Feature
// import DataMigration from './views/05-Admin/DataMigration'; // Optional: Uncomment if migration tool is needed in prod

const AppContent = () => {
    const { user, loading } = useAuth();
    const [activeView, setActiveView] = useState('Dashboard');

    // Handle view navigation from any component
    const navigateToView = (viewId) => {
        setActiveView(viewId);
    };

    // 1. Loading State
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0f172a] text-blue-400">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-sm font-medium tracking-widest uppercase">Initializing System...</span>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated State
    if (!user) {
        return <Login />;
    }

    // 3. View Routing Logic
    const renderView = () => {
        const viewMap = {
            // Core
            Dashboard, 
            Logistics,
            
            // Finance
            FinancialStatements, 
            AssetAndLoan, 
            TaxCompliance, 
            RevenueAssurance, 
            PlantProfitability,
            
            // Operations
            Inventory, 
            PlantStatus,
            
            // Performance & Intelligence (ERP)
            DriverScorecards, 
            BusinessAnalytics, 
            DeliveryHeatmap,
            
            // Sales & Support
            SalesAnalytics, 
            CustomerHub, 
            SupportDesk,
            
            // Data Entry
            DailyLog, 
            ApprovalQueue, 
            TransactionHistory,
            
            // Admin
            UserManagement, 
            Configuration, 
            AuditLog,
            AppLogViewer,
            // DataMigration
        };
        
        const ComponentToRender = viewMap[activeView] || NotFound;
        
        // Pass navigate function to all views so they can link to each other
        return <ComponentToRender setActiveView={navigateToView} />;
    };

    // 4. Authenticated Layout
    return (
        <div className="flex h-screen bg-[#0f172a] font-sans text-slate-50 overflow-hidden selection:bg-blue-500/30">
            {/* Sidebar Navigation */}
            <Sidebar activeView={activeView} setActiveView={navigateToView} />
            
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
                {/* Header */}
                <Header activeView={activeView} user={user} />
                
                {/* Main Content */}
                <PageWrapper>
                    {renderView()}
                </PageWrapper>
            </div>
        </div>
    );
};

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <SocketProvider>
                    <AppContent />
                </SocketProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}