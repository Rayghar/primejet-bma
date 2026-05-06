// File: src/app.js

import React, { useEffect, useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext"; // ✅ Real-time layer
import { useAuth } from "./hooks/useAuth";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import PageWrapper from "./components/layout/PageWrapper";
import Login from "./views/Login";
import NotFound from "./views/NotFound";
import { canViewModule, getFirstAllowedModule } from "./config/accessControl";

// --- 00. COMMAND CENTER (Live Ops) ---
import Dashboard from "./views/00-CommandCenter/Dashboard";
import Logistics from "./views/00-CommandCenter/Logistics";

// --- 01. FINANCE (ERP Financials) ---
import FinancialStatements from "./views/01-Finance/FinancialStatements";
import AssetAndLoan from "./views/01-Finance/AssetAndLoan";
import TaxCompliance from "./views/01-Finance/TaxCompliance";
import RevenueAssurance from "./views/01-Finance/RevenueAssurance";
import PlantProfitability from "./views/01-Finance/PlantProfitability";

// ✅ GL Refactor (New)
import TrialBalance from "./views/01-Finance/TrialBalance";
import GLHealth from "./views/01-Finance/GLHealth";
import PostingReadinessControl from "./views/01-Finance/PostingReadinessControl";
import FinanceControlReports from "./views/01-Finance/FinanceControlReports";
import OptionalSettlementControl from "./views/01-Finance/OptionalSettlementControl";
import GLReversalWorkbench from "./views/01-Finance/GLReversalWorkbench";
import OpeningBalanceWizard from "./views/01-Finance/OpeningBalanceWizard";
import PriceOverrideWorkbench from "./views/01-Finance/PriceOverrideWorkbench";
import LoanProjectionStudio from "./views/01-Finance/LoanProjectionStudio";

// --- 02. OPERATIONS (Physical Assets) ---
import Inventory from "./views/02-Operations/Inventory";
import PlantStatus from "./views/02-Operations/PlantStatus";
import StockControlCenter from "./views/02-Operations/StockControlCenter";
import ProductPriceBranchConfig from "./views/02-Operations/ProductPriceBranchConfig";
import PlantCommandCenter from "./views/02-Operations/PlantCommandCenter";
import PlantReliabilityCommandCenter from "./views/02-Operations/PlantReliabilityCommandCenter";

// --- 02. PERFORMANCE (HR & Fleet) ---
import DriverScorecards from "./views/02-Performance/DriverScorecards";

// --- 03. INTELLIGENCE (BI & Strategy) ---
import BusinessAnalytics from "./views/03-Intelligence/BusinessAnalytics";
import BusinessIntelligenceCommandCenter from "./views/03-Intelligence/BusinessIntelligenceCommandCenter";
import DeliveryHeatmap from "./views/03-Intelligence/DeliveryHeatmap";

// --- 03. SALES (CRM & Support) ---
import SalesAnalytics from "./views/03-Sales/SalesAnalytics";
import CustomerHub from "./views/03-Sales/CustomerHub";
import CustomerCRMCommandCenter from "./views/03-Sales/CustomerCRMCommandCenter";
import Customer360 from "./views/03-Sales/Customer360";
import SupportDesk from "./views/03-Sales/SupportDesk";
import WhatsAppBusinessLayer from "./views/03-Sales/WhatsAppBusinessLayer";
import CorporateClientManager from "./views/03-Sales/CorporateClientManager";

// --- 04. DATA ENTRY (POS & Logs) ---
import DailyLog from "./views/04-DataEntry/DailyLog";
import ApprovalQueue from "./views/04-DataEntry/ApprovalQueue";
import TransactionHistory from "./views/04-DataEntry/TransactionHistory"; // ✅ Legacy feature
import CloseWorkspace from "./views/04-DataEntry/ClosedWorkspace"; // ✅ New close-out flow
import DailyCloseControlDashboard from "./views/04-DataEntry/DailyCloseControlDashboard";
import DailyCloseControlWorkbench from "./views/04-DataEntry/DailyCloseControlWorkbench";
import POSReversalWorkbench from "./views/04-DataEntry/POSReversalWorkbench";

// --- 05. ADMIN (Configuration & Security) ---
import UserManagement from "./views/05-Admin/UserManagement";
import Configuration from "./views/05-Admin/Configuration";
import AuditLog from "./views/05-Admin/AuditLog";
import AppLogViewer from "./views/05-Admin/AppLogViewer"; // ✅ Legacy feature
import AdministrationControlCenter from "./views/05-Admin/AdministrationControlCenter";
import DataMigration from './views/05-Admin/DataMigration';
import TenderRepairWorkbench from './views/05-Admin/TenderRepairWorkbench';
import ReportsCenter from './views/05-Admin/ReportsCenter';
import ApprovalMatrixAdmin from './views/05-Admin/ApprovalMatrixAdmin';
import IntegrationHub from './views/05-Admin/IntegrationHub';
import ReferenceDataAdmin from './views/05-Admin/ReferenceDataAdmin';
import DataQualityCenter from './views/05-Admin/DataQualityCenter';
import NotificationTemplatesAdmin from './views/05-Admin/NotificationTemplatesAdmin';
import BackupExportCenter from './views/05-Admin/BackupExportCenter';
import WhatsAppSetupAdmin from './views/05-Admin/WhatsAppSetupAdmin';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState("Dashboard");

  useEffect(() => {
    if (user && !canViewModule(user, activeView)) {
      setActiveView(getFirstAllowedModule(user));
    }
  }, [user, activeView]);

  const navigateToView = (viewId) => {
    if (!canViewModule(user, viewId)) return;
    setActiveView(viewId);
  };

  // 1) Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a] text-blue-400">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-sm font-medium tracking-widest uppercase">
            Initializing System...
          </span>
        </div>
      </div>
    );
  }

  // 2) Unauthenticated
  if (!user) return <Login />;

  // 3) View routing (activeView -> component)
  const renderView = () => {
    const viewMap = {
      // Core
      Dashboard,
      Logistics,

      // Finance (ERP)
      FinancialStatements,
      AssetAndLoan,
      TaxCompliance,
      RevenueAssurance,
      PlantProfitability,

      // ✅ GL Refactor (New)
      TrialBalance,
      GLHealth,
      PostingReadinessControl,
      FinanceControlReports,
      OptionalSettlementControl,
      GLReversalWorkbench,
      OpeningBalanceWizard,
      PriceOverrideWorkbench,
LoanProjectionStudio,

      // Operations
      Inventory,
      PlantStatus,
      StockControlCenter,
ProductPriceBranchConfig,
      PlantCommandCenter,
      PlantReliabilityCommandCenter,

      // Performance & Intelligence
      DriverScorecards,
      BusinessAnalytics,
      BusinessIntelligenceCommandCenter,
      DeliveryHeatmap,

      // Sales & Support
      SalesAnalytics,
      CustomerHub,
      CustomerCRMCommandCenter,
      Customer360,
      SupportDesk,
      WhatsAppBusinessLayer,
      CorporateClientManager,

      // Data Entry
      DailyLog,
      ApprovalQueue,
      TransactionHistory,

      // ✅ Close-out flow (New)
      CloseWorkspace,
      DailyCloseControlDashboard,
      DailyCloseControlWorkbench,
      POSReversalWorkbench,

      // Admin
      UserManagement,
      Configuration,
      AuditLog,
      AppLogViewer,
      AdministrationControlCenter,
      ReportsCenter,
      ApprovalMatrixAdmin,
      IntegrationHub,
      ReferenceDataAdmin,
      DataQualityCenter,
      NotificationTemplatesAdmin,
      BackupExportCenter,
      WhatsAppSetupAdmin,

      DataMigration,
      TenderRepairWorkbench,
    };

    if (!viewMap[activeView]) {
      const ComponentToRender = NotFound;
      return <ComponentToRender setActiveView={navigateToView} />;
    }

    if (!canViewModule(user, activeView)) {
      return (
        <div className="max-w-xl mx-auto mt-20 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Access denied</h2>
          <p className="text-sm text-slate-300">You do not have permission to view this module. Contact your administrator if this access is required.</p>
        </div>
      );
    }

    const ComponentToRender = viewMap[activeView];
    return <ComponentToRender setActiveView={navigateToView} />;
  };

  // 4) Authenticated layout
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