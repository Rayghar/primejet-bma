// src/components/layout/PageWrapper.js
import React from 'react';

export default function PageWrapper({ children }) {
    return (
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
            {children}
        </main>
    );
}