// src/App.js
import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import FinancialStatements from './views/01-Finance/FinancialStatements';
import AssetAndLoan from './views/01-Finance/AssetAndLoan';
import TaxCompliance from './views/01-Finance/TaxCompliance';
import Logistics from './views/02-Operations/Logistics';
import CustomerHub from './views/03-Sales/CustomerHub';
import DataMigration from './views/05-Admin/DataMigration';
import PlantStatus from './views/01-Operations/PlantStatus';
import Inventory from './views/01-Operations/Inventory';
import UserManagement from './views/05-Admin/UserManagement';
import Configuration from './views/05-Admin/Configuration';

import { NAV_ITEMS } from './utils/constants';
import { useAuth } from './hooks/useAuth';
import { useFirestoreQuery } from './hooks/useFirestoreQuery';

// Import all view components
import Dashboard from './views/Dashboard';
import SalesAnalytics from './views/03-Sales/SalesAnalytics';
// ... other implemented views
import NotFound from './views/NotFound';

const AppContent = () => {
    const [activeView, setActiveView] = useState('Dashboard');

    const renderView = () => {
        // Simple router logic
        switch (activeView) {
            case 'Dashboard':
                return <Dashboard />;
            case 'SalesAnalytics':
                return <SalesAnalytics />;

            case 'FinancialStatements': // Add new case
                return <FinancialStatements />;

            case 'AssetAndLoan': // Add new case
                return <AssetAndLoan />;

            case 'TaxCompliance': // Add new case
                return <TaxCompliance />;

            // Add cases for other implemented views here
            // case 'UserManagement':
            //     return <UserManagement />;
            default:
                return <NotFound />;
        }
    };
        const viewMap = {
            // ... other views
            PlantStatus,
            Inventory,
            Logistics,
            SalesAnalytics,
            CustomerHub,
            UserManagement,
            DataMigration, // Add new view
            Configuration, // Add new view
            // ... other views
        };

        
        const Component = viewMap[activeView];



    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
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
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
