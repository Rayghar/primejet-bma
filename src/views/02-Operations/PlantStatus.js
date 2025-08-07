// src/views/02-Operations/PlantStatus.js (NEW FILE)

import React from 'react';
import { useFirestoreQuery } from '../../hooks/useFirestoreQuery';
import { getPlantsQuery } from '../../api/firestoreService';

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';

const PlantStatusCard = ({ plant }) => {
    const statusColors = {
        Online: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
        Warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
        Offline: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
    };
    const color = statusColors[plant.status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
    const outputPercentage = (plant.outputToday / plant.capacity) * 100;

    return (
        <Card className={`border-l-4 ${color.border}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{plant.name}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${color.bg} ${color.text}`}>
                    {plant.status}
                </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500 uppercase">Uptime</p>
                    <p className={`text-2xl font-bold ${color.text}`}>{plant.uptime}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase">Output Today</p>
                    <p className="text-2xl font-bold text-gray-700">{plant.outputToday} kg</p>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-xs text-gray-500 text-right">{plant.capacity} kg Capacity</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${outputPercentage}%` }}></div>
                </div>
            </div>
        </Card>
    );
};

export default function PlantStatus() {
    const { docs: plants, loading } = useFirestoreQuery(getPlantsQuery());

    return (
        <>
            <PageTitle title="Multi-Plant Dashboard" subtitle="Real-time operational status of all plant locations." />
            
            {loading ? (
                <p>Loading plant status...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plants.length > 0 ? (
                        plants.map(plant => <PlantStatusCard key={plant.id} plant={plant} />)
                    ) : (
                        <p className="text-gray-500">No plant data found. Please add plants in the admin configuration.</p>
                    )}
                </div>
            )}
        </>
    );
}
