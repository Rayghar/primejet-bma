// src/App.js
import React, { useState } from 'react';
// CORRECTED: AuthProvider is imported from the context file
import { AuthProvider } from './contexts/AuthContext'; 
// CORRECTED: useAuth is imported from the hooks file
import { useAuth } from './hooks/useAuth'; 
import ErrorBoundary from './components/shared/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import Login from './views/Login';
import NotFound from './views/NotFound';
import { logAppEvent } from './services/loggingService';

// Import all view components
import Dashboard from './views/Dashboard';
import FinancialStatements from './views/01-Finance/FinancialStatements';
import AssetAndLoan from './views/01-Finance/AssetAndLoan';
// import Projections from './views/01-Finance/Projections'; // This file does not exist yet
import TaxCompliance from './views/01-Finance/TaxCompliance';
import PlantStatus from './views/02-Operations/PlantStatus';
import Inventory from './views/02-Operations/Inventory';
import Logistics from './views/02-Operations/Logistics';
import SalesAnalytics from './views/03-Sales/SalesAnalytics';
import CustomerHub from './views/03-Sales/CustomerHub';
// import GeneratorConversions from './views/03-Sales/GeneratorConversions'; // This file does not exist yet
import DailyLog from './views/04-DataEntry/DailyLog';
import ApprovalQueue from './views/04-DataEntry/ApprovalQueue';
import UserManagement from './views/05-Admin/UserManagement';
import Configuration from './views/05-Admin/Configuration';
import DataMigration from './views/05-Admin/DataMigration';
import AuditLog from './views/05-Admin/AuditLog';
import AppLogViewer from './views/05-Admin/AppLogViewer';
import TransactionHistory from './views/04-DataEntry/TransactionHistory';
import RevenueAssurance from './views/01-Finance/RevenueAssurance';


const AppContent = () => {
    const { user, loading } = useAuth();
    const [activeView, setActiveView] = useState('Dashboard');

    const navigateToView = (viewId) => {
        logAppEvent('INFO', `User navigated to ${viewId}`, { component: 'App.js', view: viewId });
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
            // Projections, // Removed until created
            TaxCompliance,
            PlantStatus,
            Inventory,
            Logistics,
            SalesAnalytics,
            CustomerHub,
            RevenueAssurance, // Add to the map
            // GeneratorConversions, // Removed until created
            DailyLog,
            ApprovalQueue,
            UserManagement,
            Configuration,
            DataMigration,
            AuditLog,
            TransactionHistory, // Added TransactionHistory
            AppLogViewer,
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
