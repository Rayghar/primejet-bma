// src/App.js
import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import Login from './views/Login';
import NotFound from './views/NotFound';
// Removed: import { logAppEvent } from './services/loggingService'; // This service is no longer used directly by the frontend

// Import all view components (these will eventually be lazy-loaded)
import Dashboard from './views/Dashboard';
import FinancialStatements from './views/01-Finance/FinancialStatements';
import AssetAndLoan from './views/01-Finance/AssetAndLoan';
import TaxCompliance from './views/01-Finance/TaxCompliance';
import PlantStatus from './views/02-Operations/PlantStatus';
import Inventory from './views/02-Operations/Inventory';
import Logistics from './views/02-Operations/Logistics';
import SalesAnalytics from './views/03-Sales/SalesAnalytics';
import CustomerHub from './views/03-Sales/CustomerHub';
import DailyLog from './views/04-DataEntry/DailyLog';
import ApprovalQueue from './views/04-DataEntry/ApprovalQueue';
import UserManagement from './views/05-Admin/UserManagement';
import Configuration from './views/05-Admin/Configuration';
import DataMigration from './views/05-Admin/DataMigration';
import AuditLog from './views/05-Admin/AuditLog';
import TransactionHistory from './views/04-DataEntry/TransactionHistory';
import RevenueAssurance from './views/01-Finance/RevenueAssurance';


const AppContent = () => {
    const { user, loading } = useAuth();
    const [activeView, setActiveView] = useState('Dashboard');

    const navigateToView = (viewId) => {
        // logAppEvent('INFO', `User navigated to ${viewId}`, { component: 'App.js', view: viewId }); // Removed direct call
        setActiveView(viewId);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-gray-100">Loading Application...</div>;
    }

    if (!user) {
        return <Login />;
    }

    const renderView = () => {
        const viewMap = {
            Dashboard,
            FinancialStatements,
            AssetAndLoan,
            TaxCompliance,
            PlantStatus,
            Inventory,
            Logistics,
            SalesAnalytics,
            CustomerHub,
            RevenueAssurance,
            DailyLog,
            ApprovalQueue,
            UserManagement,
            Configuration,
            DataMigration,
            AuditLog,
            TransactionHistory,
        };
        
        const ComponentToRender = viewMap[activeView] || NotFound;
        return <ComponentToRender setActiveView={navigateToView} />;
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar activeView={activeView} setActiveView={navigateToView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header activeView={activeView} />
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
                <AppContent />
            </AuthProvider>
        </ErrorBoundary>
    );
}