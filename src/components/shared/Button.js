// src/components/shared/Button.js
import React from 'react';

export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, icon: Icon }) {
    const baseClasses = "flex items-center justify-center font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]}`}
        >
            {Icon && <Icon size={20} className="mr-2" />}
            {children}
        </button>
    );
}