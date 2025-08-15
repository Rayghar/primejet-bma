// src/components/charts/LineChart.js (NEW)

import React from 'react';
import Card from '../shared/Card';  // Add this import

/**
 * A simple, dependency-free line chart component using SVG.
 * @param {object} props
 * @param {Array<object>} props.data - Data points, e.g., [{ label: 'Year 1', value: 100 }]
 * @param {string} props.title - The title of the chart.
 */
export default function LineChart({ data, title }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No data for chart.
            </div>
        );
    }

    const width = 500;
    const height = 300;
    const padding = 40;
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = 0;

    const getX = (index) => padding + (index / (data.length - 1)) * (width - padding * 2);
    const getY = (value) => height - padding - ((value - minValue) / (maxValue - minValue)) * (height - padding * 2);

    const linePath = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.value)}`).join(' ');

    const yAxisLabels = Array.from({ length: 6 }, (_, i) => {
        const value = (maxValue / 5) * i;
        return value > 1000000 ? `${(value / 1000000).toFixed(0)}M` : value > 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0);
    }).reverse();

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-Axis */}
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d1d5db" />
                {yAxisLabels.map((label, i) => (
                    <g key={i}>
                        <text x={padding - 10} y={(height - padding * 2)/5 * i + padding + 5} textAnchor="end" fontSize="10" fill="#6b7280">
                            {label}
                        </text>
                    </g>
                ))}

                {/* X-Axis */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d1d5db" />
                {data.map((p, i) => (
                     <text key={i} x={getX(i)} y={height - padding + 20} textAnchor="middle" fontSize="10" fill="#6b7280">
                        {p.label}
                    </text>
                ))}

                {/* Data Line */}
                <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />

                {/* Data Points */}
                {data.map((p, i) => (
                    <circle key={i} cx={getX(i)} cy={getY(p.value)} r="3" fill="#3b82f6" />
                ))}
            </svg>
        </Card>
    );
}