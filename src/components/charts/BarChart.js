// src/components/charts/BarChart.js
import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * A simple, dependency-free bar chart component.
 * @param {object} props
 * @param {Array<object>} props.data - The data to display, e.g., [{ label: 'Jan', value: 1000 }]
 * @param {string} props.title - The title of the chart.
 */
export default function BarChart({ data, title }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No data available to display the chart.
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value));
    const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
        const value = (maxValue / 5) * i;
        return value > 1000000 ? `${(value / 1000000).toFixed(1)}M` : value > 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0);
    }).reverse();


    return (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <div className="flex" style={{ height: '300px' }}>
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-right pr-4 text-xs text-gray-500">
                    {yAxisLabels.map(label => <div key={label}>{label}</div>)}
                </div>

                {/* Chart Bars */}
                <div className="w-full flex justify-around items-end border-l border-b border-gray-200 pl-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end px-1 group">
                             <div 
                                className="w-full bg-blue-400 hover:bg-blue-600 rounded-t-md transition-all"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs text-center p-1 bg-gray-800 rounded-md -mt-8">
                                    {formatCurrency(item.value)}
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
