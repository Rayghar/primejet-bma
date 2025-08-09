// =======================================================================
// src/components/shared/Modal.js (NEW)
// A reusable modal component.
// =======================================================================
import React from 'react';

export default function Modal({ children, title, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
};