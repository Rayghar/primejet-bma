// src/components/shared/Card.js
import React from 'react';

export default function Card({ children, className = '' }) {
    return (
        <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
            {children}
        </div>
    );
}