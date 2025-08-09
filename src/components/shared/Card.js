// =======================================================================
// src/components/shared/Card.js (NEW)
// A reusable card component for consistent styling.
// =======================================================================
import React from 'react';

export default function Card({ children, className = '', id = '' }) {
    return (
        <div id={id} className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
            {children}
        </div>
    );
}