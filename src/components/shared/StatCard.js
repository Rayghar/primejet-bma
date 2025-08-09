// =======================================================================
// src/components/shared/StatCard.js (NEW)
// A component for displaying key performance indicators.
// =======================================================================
import React from 'react';

export default function StatCard({ title, value, icon: Icon, color }) {
    const colorClasses = {
        green: 'from-green-500 to-green-600', blue: 'from-blue-500 to-blue-600',
        indigo: 'from-indigo-500 to-indigo-600', purple: 'from-purple-500 to-purple-600',
    };
    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-6 rounded-xl shadow-lg`}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-lg"><Icon size={24} /></div>
            </div>
        </div>
    );
};