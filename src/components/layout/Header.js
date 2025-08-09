// =======================================================================
// src/components/layout/Header.js (NEW)
// The top header bar of the application.
// =======================================================================
import React from 'react';
import { NAV_ITEMS } from '../../utils/constants';

export default function Header({ activeView }) {
    const currentView = NAV_ITEMS.find(item => item.id === activeView);
    const title = currentView ? currentView.label : 'Dashboard';

    return (
        <header className="flex items-center justify-between p-4 bg-white border-b">
            <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            {/* Future elements like search, notifications, or user menu can go here */}
        </header>
    );
}
