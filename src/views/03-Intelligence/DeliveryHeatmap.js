import React, { useState, useEffect } from 'react';
import { getHeatmapData } from '../../api/analyticsService';
import PageTitle from '../../components/shared/PageTitle';
import { Map, Layers } from 'lucide-react';

export default function DeliveryHeatmap() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getHeatmapData().then(data => {
            setPoints(data); // Expects { lat, lng, weight }
            setLoading(false);
        });
    }, []);

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <PageTitle title="Delivery Demand Heatmap" subtitle="Geospatial analysis of high-value zones" />
            </div>

            <div className="flex-1 glass-card p-0 relative overflow-hidden">
                {/* Placeholder for actual Google Map with HeatmapLayer */}
                <div className="absolute inset-0 bg-[#111] flex flex-col items-center justify-center">
                    {loading ? (
                        <p className="text-blue-400 animate-pulse">Loading Geospatial Data...</p>
                    ) : (
                        <div className="relative w-full h-full opacity-50">
                            {/* Simulated Heatmap Points */}
                            {points.slice(0, 50).map((pt, i) => (
                                <div 
                                    key={i}
                                    className="absolute rounded-full blur-xl"
                                    style={{
                                        top: `${(pt.lat * 1000) % 80 + 10}%`, 
                                        left: `${(pt.lng * 1000) % 80 + 10}%`,
                                        width: '60px',
                                        height: '60px',
                                        background: pt.weight > 50000 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.4)'
                                    }}
                                />
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <Map size={48} className="mx-auto text-gray-500 mb-2"/>
                                    <p className="text-gray-400">Interactive Map Component</p>
                                    <p className="text-xs text-gray-600">Overlaying {points.length} data points</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-6 left-6 glass p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Demand Intensity</h4>
                    <div className="flex items-center space-x-2 text-xs text-white">
                        <div className="w-20 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>Low</span>
                        <span>High Value</span>
                    </div>
                </div>
            </div>
        </div>
    );
}