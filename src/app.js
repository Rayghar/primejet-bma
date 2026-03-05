// File: src/app.js

import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
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

// ✅ NEW (GL-first reporting)
import TrialBalance from './views/01-Finance/TrialBalance';
import GLHealth from './views/01-Finance/GLHealth';

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

// --- 04. DATA ENTRY (GL-first Ops Closeout) ---
// ✅ IMPORTANT:
// We KEEP the view key "DailyLog" so Sidebar doesn't break,
// but the component is now the GL-first Close Workspace.
import CloseWorkspace from './views/04-DataEntry/CloseWorkspace';
import ApprovalQueue from './views/04-DataEntry/ApprovalQueue';
import TransactionHistory from './views/04-DataEntry/TransactionHistory';

// --- 05. ADMIN (Configuration & Security) ---
import UserManagement from './views/05-Admin/UserManagement';
import Configuration from './views/05-Admin/Configuration';
import AuditLog from './views/05-Admin/AuditLog';
import AppLogViewer from './views/05-Admin/AppLogViewer';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('Dashboard');

  const navigateToView = (viewId) => setActiveView(viewId);

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

  if (!user) {
    return <Login />;
  }

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

      // ✅ GL-first finance controls
      TrialBalance,
      GLHealth,

      // Operations
      Inventory,
      PlantStatus,

      // Performance & Intelligence
      DriverScorecards,
      BusinessAnalytics,
      DeliveryHeatmap,

      // Sales & Support
      SalesAnalytics,
      CustomerHub,
      SupportDesk,

      // Data Entry (GL-first)
      // ✅ Preserve "DailyLog" view id but render CloseWorkspace
      DailyLog: CloseWorkspace,
      ApprovalQueue,
      TransactionHistory,

      // Admin
      UserManagement,
      Configuration,
      AuditLog,
      AppLogViewer,
    };

    const ComponentToRender = viewMap[activeView] || NotFound;
    return <ComponentToRender setActiveView={navigateToView} />;
  };

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-50 overflow-hidden selection:bg-blue-500/30">
      <Sidebar activeView={activeView} setActiveView={navigateToView} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        <Header activeView={activeView} user={user} />

        <PageWrapper>{renderView()}</PageWrapper>
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